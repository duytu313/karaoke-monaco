import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

const VOUCHER_CATALOG: Record<string, { title: string; description: string; pointsCost: number; code: string; minTotal: number; discountAmount?: number; discountRate?: number; serviceType: string }> = {
  "voucher-giam100k": {
    title: "Giảm 100,000đ",
    description: "Giảm 100,000đ cho hóa đơn từ 1,500,000đ",
    pointsCost: 1500,
    code: "VOUCHER100K",
    minTotal: 1500000,
    discountAmount: 100000,
    serviceType: "all",
  },
  "voucher-giam50k": {
    title: "Giảm 50,000đ",
    description: "Giảm 50,000đ cho hóa đơn từ 800,000đ",
    pointsCost: 800,
    code: "VOUCHER50K",
    minTotal: 800000,
    discountAmount: 50000,
    serviceType: "all",
  },
  "voucher-giam10pt": {
    title: "Giảm 10%",
    description: "Giảm 10% cho hóa đơn từ 1,200,000đ",
    pointsCost: 2000,
    code: "VOUCHER10PT",
    minTotal: 1200000,
    discountRate: 0.1,
    serviceType: "all",
  },
  "voucher-freedrink": {
    title: "Miễn phí 1 nước",
    description: "Tặng 1 nước giải khát bất kỳ",
    pointsCost: 500,
    code: "FREEDRINK",
    minTotal: 0,
    discountAmount: 50000,
    serviceType: "all",
  },
  "voucher-massage50k": {
    title: "Giảm 50k Massage",
    description: "Giảm 50,000đ cho dịch vụ Massage từ 500,000đ",
    pointsCost: 600,
    code: "MASSAGE50K",
    minTotal: 500000,
    discountAmount: 50000,
    serviceType: "massage",
  },
  "voucher-karaoke100k": {
    title: "Giảm 100k Karaoke",
    description: "Giảm 100,000đ cho Karaoke từ 1,000,000đ",
    pointsCost: 1200,
    code: "KARAOKE100K",
    minTotal: 1000000,
    discountAmount: 100000,
    serviceType: "karaoke",
  },
};

export async function POST(request: Request) {
  try {
    const { userId, voucherId } = await request.json();

    if (!userId || !voucherId) {
      return NextResponse.json({ message: "Thiếu thông tin" }, { status: 400 });
    }

    const voucher = VOUCHER_CATALOG[voucherId];
    if (!voucher) {
      return NextResponse.json({ message: "Voucher không hợp lệ" }, { status: 400 });
    }

    // Lấy username từ uidMap
    const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
    if (!uidSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }
    const userKey = uidSnapshot.val();

    const userRef = rtdb.ref(`users/profiles/${userKey}`);
    const userSnapshot = await userRef.once("value");
    if (!userSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy hồ sơ người dùng" }, { status: 404 });
    }

    const userData = userSnapshot.val();
    const currentPoints = userData.points || 0;

    if (currentPoints < voucher.pointsCost) {
      return NextResponse.json({ message: "Không đủ điểm" }, { status: 400 });
    }

    // Trừ điểm
    const newPoints = currentPoints - voucher.pointsCost;
    await userRef.update({ points: newPoints });

    // Lưu voucher đã đổi vào user
    const ownVoucherRef = rtdb.ref(`users/profiles/${userKey}/ownVouchers`).push();
    const voucherData = {
      id: voucherId,
      title: voucher.title,
      description: voucher.description,
      code: voucher.code,
      minTotal: voucher.minTotal,
      discountAmount: voucher.discountAmount || null,
      discountRate: voucher.discountRate || null,
      serviceType: voucher.serviceType,
      pointsUsed: voucher.pointsCost,
      redeemedAt: admin.database.ServerValue.TIMESTAMP,
      used: false,
      usedAt: null,
    };
    await ownVoucherRef.set(voucherData);

    // Ghi lịch sử điểm
    const pointHistoryRef = rtdb.ref(`users/profiles/${userKey}/pointHistory`).push();
    await pointHistoryRef.set({
      type: "spend",
      voucherCode: voucher.code,
      points: -voucher.pointsCost,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      description: `Đổi voucher "${voucher.title}"`,
    });

    // Gửi thông báo
    const notifRef = rtdb.ref(`notifications/personal/${userId}`).push();
    await notifRef.set({
      title: "Đổi voucher thành công",
      description: `Bạn đã đổi voucher "${voucher.title}" thành công! Mã: ${voucher.code}. Kiểm tra tại mục Voucher để sử dụng.`,
      href: "/wallet/vouchers",
      type: "system",
      time: "Mới đây",
      createdAt: admin.database.ServerValue.TIMESTAMP,
      read: false,
    });

    return NextResponse.json({
      message: `Đổi voucher "${voucher.title}" thành công!`,
      voucher: { ...voucherData, key: ownVoucherRef.key },
      newPoints,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Redeem voucher error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const vouchers = Object.entries(VOUCHER_CATALOG).map(([id, v]) => ({
      id,
      title: v.title,
      description: v.description,
      pointsCost: v.pointsCost,
      code: v.code,
      minTotal: v.minTotal,
      discountAmount: v.discountAmount,
      discountRate: v.discountRate,
      serviceType: v.serviceType,
    }));

    return NextResponse.json({ vouchers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}