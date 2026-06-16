# 🎤 Monaco Karaoke UI

**Hệ thống đặt phòng Karaoke trực tuyến** — Ứng dụng web đặt phòng karaoke, quản lý ví điện tử, khuyến mãi và tích điểm.

## 🚀 Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| **Next.js 15** (App Router) | Framework React full-stack |
| **TypeScript** | An toàn kiểu dữ liệu |
| **Firebase Auth** | Xác thực người dùng (email, Google, etc.) |
| **Firebase Firestore** | Cơ sở dữ liệu chính |
| **Firebase Realtime DB** | Dữ liệu thời gian thực (RTDB Rules) |
| **Firebase Admin SDK** | Backend API (quản lý booking, seed data) |
| **Tailwind CSS v4** | Giao diện utility-first |
| **shadcn/ui** (Radix UI) | Component system |
| **Zod + react-hook-form** | Form validation |
| **Lucide React** | Biểu tượng UI |
| **Recharts** | Biểu đồ & thống kê |
| **date-fns** | Xử lý ngày tháng |
| **Sonner** | Toast notifications |

## ✨ Tính năng chính

- **Trang chủ / Splash** — Màn hình chào mừng, tự động chuyển đến intro
- **Giới thiệu (Intro)** — Slideshow giới thiệu ứng dụng
- **Đăng nhập / Đăng ký** — Auth với Firebase (email/password, Google, SMS OTP)
- **Quên mật khẩu** — Khôi phục mật khẩu
- **Trang chủ** — Dashboard tổng quan
- **Phòng hát** — Danh sách phòng karaoke & đặt phòng
- **Đặt phòng (Booking)** — Chọn phòng, dịch vụ, xác nhận & thanh toán
- **Đơn hàng** — Quản lý lịch sử đặt phòng
- **Ví điện tử** — Nạp tiền, lịch sử giao dịch, voucher giảm giá
- **Nhiệm vụ (Tasks)** — Làm nhiệm vụ nhận thưởng
- **Khuyến mãi** — Danh sách chương trình khuyến mãi
- **Thông báo** — Push notifications & thông báo trong ứng dụng
- **Tài khoản** — Hồ sơ, địa chỉ, cài đặt (ngôn ngữ, bảo mật, trợ giúp)
- **Responsive** — Hỗ trợ mobile-first với bottom navigation

## 📁 Cấu trúc thư mục

```
monaco-karaoke-ui/
├── app/                    # Next.js App Router
│   ├── (main)/            # Layout chính (sau đăng nhập)
│   │   ├── account/       # Quản lý tài khoản
│   │   ├── home/          # Trang chủ
│   │   ├── notifications/ # Thông báo
│   │   ├── orders/        # Đơn hàng
│   │   ├── promotions/    # Khuyến mãi
│   │   ├── rooms/         # Phòng hát & đặt phòng
│   │   └── wallet/        # Ví & voucher
│   ├── api/               # API routes (Firebase Admin)
│   ├── forgot-password/   # Quên mật khẩu
│   ├── intro/             # Giới thiệu
│   ├── login/             # Đăng nhập
│   └── register/          # Đăng ký
├── components/            # React components
│   ├── auth/              # Components xác thực
│   ├── layout/            # Layout (nav, header)
│   └── ui/                # shadcn/ui components
├── context/               # React Context (Auth)
├── hooks/                 # Custom hooks
├── lib/                   # Utilities & services
│   ├── firebase.ts        # Firebase client config
│   ├── firebaseAdmin.ts   # Firebase Admin SDK
│   ├── firestore-schema.ts# Firestore schema types
│   ├── database-schema.ts # RTDB schema types
│   └── rtdb-utils.ts      # RTDB utilities
├── public/                # Static assets
└── styles/                # Global styles
```

## 🔧 Cài đặt & chạy

### Yêu cầu

- Node.js >= 18
- npm / pnpm / yarn

### Các bước

```bash
# Clone repository
git clone <your-repo-url>
cd monaco-karaoke-ui

# Cài dependencies
pnpm install
# hoặc: npm install / yarn install

# Copy file env (liên hệ admin để lấy giá trị)
cp .env.example .env

# Chạy dev server
pnpm dev
# hoặc: npm run dev / yarn dev

# Build production
pnpm build
pnpm start
```

## 🌐 Biến môi trường

| Biến | Mô tả |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `FIREBASE_PROJECT_ID` | Firebase Admin Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Client Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Private Key |
| `DATABASE_URL` | Firebase Realtime Database URL |

> ⚠️ **QUAN TRỌNG**: Không commit file `.env` lên GitHub. File `.env` đã được liệt kê trong `.gitignore`.

## 📜 Scripts

| Script | Mô tả |
|---|---|
| `pnpm dev` | Chạy dev server (http://localhost:3000) |
| `pnpm build` | Build cho production |
| `pnpm start` | Chạy production server |
| `pnpm lint` | Kiểm tra code với ESLint |

## 🔐 Bảo mật

- **Firestore Security Rules** — Kiểm soát quyền truy cập dữ liệu
- **Realtime Database Rules** — Xác thực và phân quyền RTDB
- **Firebase Admin SDK** — API backend với quyền admin (chỉ chạy server-side)
- **Authentication** — Firebase Auth quản lý phiên đăng nhập

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/awesome-feature`)
3. Commit changes (`git commit -m 'Add awesome feature'`)
4. Push lên branch (`git push origin feature/awesome-feature`)
5. Mở Pull Request

## 📄 Giấy phép

Private — All rights reserved.