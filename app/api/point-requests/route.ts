import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

const REWARD_CATALOG: Record<string, { title: string; pointsCost: number; description: string }> = {
  "Miễn phí 1 nước": {
    title: "Miễn phí 1 nước",
    pointsCost: 500,
    description: "Tặng 1 nước giải khát bất kỳ",
  },
  "Giảm 50k Massage": {
    title: "Giảm 50k Massage",
    pointsCost: 600,
    description: "Giảm 50,000đ cho dịch vụ Massage từ 500,000đ",
  },
  "Giảm 50,000đ": {
    title: "Giảm 50,000đ",
    pointsCost: 800,
    description: "Giảm 50,000đ cho hóa đơn từ 800,000đ",
  },
  "Giảm 100k Karaoke": {
    title: "Giảm 100k Karaoke",
    pointsCost: 1200,
    description: "Giảm 100,000đ cho Karaoke từ 1,000,000đ",
  },
  "Giảm 100,000đ": {
    title: "Giảm 100,000đ",
    pointsCost: 1500,
    description: "Giảm 100,000đ cho hóa đơn từ 1,500,000đ",
  },
  "Giảm 10%": {
    title: "Giảm 10%",
    pointsCost: 2000,
    description: "Giảm 10% cho hóa đơn từ 1,200,000đ",
  },
};

async function sendPointExchangeNotification(
  userId: string | undefined,
  title: string,
  description: string,
  href = "/wallet/point-exchange"
) {
  if (!userId || userId === "guest") return;

  const userNotifRef = rtdb.ref(`notifications/personal/${userId}`).push();
  await userNotifRef.set({
    title,
    description,
    href,
    type: "system",
    time: "Mới đây",
    createdAt: Date.now(),
    read: false,
  });
}

/**
 * API để gửi yêu cầu đổi điểm từ giao diện người dùng
 * Admin dashboard sẽ đọc từ database và quản lý
 * Khi admin duyệt: lưu vào rewardVault của user
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, customerName, reward, description } = body;

    if (!userId || !reward) {
      return NextResponse.json({ message: "Thiếu thông tin yêu cầu" }, { status: 400 });
    }

    const catalogReward = REWARD_CATALOG[reward];
    if (!catalogReward) {
      await sendPointExchangeNotification(
        userId,
        "Đổi điểm không thành công",
        "Phần thưởng bạn chọn không hợp lệ hoặc không còn khả dụng. Vui lòng chọn phần thưởng khác."
      );
      return NextResponse.json({ message: "Phần thưởng không hợp lệ" }, { status: 400 });
    }

    const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
    if (!uidSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const userKey = uidSnapshot.val();
    const pointsSnapshot = await rtdb.ref(`users/profiles/${userKey}/points`).once("value");
    const currentPoints = Number(pointsSnapshot.val() || 0);

    if (currentPoints < catalogReward.pointsCost) {
      await sendPointExchangeNotification(
        userId,
        "Đổi điểm không thành công",
        `Bạn chưa đủ ${catalogReward.pointsCost.toLocaleString("vi-VN")} điểm để đổi "${catalogReward.title}". Điểm hiện có: ${currentPoints.toLocaleString("vi-VN")}.`
      );
      return NextResponse.json({ message: "Không đủ điểm để gửi yêu cầu đổi thưởng" }, { status: 400 });
    }

    const now = Date.now();
    const dateStr = new Date().toLocaleDateString("vi-VN");

    // Lưu yêu cầu đổi điểm vào Firebase
    const pointRequestRef = rtdb.ref("pointRequests").push();
    await pointRequestRef.set({
      userId,
      customerName: customerName || "Khách hàng",
      reward: catalogReward.title,
      pointsCost: catalogReward.pointsCost,
      description: description || catalogReward.description,
      date: dateStr,
      status: "pending",
      createdAt: Date.now(),
    });

    // Gửi thông báo cho admin
    const adminNotifRef = rtdb.ref("notifications/global").push();
  await adminNotifRef.set({
    title: "Yêu cầu đổi điểm mới",
    description: `${customerName || "Khách hàng"} yêu cầu đổi "${catalogReward.title}" (${catalogReward.pointsCost.toLocaleString("vi-VN")} điểm)`,
    href: "/dashboard/point-requests",
    type: "system",
    time: "Mới đây",
    createdAt: Date.now(),
  });

    await sendPointExchangeNotification(
      userId,
      "Yêu cầu đổi điểm đã gửi",
      `Yêu cầu đổi "${catalogReward.title}" (${catalogReward.pointsCost.toLocaleString("vi-VN")} điểm) đã được gửi và đang chờ duyệt.`
    );

    return NextResponse.json({
      message: "Gửi yêu cầu đổi điểm thành công!",
      requestId: pointRequestRef.key,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Point request error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let snapshot;
    if (userId) {
      snapshot = await rtdb.ref("pointRequests")
        .orderByChild("userId")
        .equalTo(userId)
        .once("value");
    } else {
      snapshot = await rtdb.ref("pointRequests").once("value");
    }

    if (!snapshot.exists()) {
      return NextResponse.json({ requests: [] }, { status: 200 });
    }

    const data = snapshot.val();
    const requests = Object.entries(data)
      .map(([id, value]: [string, any]) => ({
        id,
        ...value,
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error("Get point requests error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
