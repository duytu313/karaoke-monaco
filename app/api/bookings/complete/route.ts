import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ message: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const bookingRef = rtdb.ref(`bookings/${bookingId}`);
    const bookingSnapshot = await bookingRef.once("value");

    if (!bookingSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const bookingData = bookingSnapshot.val();
    if (bookingData?.status === "completed") {
      return NextResponse.json({ message: "Đơn hàng đã được hoàn thành trước đó" }, { status: 400 });
    }

    const userId = bookingData?.userId;
    const totalAmount = bookingData?.totalAmount || 0;
    const pointsToAdd = Math.floor(totalAmount / 10000);

    await bookingRef.update({ status: "completed" });

    if (userId && userId !== "guest") {
      const usernameSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value")
      const userKey = usernameSnapshot.exists() ? usernameSnapshot.val() : userId

      const userPointsRef = rtdb.ref(`users/profiles/${userKey}/points`)
      await userPointsRef.transaction((currentPoints: number | null) => {
        return (currentPoints || 0) + pointsToAdd
      })

      const pointHistoryRef = rtdb.ref(`users/profiles/${userKey}/pointHistory`).push()
      await pointHistoryRef.set({
        type: "earn",
        bookingId,
        points: pointsToAdd,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        description: `Tích điểm từ đơn hàng #${bookingId}`,
      })

      const notificationRef = rtdb.ref(`notifications/personal/${userId}`).push()
      await notificationRef.set({
        title: "Đơn hàng đã hoàn thành",
        description: `Đơn hàng #${bookingId} đã được hoàn thành. Bạn nhận được ${pointsToAdd} điểm.`,
        href: `/orders/${bookingId}`,
        type: "order",
        time: "Mới đây",
        createdAt: admin.database.ServerValue.TIMESTAMP,
        read: false,
      })

      const pointsNotificationRef = rtdb.ref(`notifications/personal/${userId}`).push()
      await pointsNotificationRef.set({
        title: "Bạn đã được cộng điểm",
        description: `Bạn vừa nhận ${pointsToAdd} điểm mới từ đơn hàng #${bookingId}.`,
        href: "/wallet",
        type: "system",
        time: "Mới đây",
        createdAt: admin.database.ServerValue.TIMESTAMP,
        read: false,
      })
    }

    return NextResponse.json({ message: "Hoàn thành đơn và tích điểm thành công", pointsAdded: pointsToAdd }, { status: 200 });
  } catch (error: any) {
    console.error("Complete Booking Error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}
