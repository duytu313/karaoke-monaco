"use client"

import Link from "next/link"
import { ArrowLeft, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HelpPage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Hỗ trợ</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 mt-4">
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground px-1">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.</p>
          
          <div className="flex flex-col gap-4">
            <Card className="p-4 flex items-center gap-4 border-border/50">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Hotline hỗ trợ</p>
                <p className="font-bold text-foreground">084.680.7777</p>
              </div>
              <Button size="sm" className="bg-green-600">Gọi ngay</Button>
            </Card>

            <Card className="p-4 flex items-center gap-4 border-border/50">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Chat với hỗ trợ viên</p>
                <p className="font-bold text-foreground">Zalo / Messenger</p>
              </div>
              <Button size="sm" className="bg-blue-600">Nhắn tin</Button>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}