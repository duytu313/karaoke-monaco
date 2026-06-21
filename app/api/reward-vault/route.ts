import { NextResponse } from "next/server";
import { rtdb, admin } from "@/lib/firebaseAdmin";

/**
 * API cho kho thưởng của người dùng
 * Khi admin duyệt yêu cầu đổi điểm → lưu vào rewardVault
 * Khi user áp dụng vào đơn hàng → đánh dấu "used"
 * Tự động sync từ pointRequests đã duyệt nếu thiếu trong vault
 */

// Danh sách thưởng có thể đổi
const AVAILABLE_REWARDS: Record<string, any> = {
  "Miễn phí 1 nước": { title: "Miễn phí 1 nước", description: "Tặng 1 nước giải khát bất kỳ", discountAmount: 50000, minTotal: 0, serviceType: "all" },
  "Giảm 50k Massage": { title: "Giảm 50k Massage", description: "Giảm 50,000đ cho dịch vụ Massage từ 500,000đ", discountAmount: 50000, minTotal: 500000, serviceType: "massage" },
  "Giảm 50,000đ": { title: "Giảm 50,000đ", description: "Giảm 50,000đ cho hóa đơn từ 800,000đ", discountAmount: 50000, minTotal: 800000, serviceType: "all" },
  "Giảm 100k Karaoke": { title: "Giảm 100k Karaoke", description: "Giảm 100,000đ cho Karaoke từ 1,000,000đ", discountAmount: 100000, minTotal: 1000000, serviceType: "karaoke" },
  "Giảm 100,000đ": { title: "Giảm 100,000đ", description: "Giảm 100,000đ cho hóa đơn từ 1,500,000đ", discountAmount: 100000, minTotal: 1500000, serviceType: "all" },
  "Giảm 10%": { title: "Giảm 10%", description: "Giảm 10% cho hóa đơn từ 1,200,000đ", discountRate: 0.1, minTotal: 1200000, serviceType: "all" },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const statusFilter = searchParams.get("status"); // optional: "active", "used", etc.

    if (!userId) {
      return NextResponse.json({ message: "Thiếu userId" }, { status: 400 });
    }

    // Lấy username từ uidMap
    const uidSnapshot = await rtdb.ref(`users/uidMap/${userId}`).once("value");
    if (!uidSnapshot.exists()) {
      return NextResponse.json({ rewards: [] }, { status: 200 });
    }
    const userKey = uidSnapshot.val();

    // Lấy kho thưởng hiện tại
    const vaultSnapshot = await rtdb.ref(`users/profiles/${userKey}/rewardVault`)
      .orderByChild("createdAt")
      .once("value");

    let rewards: any[] = [];
    const existingRewardIds = new Set<string>();
    
    if (vaultSnapshot.exists()) {
      const data = vaultSnapshot.val();
      rewards = Object.entries(data)
        .map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      // Lưu lại các requestIds đã có trong vault
      rewards.forEach(r => {
        if (r.requestId) existingRewardIds.add(r.requestId);
      });
    }

    // Kiểm tra pointRequests đã duyệt và thêm vào vault nếu thiếu
    const pointRequestsSnapshot = await rtdb.ref("pointRequests")
      .orderByChild("userId")
      .equalTo(userId)
      .once("value");

    if (pointRequestsSnapshot.exists()) {
      const requests = pointRequestsSnapshot.val();
      const now = Date.now();

      for (const [reqId, reqData] of Object.entries<any>(requests)) {
        // Chỉ xử lý các yêu cầu đã duyệt và chưa có trong vault
        if (reqData.status === "approved" && !existingRewardIds.has(reqId)) {
          const rewardInfo = AVAILABLE_REWARDS[reqData.reward] || {
            title: reqData.reward,
            description: reqData.description || `Đổi ${reqData.reward}`,
            discountAmount: 50000,
            minTotal: 0,
            serviceType: "all"
          };

          // Thêm thưởng vào vault
          const vaultRef = rtdb.ref(`users/profiles/${userKey}/rewardVault`).push();
          const vaultData: any = {
            id: vaultRef.key,
            requestId: reqId,
            title: rewardInfo.title,
            description: rewardInfo.description,
            minTotal: rewardInfo.minTotal,
            serviceType: rewardInfo.serviceType,
            pointsCost: reqData.pointsCost,
            status: "active",
            createdAt: reqData.createdAt || now,
          };
          
          if (rewardInfo.discountAmount) {
            vaultData.discountAmount = rewardInfo.discountAmount;
          }
          if (rewardInfo.discountRate) {
            vaultData.discountRate = rewardInfo.discountRate;
          }
          
          await vaultRef.set(vaultData);

          const pointsCost = Number(reqData.pointsCost || 0);
          if (pointsCost > 0) {
            const historySnapshot = await rtdb.ref(`users/profiles/${userKey}/pointHistory`)
              .orderByChild("requestId")
              .equalTo(reqId)
              .once("value");

            if (!historySnapshot.exists()) {
              const historyRef = rtdb.ref(`users/profiles/${userKey}/pointHistory`).push();
              await historyRef.set({
                type: "spend",
                requestId: reqId,
                points: -pointsCost,
                timestamp: reqData.reviewedAt || reqData.createdAt || now,
                description: `Đổi thưởng "${rewardInfo.title}"`,
              });
            }
          }

          // Thêm vào danh sách rewards
          rewards.push({
            id: vaultRef.key,
            ...vaultData,
          });
        }
      }

      // Sắp xếp lại theo createdAt
      rewards.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    // Lọc theo status nếu có yêu cầu
    if (statusFilter) {
      rewards = rewards.filter(r => r.status === statusFilter);
    }

    return NextResponse.json({ rewards }, { status: 200 });
  } catch (error: any) {
    console.error("Reward vault error:", error);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
