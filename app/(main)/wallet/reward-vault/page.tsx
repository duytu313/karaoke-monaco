"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gift, Sparkles, Loader2, Ticket, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

export default function RewardVaultPage() {
  const { user } = useAuth()
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    // Fetch tất cả rewards (cả active và used)
    fetch(`/api/reward-vault?userId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setRewards(data.rewards || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const activeRewards = rewards.filter((r: any) => r.status === "active")
  const pendingRewards = rewards.filter((r: any) => r.status === "pending_use")
  const usedRewards = rewards.filter((r: any) => r.status === "used")

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/wallet">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Kho thưởng</h1>
            <p className="text-sm text-muted-foreground">Phần thưởng đã được duyệt</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 pb-24">
        {/* Phần thưởng đang hoạt động */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" /> Ưu đãi của bạn ({activeRewards.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" /></div>
          ) : activeRewards.length > 0 ? (
            <div className="space-y-3">
              {activeRewards.map((reward: any) => (
                <Card key={reward.id} className="p-4 border-emerald-200 bg-emerald-50/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 shrink-0">
                      <Ticket className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground">{reward.title}</h3>
                      <p className="text-xs text-muted-foreground">{reward.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          Sẵn sàng
                        </span>
                        {reward.discountAmount && (
                          <span className="text-[10px] font-bold text-primary">
                            Giảm {formatPrice(reward.discountAmount)}
                          </span>
                        )}
                        {reward.discountRate && (
                          <span className="text-[10px] font-bold text-primary">
                            Giảm {Math.round(reward.discountRate * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-sm text-muted-foreground italic border-dashed">
              Chưa có ưu đãi nào. Hãy đổi điểm để nhận ưu đãi!
            </Card>
          )}
        </section>

        {/* Đang sử dụng (chờ lễ tân xác nhận) */}
        {pendingRewards.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Đang sử dụng ({pendingRewards.length})
            </h2>
            <div className="space-y-2">
              {pendingRewards.map((reward: any) => (
                <Card key={reward.id} className="p-3 border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-100 shrink-0">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-800">{reward.title}</p>
                      <p className="text-[10px] text-amber-600">Đang chờ lễ tân xác nhận</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Đã sử dụng */}
        {usedRewards.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Đã sử dụng</h2>
            <div className="space-y-2">
              {usedRewards.map((reward: any) => (
                <Card key={reward.id} className="p-3 border-border/30 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-gray-200 shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 line-through">{reward.title}</p>
                      <p className="text-[10px] text-muted-foreground">Đã sử dụng</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}