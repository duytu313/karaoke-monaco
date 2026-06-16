import { rtdb, admin } from "./firebaseAdmin";

/**
 * Cấu trúc chính cho Monaco Karaoke sử dụng Realtime Database
 */

export interface User {
  authUid?: string;
  username?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  points: number;
  createdAt: number;
  birthday?: string;
  role?: string;
}

export interface Booking {
  userId: string;
  type: "karaoke" | "massage" | "restaurant";
  items?: any[];
  note?: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "in_use" | "finished" | "paid" | "completed" | "cancelled";
  createdAt: number;
}

export interface News {
  title: string;
  subtitle?: string;
  content: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  isActive: boolean;
  rules?: string[];
}

export interface PointExchange {
  exchangeTime: number;
  pointsUsed: number;
  userId: string;
  status: "pending" | "completed" | "cancelled";
  description: string;
  bookingId?: string;
}

export const initializeCollections = async () => {
  const now = Date.now();

  await rtdb.ref("settings").set({
    hotline: "084.680.7777",
    min_points_to_redeem: 100,
    app_version: "1.0.0",
    maintenance: false,
    defaultLanguage: "vi",
  });

  const rooms = [
    { id: "1", name: "Karaoke", type: "karaoke", category: "VIP", capacity: 20, price: 688000, priceNote: "đ/giờ", image: "/images/vip1.jpg", description: "Hệ thống phòng Karaoke đẳng cấp...", status: "available" },
    { id: "3", name: "Massage", type: "massage", category: "VIP", capacity: 1, price: 800000, priceNote: "đ/lượt", image: "/images/monaco1.jpg", description: "Dịch vụ Massage trị liệu...", status: "available" },
    { id: "5", name: "Nhà hàng", type: "restaurant", category: "VIP", capacity: 12, price: 1000000, priceNote: "đ/bàn", image: "/images/bg-intro.jpg", description: "Trải nghiệm ẩm thực tinh hoa...", status: "available" },
  ];

  const roomsMap: Record<string, any> = {};
  rooms.forEach((room) => {
    roomsMap[room.id] = room;
  });
  await rtdb.ref("rooms").set(roomsMap);

  const news = [
    {
      id: "weekend-sale",
      title: "Ưu đãi cuối tuần",
      subtitle: "Giảm đến 30%",
      content: "Chương trình khuyến mãi lớn nhất trong tuần...",
      startDate: new Date(now - 86400000 * 7).toISOString(),
      endDate: new Date(now + 86400000 * 7).toISOString(),
      imageUrl: "/images/bg-intro.jpg",
      isActive: true,
      rules: [
        "Áp dụng cho tất cả các loại phòng Karaoke.",
        "Giảm giá trực tiếp trên hóa đơn giờ hát.",
        "Không áp dụng đồng thời với các chương trình khuyến mãi khác.",
        "Thời gian áp dụng: Thứ 7 và Chủ Nhật hàng tuần.",
      ],
    },
    {
      id: "happy-hour",
      title: "Happy Hour",
      subtitle: "Mua 1 tặng 1 đồ uống",
      content: "Khung giờ vàng cho các tín đồ giải trí...",
      startDate: new Date(now - 86400000 * 3).toISOString(),
      endDate: new Date(now + 86400000 * 10).toISOString(),
      imageUrl: "/images/monaco1.jpg",
      isActive: true,
      rules: [
        "Áp dụng từ 14h đến 17h hàng ngày.",
        "Áp dụng cho các loại bia và nước ngọt chọn lọc.",
        "Tặng ngay 01 sản phẩm cùng loại khi mua 01 sản phẩm.",
        "Áp dụng cho khách hàng sử dụng dịch vụ tại quán.",
      ],
    },
  ];

  news.forEach((item) => {
    rtdb.ref(`news/${item.id}`).set(item);
  });

  console.log("Realtime Database seeded successfully!");
};