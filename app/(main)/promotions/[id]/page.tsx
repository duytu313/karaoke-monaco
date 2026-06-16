"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Share2, Calendar, Info, Ticket, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PromotionDetail {
  id: string
  title: string
  subtitle: string
  content: string
  startDate: string
  endDate: string
  imageUrl: string
  isActive: boolean
  rules: string[]
  featured: boolean
}

export default function PromotionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [promo, setPromo] = useState<PromotionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/promotions")
        const data = await res.json()
        const found = (data.promotions || []).find((p: any) => p.id === id)
        setPromo(found || null)
      } catch (error) {
        console.error("Error loading promotion:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  if (!promo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <Ticket className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <h1 className="text-xl font-bold">Không tìm thấy khuyến mãi</h1>
        <p className="text-muted-foreground mt-2">Nội dung này có thể đã hết hạn hoặc không tồn tại.</p>
        <Link href="/promotions" className="mt-6">
          <Button variant="default">Quay lại danh sách khuyến mãi</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      {/* Header Image */}
      <div className="relative p-4 shrink-0">
        <div className="relative h-64 w-full overflow-hidden rounded-3xl shadow-xl">
          <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        </div>
        
        {/* Top Actions */}
        <div className="absolute left-4 right-4 top-8 flex items-center justify-between px-4">
          <Link href="/promotions">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 -mt-6 relative z-10 space-y-6 pb-24">
        <Card className="p-4 border-border/50 bg-card/95 backdrop-blur shadow-lg">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Chi tiết ưu đãi</p>
            <h1 className="text-2xl font-bold text-foreground">{promo.title}</h1>
            {promo.subtitle && <p className="text-lg font-semibold text-accent">{promo.subtitle}</p>}
          </div>
          {(promo.startDate || promo.endDate) && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(promo.startDate)}</span>
              <span>→</span>
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(promo.endDate)}</span>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Mô tả chương trình</h2>
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
              <div className="absolute -right-6 -top-6 opacity-10 text-primary">
                <Ticket className="h-24 w-24 rotate-12" />
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed relative z-10 italic font-medium">
                "{promo.content}"
              </p>
            </div>
          </section>

          {promo.rules && promo.rules.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Điều kiện áp dụng
              </h2>
              <ul className="space-y-2.5">
                {promo.rules.map((rule, index) => (
                  <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* Bottom Action */}
      <div className="sticky bottom-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <Link href="/rooms">
          <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
            <Calendar className="h-5 w-5" />
            Đặt lịch sử dụng ngay
          </Button>
        </Link>
      </div>
    </div>
  )
}