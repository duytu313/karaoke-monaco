"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Quyền riêng tư</h1>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-24 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Thu thập thông tin</h2>
          <p>
            Monaco Karaoke thu thập các thông tin cá nhân như họ tên, số điện thoại để phục vụ quá trình đặt lịch và tích lũy điểm thưởng.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Bảo mật dữ liệu</h2>
          <p>
            Chúng tôi cam kết không chia sẻ thông tin của bạn cho bên thứ ba ngoại trừ các trường hợp được pháp luật quy định.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Quyền của người dùng</h2>
          <p>
            Bạn có quyền yêu cầu xóa hoặc chỉnh sửa thông tin cá nhân bất cứ lúc nào thông qua phần quản lý tài khoản trên ứng dụng.
          </p>
        </section>
      </main>
    </div>
  )
}