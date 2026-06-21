import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

const TASKS = [
  {
    id: "first-booking",
    title: "Đặt phòng đầu tiên",
    description: "Tiến hành đặt phòng thành công lần đầu tiên",
    icon: "🎯",
    points: 200,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalBookings >= 1,
  },
  {
    id: "booking-3",
    title: "Khách quen",
    description: "Đặt phòng 3 lần",
    icon: "⭐",
    points: 500,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalBookings >= 3,
  },
  {
    id: "booking-5",
    title: "Tri kỷ Monaco",
    description: "Đặt phòng 5 lần",
    icon: "💎",
    points: 1000,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalBookings >= 5,
  },
  {
    id: "booking-10",
    title: "Đại gia Monaco",
    description: "Đặt phòng 10 lần",
    icon: "👑",
    points: 3000,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalBookings >= 10,
  },
  {
    id: "spend-1m",
    title: "Chi tiêu 1 triệu",
    description: "Tổng chi tiêu đạt 1,000,000đ",
    icon: "💰",
    points: 300,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalSpent >= 1000000,
  },
  {
    id: "spend-5m",
    title: "Chi tiêu 5 triệu",
    description: "Tổng chi tiêu đạt 5,000,000đ",
    icon: "💵",
    points: 800,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalSpent >= 5000000,
  },
  {
    id: "spend-10m",
    title: "Chi tiêu 10 triệu",
    description: "Tổng chi tiêu đạt 10,000,000đ",
    icon: "💎",
    points: 1500,
    condition: (counts: { totalBookings: number; totalSpent: number }) => counts.totalSpent >= 10000000,
  },
];

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: "Thiếu userId" }, { status: 400 });
    }

    // Lấy username từ uidMap
    const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
    if (!uidSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }
    const userKey = uidSnapshot.val();

    // Đếm số đơn và tổng chi tiêu
    const bookingsSnapshot = await rtdb.ref("bookings").orderByChild("userId").equalTo(userId).once("value");
    const bookings = bookingsSnapshot.val() || {};
    const bookingEntries = Object.values(bookings) as any[];

    const totalBookings = bookingEntries.length;
    const totalSpent = bookingEntries.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

    // Lấy các nhiệm vụ đã hoàn thành
    const completedTasksSnapshot = await rtdb.ref(`users/profiles/${userKey}/completedTasks`).once("value");
    const completedTasks = completedTasksSnapshot.val() || {};

    const results: any[] = [];
    let totalNewPoints = 0;

    for (const task of TASKS) {
      const isCompleted = completedTasks[task.id] === true;
      const canComplete = task.condition({ totalBookings, totalSpent });

      if (canComplete && !isCompleted) {
        // Hoàn thành nhiệm vụ - cộng điểm
        await rtdb.ref(`users/profiles/${userKey}/completedTasks/${task.id}`).set(true);

        // Cộng điểm
        const userRef = rtdb.ref(`users/profiles/${userKey}/points`);
        await userRef.transaction((current: number | null) => (current || 0) + task.points);

        // Ghi lịch sử
        await rtdb.ref(`users/profiles/${userKey}/pointHistory`).push({
          type: "task",
          taskId: task.id,
          points: task.points,
          timestamp: Date.now(),
          description: `Hoàn thành nhiệm vụ "${task.title}"`,
        });

        // Gửi thông báo
        await rtdb.ref(`notifications/personal/${userId}`).push({
          title: `🎉 Hoàn thành nhiệm vụ: ${task.title}`,
          description: `Bạn vừa nhận ${task.points} điểm từ nhiệm vụ "${task.title}".`,
          href: "/wallet/tasks",
          type: "system",
          time: "Mới đây",
          createdAt: Date.now(),
          read: false,
        });

        totalNewPoints += task.points;
        results.push({ id: task.id, title: task.title, points: task.points, status: "completed" });
      } else {
        results.push({
          id: task.id,
          title: task.title,
          points: task.points,
          icon: task.icon,
          description: task.description,
          status: isCompleted ? "claimed" : "pending",
          current: task.id.includes("booking")
            ? Math.min(totalBookings, parseInt(task.id.split("-")[1] || "1"))
            : undefined,
          target: parseInt(task.id.split("-")[1] || task.id.split("m")[0]?.replace("spend-", "") || "0"),
        });
      }
    }

    return NextResponse.json({
      results,
      stats: { totalBookings, totalSpent },
      newPoints: totalNewPoints,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Task check error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    tasks: TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon,
      points: t.points,
    })),
  }, { status: 200 });
}