"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gift, Sparkles, Loader2, Check, AlertTriangle, X, History, Clock, CheckCircle2, XCircle, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface AvailableReward {
  id: string
  title: string
  description: string
  pointsCost: number
  code: string
  minTotal: number
  discountAmount?: number
  discountRate?: number
  serviceType: string
}

const DEFAULT_REWARDS: AvailableReward[] = [
  {
    id: "voucher-freedrink",
    title: "Miễn phí 1 nước",
    description: "Tặng 1 nước giải khát bất kỳ",
    pointsCost: 500,
    code: "FREEDRINK",
    minTotal: 0,
    discountAmount: 50000,
    serviceType: "all",
  },
  {
    id: "voucher-massage50k",
    title: "Giảm 50k Massage",
    description: "Giảm 50,000đ cho dịch vụ Massage từ 500,000đ",
    pointsCost: 600,
    code: "MASSAGE50K",
    minTotal: 500000,
    discountAmount: 50000,
    serviceType: "massage",
  },
  {
    id: "voucher-giam50k",
    title: "Giảm 50,000đ",
    description: "Giảm 50,000đ cho hóa đơn từ 800,000đ",
    pointsCost: 800,
    code: "VOUCHER50K",
    minTotal: 800000,
    discountAmount: 50000,
    serviceType: "all",
  },
  {
    id: "voucher-karaoke100k",
    title: "Giảm 100k Karaoke",
    description: "Giảm 100,000đ cho Karaoke từ 1,000,000đ",
    pointsCost: 1200,
    code: "KARAOKE100K",
    minTotal: 1000000,
    discountAmount: 100000,
    serviceType: "karaoke",
  },
  {
    id: "voucher-giam100k",
    title: "Giảm 100,000đ",
    description: "Giảm 100,000đ cho hóa đơn từ 1,500,000đ",
    pointsCost: 1500,
    code: "VOUCHER100K",
    minTotal: 1500000,
    discountAmount: 100000,
    serviceType: "all",
  },
  {
    id: "voucher-giam10pt",
    title: "Giảm 10%",
    description: "Giảm 10% cho hóa đơn từ 1,200,000đ",
    pointsCost: 2000,
    code: "VOUCHER10PT",
    minTotal: 1200000,
    discountRate: 0.1,
    serviceType: "all",
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

export default function PointExchangePage() {
  const { user } = useAuth()

  const [availableRewards, setAvailableRewards] = useState<AvailableReward[]>(DEFAULT_REWARDS)
  const [selectedReward, setSelectedReward] = useState<AvailableReward | null>(null)
  const [pointsCost, setPointsCost] = useState("")
  const [rewardTitle, setRewardTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Tải danh sách voucher có thể đổi từ API
  useEffect(() => {
    fetch("/api/vouchers/redeem")
      .then((res) => res.json())
      .then((data) => {
        if (data.vouchers && data.vouchers.length > 0) {
          setAvailableRewards(data.vouchers)
        }
      })
      .catch(() => {
        // Dùng danh sách mặc định nếu API lỗi
      })
  }, [])

  // Tải lịch sử yêu cầu của user
  useEffect(() => {
    if (!user?.uid) {
      setLoadingHistory(false)
      return
    }

    fetch(`/api/point-requests?userId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || [])
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false))
  }, [user])

  const selectReward = (reward: AvailableReward) => {
    setSelectedReward(reward)
    setRewardTitle(reward.title)
    setPointsCost(String(reward.pointsCost))
    setDescription(`Đổi voucher: ${reward.title} - ${reward.description}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid || !rewardTitle || !pointsCost) return

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch("/api/point-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          customerName: user.name || user.email || "Khách hàng",
          reward: rewardTitle,
          pointsCost: Number(pointsCost),
          description,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Gửi yêu cầu thành công!" })
        setSelectedReward(null)
        setRewardTitle("")
        setPointsCost("")
        setDescription("")
        // Reload history
        const histRes = await fetch(`/api/point-requests?userId=${user.uid}`)
        const histData = await histRes.json()
        setRequests(histData.requests || [])
      } else {
        setMessage({ type: "error", text: data.message || "Có lỗi xảy ra" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi kết nối" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit">
            <Clock className="w-3 h-3 mr-1" /> Chờ duyệt
          </span>
        )
      case "approved":
        return (
          <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã duyệt
          </span>
        )
      case "rejected":
        return (
          <span className="flex items-center text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit">
            <XCircle className="w-3 h-3 mr-1" /> Từ chối
          </span>
        )
      default:
        return null
    }
  }

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
            <h1 className="text-lg font-bold text-foreground">Yêu cầu đổi điểm</h1>
            <p className="text-sm text-muted-foreground">Chọn phần thưởng bên dưới để đổi</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 pb-24">
        {/* Thông báo */}
        {message && (
          <div className={cn(
            "rounded-2xl p-4 border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
            message.type === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          )}>
            {message.type === "success" ? (
              <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className={cn(
              "text-sm font-medium flex-1",
              message.type === "success" ? "text-emerald-800" : "text-red-800"
            )}>
              {message.text}
            </p>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setMessage(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Số điểm hiện có */}
        {user && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Số điểm của bạn:</span>
            <span className="text-xl font-black text-primary">{user.points?.toLocaleString() || 0}</span>
          </div>
        )}

        {/* Danh sách phần thưởng có thể đổi */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Phần thưởng có thể đổi</h2>
          </div>

          <div className="space-y-3">
            {availableRewards.map((reward) => {
              const canAfford = (user?.points || 0) >= reward.pointsCost
              return (
                <Card
                  key={reward.id}
                  className={cn(
                    "border overflow-hidden cursor-pointer transition-all hover:shadow-md",
                    selectedReward?.id === reward.id
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : canAfford
                      ? "border-border/50 bg-card"
                      : "border-border/30 bg-muted/30 opacity-60"
                  )}
                  onClick={() => canAfford && selectReward(reward)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{reward.title}</h3>
                          {selectedReward?.id === reward.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{reward.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {reward.discountAmount && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                              Giảm {formatPrice(reward.discountAmount)}
                            </span>
                          )}
                          {reward.discountRate && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                              Giảm {Math.round(reward.discountRate * 100)}%
                            </span>
                          )}
                          {reward.serviceType !== "all" && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              {reward.serviceType === "karaoke" ? "Karaoke" : reward.serviceType === "massage" ? "Massage" : "Nhà hàng"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-lg font-black",
                          canAfford ? "text-primary" : "text-muted-foreground"
                        )}>
                          {reward.pointsCost.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">điểm</p>
                      </div>
                    </div>
                    {!canAfford && (
                      <div className="mt-2 text-[10px] text-red-500 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Bạn cần thêm {(reward.pointsCost - (user?.points || 0)).toLocaleString()} điểm
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Form gửi yêu cầu - chỉ hiện khi đã chọn phần thưởng */}
        {selectedReward && (
          <Card className="p-5 border-primary/30 bg-card space-y-4 ring-1 ring-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-foreground">Xác nhận đổi: {selectedReward.title}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reward" className="text-sm font-medium text-foreground">
                  Phần thưởng
                </Label>
                <Input
                  id="reward"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="bg-background border-border/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pointsCost" className="text-sm font-medium text-foreground">
                  Số điểm cần dùng
                </Label>
                <Input
                  id="pointsCost"
                  type="number"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(e.target.value)}
                  className="bg-background border-border/50 font-bold text-primary"
                  required
                  min={1}
                  max={user?.points || 0}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Ghi chú (không bắt buộc)
                </Label>
                <textarea
                  id="description"
                  placeholder="Ghi chú thêm về yêu cầu..."
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 resize-none min-h-[60px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs text-amber-800 font-medium text-center">
                  Bạn sẽ dùng <span className="font-black">{Number(pointsCost).toLocaleString()} điểm</span> để đổi phần thưởng này
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 font-medium"
                  onClick={() => {
                    setSelectedReward(null)
                    setRewardTitle("")
                    setPointsCost("")
                    setDescription("")
                  }}
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  className="flex-1 font-bold bg-primary hover:bg-primary/90"
                  disabled={submitting || !rewardTitle || !pointsCost || Number(pointsCost) > (user?.points || 0)}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang gửi...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Xác nhận đổi</>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Lịch sử yêu cầu */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Lịch sử yêu cầu</h2>
          </div>

          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <div key={req.id} className="p-4 bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground">{req.reward}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.description || "Không có mô tả"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">{req.date}</span>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "font-black text-sm",
                        req.status === "approved" ? "text-green-600" : "text-primary"
                      )}>
                        -{Number(req.pointsCost).toLocaleString()}
                      </span>
                      <p className="text-[10px] text-muted-foreground">điểm</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <Gift className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground italic">Chưa có yêu cầu nào</p>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  )
}