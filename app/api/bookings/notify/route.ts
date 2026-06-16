import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { bookingId, userId, status } = await request.json();

    if (!bookingId || !userId || !status) {
      return NextResponse.json({ message: "Thiếu thông tin" }, { status: 400 });
    }

    const notificationConfig: Record<string, { title: string; description: string }> = {
      "Đã xác nhận": {
        title: "Đơn hàng đã được xác nhận",
        description: `Đơn hàng #${bookingId.slice(-6)} của bạn đã được xác nhận. Chúng tôi sẽ phục vụ bạn trong thời gian sớm nhất!`,
      },
      "Đang dùng": {
        title: "Bắt đầu dịch vụ",
        description: `Phòng của bạn đã sẵn sàng. Chúc bạn có những phút giây thư giãn tuyệt vời tại Monaco!`,
      },
      "Đã hủy": {
        title: "Đơn hàng đã bị hủy",
        description: `Đơn hàng #${bookingId.slice(-6)} của bạn đã bị hủy. Nếu có thắc mắc vui lòng liên hệ hotline 084.680.7777.`,
      },
      "Đã thanh toán": {
        title: "Thanh toán hoàn tất",
        description: `Đơn hàng #${bookingId.slice(-6)} đã hoàn tất thanh toán. Cảm ơn và hẹn gặp lại quý khách!`,
      },
    };

    const config = notificationConfig[status];
    if (!config) {
      return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    if (userId && userId !== "guest") {
      const notificationRef = rtdb.ref(`notifications/personal/${userId}`).push();
      await notificationRef.set({
        title: config.title,
        description: config.description,
        href: `/orders/${bookingId}`,
        type: "order",
        time: "Mới đây",
        createdAt: admin.database.ServerValue.TIMESTAMP,
        read: false,
      });
    }

    return NextResponse.json({ message: "Thông báo đã được gửi" }, { status: 200 });
  } catch (error: any) {
    console.error("Send notification error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}