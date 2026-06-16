import { NextResponse } from "next/server"; // Chỉ dùng rtdb
import { rtdb, admin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ message: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    // 1. Lấy thông tin đơn hàng từ Realtime Database
    const bookingRef = rtdb.ref(`bookings/${bookingId}`);
    const bookingSnapshot = await bookingRef.once('value');

    if (!bookingSnapshot.exists()) {
      return NextResponse.json({ message: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const bookingData = bookingSnapshot.val();
    if (bookingData?.status === "Đã thanh toán") {
      return NextResponse.json({ message: "Đơn hàng đã được hoàn thành trước đó" }, { status: 400 });
    }

    const userId = bookingData?.userId;
    const totalAmount = bookingData?.totalAmount || 0;
    const pointsToAdd = Math.floor(totalAmount / 10000); // 10,000đ = 1 điểm

    // 2. Cập nhật trạng thái đơn hàng và điểm người dùng trong Realtime Database
    // RTDB có transaction cho từng node, nhưng không có transaction đa node như Firestore
    // Nên ta sẽ cập nhật tuần tự, hoặc dùng Cloud Functions để đảm bảo atomicity tốt hơn
    await bookingRef.update({ status: "Đã thanh toán" });

    if (userId && userId !== "guest") {
      const usernameSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value")
      const userKey = usernameSnapshot.exists() ? usernameSnapshot.val() : userId

      // Cộng điểm cho user trong Realtime Database
      // Sử dụng transaction của RTDB để đảm bảo cập nhật điểm an toàn
      const userPointsRef = rtdb.ref(`users/profiles/${userKey}/points`)
      await userPointsRef.transaction((currentPoints: number | null) => {
        return (currentPoints || 0) + pointsToAdd
      })
      
      // Lưu lịch sử tích điểm vào một node riêng nếu cần
      const pointHistoryRef = rtdb.ref(`users/profiles/${userKey}/pointHistory`).push()
      await pointHistoryRef.set({
        type: "earn",
        bookingId: bookingId,
        points: pointsToAdd,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        description: `Tích điểm từ đơn hàng #${bookingId}`
      })

      // 3. Gửi thông báo hoàn thành đơn hàng và tích điểm
      const notificationRef = rtdb.ref(`notifications/personal/${userId}`).push();
      await notificationRef.set({
        title: "Thanh toán thành công",
        description: `Đơn hàng #${bookingId.slice(-5)} đã hoàn tất. Bạn đã tích thêm ${pointsToAdd} điểm. Cảm ơn quý khách!`,
        href: `/orders/${bookingId}`,
        type: "order",
        time: "Mới đây",
        createdAt: admin.database.ServerValue.TIMESTAMP,
        read: false,
      });
    }

    return NextResponse.json({ message: "Hoàn thành đơn và tích điểm thành công", pointsAdded: pointsToAdd }, { status: 200 });
  } catch (error: any) {
    console.error("Complete Booking Error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}
