import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

/**
 * API tạo đơn đặt lịch
 * Hỗ trợ: voucher code, reward từ vault, ưu đãi khuyến mãi
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, type, items, note, bookingDate, bookingTime, 
      totalAmount, guestCount, 
      appliedVoucher, // { code, title, discountAmount?, discountRate? }
      appliedRewardId, // reward từ vault
      appliedRewardTitle,
      appliedRewardDiscount,
      appliedRewardDescription, // Thêm vào destructuring
      finalAmount,    // tổng sau giảm giá
    } = body;

    if (!bookingDate || !bookingTime || !type || typeof totalAmount !== "number") {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const bookingData: any = {
      userId: userId || "guest",
      type,
      items: items || [],
      services: items || [], // Lưu cả 2 field để tương thích
      note: note || "",
      bookingDate,
      bookingTime,
      totalAmount,
      finalAmount: typeof finalAmount === "number" ? finalAmount : totalAmount,
      guestCount: typeof guestCount === "number" ? guestCount : 1,
      guests: typeof guestCount === "number" ? guestCount : 1, // Lưu cả 2 field
      status: "Chờ xác nhận",
      createdAt: Date.now(),
    };

    // Lưu thông tin voucher/ưu đãi nếu có
    if (appliedVoucher) {
      bookingData.appliedVoucher = {
        code: appliedVoucher.code,
        title: appliedVoucher.title,
        discountAmount: appliedVoucher.discountAmount || null,
        discountRate: appliedVoucher.discountRate || null,
      };
    }
    if (appliedRewardId) {
      bookingData.appliedRewardId = appliedRewardId;
      if (appliedRewardTitle) {
        bookingData.appliedRewardTitle = appliedRewardTitle;
      }
      if (typeof appliedRewardDiscount === "number") {
        bookingData.appliedRewardDiscount = appliedRewardDiscount;
      }
      if (appliedRewardDescription) {
        bookingData.appliedRewardDescription = appliedRewardDescription; // Lưu mô tả vào database
      }
    }

    const newBookingRef = rtdb.ref("bookings").push();
    await newBookingRef.set(bookingData);

    // Nếu có reward từ vault, đánh dấu là đang sử dụng (chờ lễ tân xác nhận)
    if (appliedRewardId && userId && userId !== "guest") {
      const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
      if (uidSnapshot.exists()) {
        const userKey = uidSnapshot.val();
        await rtdb.ref(`users/profiles/${userKey}/rewardVault/${appliedRewardId}`).update({ 
          status: "pending_use", 
          reservedAt: Date.now(),
          bookingId: newBookingRef.key 
        });
      }
    }

    // Thông báo cho user
    if (userId && userId !== "guest") {
      const notificationRef = rtdb.ref(`notifications/personal/${userId}`).push();
      await notificationRef.set({
        title: "Đặt đơn thành công",
        description: `Đơn hàng #${newBookingRef.key} của bạn đã được tạo và đang chờ xác nhận.`,
        href: `/orders/${newBookingRef.key}`,
        type: "order",
        time: "Mới đây",
        createdAt: Date.now(),
        read: false,
      });

      // Thông báo cho admin
      const adminNotifRef = rtdb.ref("notifications/global").push();
      await adminNotifRef.set({
        title: "Đơn đặt lịch mới",
        description: `Đơn #${newBookingRef.key} - ${type} - ${new Intl.NumberFormat("vi-VN").format(finalAmount || totalAmount)}đ`,
        href: `/dashboard/bookings`,
        type: "order",
        time: "Mới đây",
        createdAt: Date.now(),
      });
    }

    return NextResponse.json({
      message: "Đặt lịch thành công",
      bookingId: newBookingRef.key,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create booking error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}