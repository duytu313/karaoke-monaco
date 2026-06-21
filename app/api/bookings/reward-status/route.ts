import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

/**
 * API cho lễ tân xác nhận/từ chối thưởng khi thanh toán
 * - confirm: Đánh dấu reward là "used" (đã sử dụng)
 * - reject: Đánh dấu reward là "active" (trả về kho)
 */

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, rewardId, action, bookingId } = body;

    if (!userId || !rewardId || !action) {
      return NextResponse.json({ message: "Thiếu thông tin" }, { status: 400 });
    }

    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json({ message: "Action không hợp lệ" }, { status: 400 });
    }

    // Lấy userKey từ uidMap
    const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
    if (!uidSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy user" }, { status: 404 });
    }
    const userKey = uidSnapshot.val();

    if (action === "confirm") {
      // Xác nhận sử dụng thưởng
      await rtdb.ref(`users/profiles/${userKey}/rewardVault/${rewardId}`).update({
        status: "used",
        usedAt: Date.now(),
      });

      // Thông báo cho user
      const userNotifRef = rtdb.ref(`notifications/personal/${userId}`).push();
      await userNotifRef.set({
        title: "Thưởng đã được áp dụng",
        description: `Phần thưởng đã được áp dụng thành công cho đơn hàng.`,
        href: "/orders",
        type: "system",
        time: "Mới đây",
        createdAt: Date.now(),
        read: false,
      });
    } else {
      // Từ chối - trả thưởng về kho
      await rtdb.ref(`users/profiles/${userKey}/rewardVault/${rewardId}`).update({
        status: "active",
        reservedAt: null,
        bookingId: null,
      });

      // Thông báo cho user
      const userNotifRef = rtdb.ref(`notifications/personal/${userId}`).push();
      await userNotifRef.set({
        title: "Thưởng không được áp dụng",
        description: `Phần thưởng đã được trả về kho. Vui lòng liên hệ lễ tân để biết thêm chi tiết.`,
        href: "/wallet/reward-vault",
        type: "system",
        time: "Mới đây",
        createdAt: Date.now(),
        read: false,
      });
    }

    return NextResponse.json({
      message: action === "confirm" ? "Đã xác nhận thưởng" : "Đã trả thưởng về kho",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Reward status error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}