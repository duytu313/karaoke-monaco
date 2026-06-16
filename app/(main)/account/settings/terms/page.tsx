"use client"

import Link from "next/link"
// import { admin } from "@/lib/firebaseAdmin"; // Không dùng Firestore Timestamp nữa
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Điều khoản</h1>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-24 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Quy định đặt phòng</h2>
          <p>
            Quý khách vui lòng có mặt đúng giờ đã đặt lịch. Nếu đến trễ quá 15 phút mà không thông báo, Monaco có quyền hủy lịch đặt để phục vụ khách khác.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Chính sách tích điểm</h2>
          <p>
            Điểm thưởng được tính dựa trên giá trị hóa đơn thực tế sau khi đã trừ các khoản giảm giá. Điểm không có giá trị quy đổi thành tiền mặt.
          </p>
        </section>

        <section className="space-y-3">
          <p className="italic text-xs">Cập nhật lần cuối: 22/05/2024</p>
        </section>
      </main>
    </div>
  )
}