import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

/**
 * API Utility để khôi phục và đồng bộ điểm từ tất cả các đơn hàng đã thanh toán.
 */
export async function POST(request: Request) {
  try {
    const bookingsSnapshot = await rtdb.ref("bookings").once("value");
    if (!bookingsSnapshot.exists()) {
      return NextResponse.json({ message: "Không có dữ liệu đơn hàng" });
    }

    const bookings = bookingsSnapshot.val();
    const stats = { total: 0, processed: 0, synced: 0, skipped: 0 };

    for (const [bookingId, data] of Object.entries(bookings) as [string, any][]) {
      stats.total++;
      
      // Lọc các đơn chính xác là "Đã thanh toán" và thuộc về thành viên
      const isPaid = data.status === "Đã thanh toán";
      const isMember = data.userId && data.userId !== "guest";

      if (isPaid && isMember) {
        stats.processed++;
        const userId = data.userId;
        
        // Ưu tiên điểm đã có sẵn trong đơn hàng
        let pointsToAdd = 0;
        let finalAmount = 0;

        // Ưu tiên sử dụng điểm đã được ghi nhận trên đơn hàng nếu có
        const existingPoints = data.pointsEarned ?? data.points;

        const roomPrice = Number(data.totalEst || data.roomPrice || 0);
        const services = data.services || data.items || [];
        const servicesTotal = services.reduce((sum: number, s: any) => sum + (s.price * (s.quantity || s.qty || 1)), 0);
        const totalAmount = Number(data.totalAmount || 0);
        const paidAmount = Number(data.paidAmount || 0);
        const subtotal = Math.max(totalAmount, roomPrice + servicesTotal, paidAmount);

        if (typeof existingPoints === 'number' && existingPoints > 0) {
          pointsToAdd = existingPoints;
          finalAmount = data.finalAmount || subtotal;
        } else {
          let voucherDiscount = 0;
          if (data.appliedVoucher) {
            const v = data.appliedVoucher;
            voucherDiscount = v.discountAmount ? Math.min(v.discountAmount, subtotal) : 
                              (v.discountRate ? Math.floor(subtotal * v.discountRate) : 0);
          }
          const rewardDiscount = Number(data.appliedRewardDiscount || 0);
          finalAmount = Math.max(0, subtotal - voucherDiscount - rewardDiscount);
          pointsToAdd = Math.floor(finalAmount / 10000);
        }

        if (pointsToAdd <= 0) {
          stats.skipped++;
          continue;
        }

        // Lấy username (userKey) từ uidMap hoặc tìm trong profiles
        const uidMapSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
        let userKey = uidMapSnapshot.exists() ? uidMapSnapshot.val() : null;

        if (!userKey) {
          // Fallback: Nếu uidMap không có, tìm trong profiles dựa trên authUid
          const profilesSnapshot = await rtdb.ref("users/profiles").once("value");
          const profiles = profilesSnapshot.exists() ? profilesSnapshot.val() : {};
          const profileByAuthUid = Object.entries(profiles).find(([, prof]: [string, any]) => prof.authUid === userId);
          userKey = profileByAuthUid ? profileByAuthUid[0] : userId; // Nếu vẫn không tìm thấy, dùng userId làm key (ít lý tưởng)
        }

        // Kiểm tra xem đã có lịch sử cho đơn này chưa (dựa trên bookingId)
        const historyRef = rtdb.ref(`users/profiles/${userKey}/pointHistory`);
        const historySnapshot = await historyRef.orderByChild("bookingId").equalTo(bookingId).once("value");
        const historyExists = historySnapshot.exists();
        const storedPoints = data.pointsEarned || 0;

        // Cho phép đồng bộ nếu chưa có lịch sử HOẶC số điểm đã lưu khác với số điểm tính toán lại (sửa sai)
        if (!historyExists || storedPoints !== pointsToAdd) {
          const diff = pointsToAdd - storedPoints;

          // 1. Cập nhật/Đánh dấu lại thông tin điểm vào Object Booking
          await rtdb.ref(`bookings/${bookingId}`).update({
            pointsEarned: pointsToAdd,
            finalAmount: finalAmount,
            paidAmount: data.paidAmount || finalAmount
          });

          // 2. Tạo hoặc cập nhật bản ghi lịch sử điểm
          const historyData = {
            type: "earn",
            bookingId,
            points: pointsToAdd,
            timestamp: data.completedAt || data.createdAt || Date.now(),
            description: `Khôi phục tích điểm đơn #${bookingId} (${new Intl.NumberFormat("vi-VN").format(finalAmount)}đ)`,
          };

          if (!historyExists) {
            await historyRef.push(historyData);
          } else {
            const entryKey = Object.keys(historySnapshot.val())[0];
            await rtdb.ref(`users/profiles/${userKey}/pointHistory/${entryKey}`).update(historyData);
          }

          // 3. Cộng dồn vào tổng điểm của User (Dùng transaction để tránh sai sót)
          if (diff !== 0) {
            const userPointsRef = rtdb.ref(`users/profiles/${userKey}/points`);
            await userPointsRef.transaction((current) => (current || 0) + diff);
          }
          
          stats.synced++;
        } else {
          stats.skipped++;
        }
      } else {
        stats.skipped++;
      }
    }

    return NextResponse.json({ 
      message: `Đồng bộ hoàn tất! Đã khôi phục ${stats.synced} đơn hàng.`, 
      stats 
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống", error: error.message }, { status: 500 });
  }
}