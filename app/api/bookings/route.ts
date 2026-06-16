import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, items, note, bookingDate, bookingTime, totalAmount, guestCount } = body;

    if (!bookingDate || !bookingTime || !type || typeof totalAmount !== "number") {
      return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const newBookingRef = rtdb.ref("bookings").push();
    await newBookingRef.set({
      userId: userId || "guest",
      type,
      items: items || [],
      note: note || "",
      bookingDate,
      bookingTime,
      totalAmount,
      guestCount: typeof guestCount === "number" ? guestCount : 1,
      status: "Chờ xác nhận",
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    if (userId && userId !== "guest") {
      const notificationRef = rtdb.ref(`notifications/personal/${userId}`).push();
      await notificationRef.set({
        title: "Đặt đơn thành công",
        description: `Đơn hàng #${newBookingRef.key} của bạn đã được tạo và đang chờ xác nhận. Vui lòng chờ nhân viên xác nhận.`,
        href: `/orders/${newBookingRef.key}`,
        type: "order",
        time: "Mới đây",
        createdAt: admin.database.ServerValue.TIMESTAMP,
        read: false,
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
