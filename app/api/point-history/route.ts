import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebaseAdmin";

function calculateBookingPoints(data: any) {
  const paidAmount = Number(data.paidAmount || 0);
  const roomPrice = Number(data.totalEst || data.roomPrice || 0);
  const services = data.services || data.items || [];
  const servicesTotal = services.reduce((sum: number, item: any) => {
    return sum + Number(item.price || 0) * Number(item.quantity || item.qty || 1);
  }, 0);
  const totalAmount = Number(data.totalAmount || 0);
  const subtotal = data.status === "Đã thanh toán" && paidAmount > 0
    ? paidAmount
    : Math.max(totalAmount, roomPrice + servicesTotal, paidAmount);

  let voucherDiscount = 0;
  if (data.appliedVoucher) {
    if (data.appliedVoucher.discountAmount) {
      voucherDiscount = Math.min(Number(data.appliedVoucher.discountAmount), subtotal);
    } else if (data.appliedVoucher.discountRate) {
      voucherDiscount = Math.floor(subtotal * Number(data.appliedVoucher.discountRate));
    }
  }

  const rewardDiscount = Number(data.appliedRewardDiscount || 0);
  const finalAmount = Math.max(0, subtotal - voucherDiscount - rewardDiscount);

  return {
    finalAmount,
    points: Math.floor(finalAmount / 10000),
  };
}

/**
 * API để lấy lịch sử điểm thực tế của người dùng từ Firebase
 * Dữ liệu được đồng bộ từ:
 *   - Tích điểm: booking complete (app/api/bookings/complete/route.ts)
 *   - Tiêu điểm: đổi voucher (app/api/vouchers/redeem/route.ts)
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Thiếu userId" }, { status: 400 });
    }

    // Lấy username (userKey) từ uidMap hoặc tìm trong profiles
    const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
    let userKey = uidSnapshot.exists() ? uidSnapshot.val() : null;

    if (!userKey) {
      // Fallback: Nếu uidMap không có, tìm trong profiles dựa trên authUid
      const profilesSnapshot = await rtdb.ref("users/profiles").once("value");
      const profiles = profilesSnapshot.exists() ? profilesSnapshot.val() : {};
      const profileByAuthUid = Object.entries(profiles).find(([, prof]: [string, any]) => prof.authUid === userId);
      userKey = profileByAuthUid ? profileByAuthUid[0] : userId; // Nếu vẫn không tìm thấy, dùng userId làm key (ít lý tưởng)
    }

    const profileRef = rtdb.ref(`users/profiles/${userKey}`);
    const historyRef = profileRef.child("pointHistory");
    const pointsSnapshot = await profileRef.child("points").once("value");
    const storedProfilePoints = Number(pointsSnapshot.val() || 0);

    // Đồng bộ các đơn đã thanh toán vào lịch sử điểm nếu đang thiếu.
    const [bookingsSnapshot, initialHistorySnapshot] = await Promise.all([
      rtdb.ref("bookings").orderByChild("userId").equalTo(userId).once("value"),
      historyRef.once("value"),
    ]);

    const initialHistory = initialHistorySnapshot.exists() ? initialHistorySnapshot.val() : {};
    const historyByBookingId = new Map<string, { key: string; value: any }>();
    const historyByRequestId = new Map<string, { key: string; value: any }>();
    Object.entries(initialHistory).forEach(([key, value]: [string, any]) => {
      if (value?.bookingId) {
        historyByBookingId.set(value.bookingId, { key, value });
      }
      if (value?.requestId) {
        historyByRequestId.set(value.requestId, { key, value });
      }
    });

    const updates: Record<string, any> = {};
    if (bookingsSnapshot.exists()) {
      const bookings = bookingsSnapshot.val();
      Object.entries(bookings).forEach(([bookingId, bookingData]: [string, any]) => {
        if (bookingData.status !== "Đã thanh toán") return;

        const { finalAmount, points } = calculateBookingPoints(bookingData);
        if (points <= 0) return;

        const existingHistory = historyByBookingId.get(bookingId);
        const historyData = {
          type: "earn",
          bookingId,
          points,
          timestamp: bookingData.completedAt || bookingData.createdAt || Date.now(),
          description: `Tích điểm từ đơn hàng #${bookingId} (${new Intl.NumberFormat("vi-VN").format(finalAmount)}đ)`,
        };

        if (!existingHistory) {
          const newHistoryRef = historyRef.push();
          updates[`users/profiles/${userKey}/pointHistory/${newHistoryRef.key}`] = historyData;
        } else if (Number(existingHistory.value.points || 0) !== points) {
          updates[`users/profiles/${userKey}/pointHistory/${existingHistory.key}`] = {
            ...existingHistory.value,
            ...historyData,
          };
        }

        if (Number(bookingData.pointsEarned || 0) !== points) {
          updates[`bookings/${bookingId}/pointsEarned`] = points;
          updates[`bookings/${bookingId}/finalAmount`] = finalAmount;
          updates[`bookings/${bookingId}/paidAmount`] = bookingData.paidAmount || finalAmount;
        }
      });
    }

    // Đồng bộ các yêu cầu đổi điểm đã duyệt nhưng thiếu dòng lịch sử trừ điểm.
    const pointRequestsSnapshot = await rtdb.ref("pointRequests")
      .orderByChild("userId")
      .equalTo(userId)
      .once("value");

    if (pointRequestsSnapshot.exists()) {
      const pointRequests = pointRequestsSnapshot.val();
      Object.entries(pointRequests).forEach(([requestId, requestData]: [string, any]) => {
        if (requestData.status !== "approved") return;
        if (historyByRequestId.has(requestId)) return;

        const pointsCost = Number(requestData.pointsCost || 0);
        if (pointsCost <= 0) return;

        const newHistoryRef = historyRef.push();
        updates[`users/profiles/${userKey}/pointHistory/${newHistoryRef.key}`] = {
          type: "spend",
          requestId,
          points: -pointsCost,
          timestamp: requestData.reviewedAt || requestData.createdAt || Date.now(),
          description: `Đổi thưởng "${requestData.reward || "Ưu đãi"}"`,
        };
      });
    }

    if (Object.keys(updates).length > 0) {
      await rtdb.ref().update(updates);
    }

    // Lấy lịch sử điểm sau khi đồng bộ.
    const historySnapshot = await historyRef
      .orderByChild("timestamp")
      .once("value");

    let history: any[] = [];
    let historyPointsTotal = 0;

    if (historySnapshot.exists()) {
      const data = historySnapshot.val();
      history = Object.entries(data)
        .map(([id, value]: [string, any]) => {
          const signedPoints = Number(value.points || 0);
          historyPointsTotal += signedPoints;

          return {
            id,
            type: signedPoints < 0 ? "spend" : (value.type || "earn"),
            points: Math.abs(signedPoints),
            description: value.description || "",
            timestamp: value.timestamp || 0,
            bookingId: value.bookingId || null,
            voucherCode: value.voucherCode || null,
          };
        })
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    const currentPoints = historySnapshot.exists()
      ? Math.max(0, historyPointsTotal)
      : storedProfilePoints;

    if (currentPoints !== storedProfilePoints) {
      await profileRef.child("points").set(currentPoints);
    }

    return NextResponse.json({
      history,
      points: currentPoints,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Point history error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
