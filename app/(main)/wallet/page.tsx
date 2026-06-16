"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, TrendingUp, History, Gift, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { fetchUserBookings } from "@/lib/rtdb-utils"
import { cn } from "@/lib/utils"

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getRank = (points: number) => {
    if (points >= 5000) return { label: "Kim Cương", color: "text-blue-400" }
    if (points >= 2000) return { label: "Vàng", color: "text-yellow-300" } // Màu vàng cho hạng Vàng
    if (points >= 500) return { label: "Bạc", color: "text-slate-300" } // Màu bạc cho hạng Bạc
    return { label: "Thành viên", color: "text-primary-foreground" } // Màu mặc định
  }

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const bookings = await fetchUserBookings(user.uid)
          const historyData = bookings
            ? Object.entries(bookings as Record<string, any>)
                .filter(([, data]) => data.status === "completed")
                .map(([key, data]) => ({
                  id: key,
                  type: 'earn',
                  title: 'Tích điểm đặt phòng',
                  date: data.bookingDate,
                  points: Math.floor((data.totalAmount || 0) / 10000),
                  createdAt: data.createdAt || 0,
                }))
                .sort((a, b) => b.createdAt - a.createdAt)
            : []
          setTransactions(historyData)
        } catch (error) {
          console.error("Error fetching wallet history:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchHistory()
    }
  }, [user])

  if (authLoading) return <div className="min-h-screen flex items-center justify-center italic text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Đang tải...</div>

  const userPoints = user?.points || 0
  const rank = getRank(userPoints)

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Ví điểm Monaco</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Balance Card */}
        <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl border-none">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Tổng điểm hiện có</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black tracking-tight">{user?.points?.toLocaleString() || 0}</h2>
              <span className="text-lg font-medium opacity-80 text-yellow-300">điểm</span>
            </div>
            <div className="pt-2 flex gap-3 text-[11px] font-bold uppercase tracking-wider">
               <div className={cn("bg-white/20 px-2 py-1 rounded", rank.color)}>Hạng: {rank.label}</div>
               {/* Ngày hết hạn cần logic phức tạp hơn, tạm thời hiển thị thông báo */}
               {userPoints > 0 && <div className="bg-white/20 px-2 py-1 rounded">Hạn: Vĩnh viễn</div>}
               {userPoints === 0 && <div className="bg-white/20 px-2 py-1 rounded">Tích điểm để lên hạng</div>}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/wallet/vouchers" className="block">
            <Button variant="outline" className="h-14 w-full rounded-2xl border-border/50 gap-3 font-bold text-sm bg-card shadow-sm active:scale-95 transition-all">
              <Gift className="h-5 w-5 text-primary" />
              Đổi Voucher
            </Button>
          </Link>
          <Link href="/wallet/tasks" className="block">
            <Button variant="outline" className="h-14 w-full rounded-2xl border-border/50 gap-3 font-bold text-sm bg-card shadow-sm active:scale-95 transition-all">
              <TrendingUp className="h-5 w-5 text-primary" />
              Nhiệm vụ
            </Button>
          </Link>
        </div>

        {/* Transaction History */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4" /> Lịch sử điểm
            </h3>
          </div>

          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /></div>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-card">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-green-500/10 text-green-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">{t.title}</h4>
                    <p className="text-[11px] text-muted-foreground italic">Ngày: {t.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-base text-green-600">+{t.points}</span>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">điểm</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <Sparkles className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground italic">Chưa có lịch sử tích điểm</p>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  )
}