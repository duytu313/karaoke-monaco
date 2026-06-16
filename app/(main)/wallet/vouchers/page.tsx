"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Gift, Ticket, Sparkles, Check, Loader2, AlertTriangle, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"

interface VoucherItem {
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

interface OwnVoucher {
  key: string
  id: string
  title: string
  description: string
  code: string
  minTotal: number
  discountAmount: number | null
  discountRate: number | null
  serviceType: string
  pointsUsed: number
  redeemedAt: number
  used: boolean
  usedAt: number | null
}

export default function WalletVouchersPage() {
  const { user } = useAuth()
  const [availableVouchers, setAvailableVouchers] = useState<VoucherItem[]>([])
  const [ownVouchers, setOwnVouchers] = useState<OwnVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [redeemModal, setRedeemModal] = useState<VoucherItem | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Tải danh sách voucher có sẵn
  useEffect(() => {
    fetch("/api/vouchers/redeem")
      .then((res) => res.json())
      .then((data) => {
        setAvailableVouchers(data.vouchers || [])
      })
      .catch(console.error)
  }, [])

  // Lắng nghe voucher của user từ RTDB
  useEffect(() => {
    if (!user?.username && !user?.uid) {
      setOwnVouchers([])
      setLoading(false)
      return
    }

    const userKey = user?.username
    if (!userKey) {
      setOwnVouchers([])
      setLoading(false)
      return
    }

    const ownRef = ref(rtdb, `users/profiles/${userKey}/ownVouchers`)
    const unsub = onValue(ownRef, (snapshot) => {
      const value = snapshot.val() || {}
      const items: OwnVoucher[] = Object.entries(value).map(([key, item]: [string, any]) => ({
        key,
        id: item.id,
        title: item.title,
        description: item.description,
        code: item.code,
        minTotal: item.minTotal,
        discountAmount: item.discountAmount,
        discountRate: item.discountRate,
        serviceType: item.serviceType,
        pointsUsed: item.pointsUsed,
        redeemedAt: item.redeemedAt || 0,
        used: item.used === true,
        usedAt: item.usedAt || null,
      })).sort((a, b) => b.redeemedAt - a.redeemedAt)
      setOwnVouchers(items)
      setLoading(false)
    })

    return () => off(ownRef)
  }, [user])

  const handleRedeem = async () => {
    if (!redeemModal || !user?.uid) return
    setRedeeming(redeemModal.id)
    setMessage(null)

    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, voucherId: redeemModal.id }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Đổi voucher thành công!" })
        setRedeemModal(null)
      } else {
        setMessage({ type: "error", text: data.message || "Có lỗi xảy ra" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Lỗi kết nối" })
    } finally {
      setRedeeming(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ"
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp) return ""
    const d = new Date(timestamp)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
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
            <h1 className="text-lg font-bold text-foreground">Đổi Voucher</h1>
            <p className="text-sm text-muted-foreground">Dùng điểm để đổi ưu đãi hấp dẫn.</p>
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
              "text-sm font-medium",
              message.type === "success" ? "text-emerald-800" : "text-red-800"
            )}>
              {message.text}
            </p>
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0" onClick={() => setMessage(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Voucher của tôi */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Voucher của tôi</h2>
          </div>

          {loading ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">Đang tải...</Card>
          ) : ownVouchers.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground italic border-dashed">
              Bạn chưa có voucher nào. Hãy đổi ngay!
            </Card>
          ) : (
            <div className="space-y-3">
              {ownVouchers.map((v) => (
                <Card key={v.key} className={cn(
                  "p-4 border-2",
                  v.used ? "border-gray-200 bg-gray-50" : "border-emerald-200 bg-emerald-50/30"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        "p-2 rounded-xl shrink-0",
                        v.used ? "bg-gray-200" : "bg-emerald-100"
                      )}>
                        <Ticket className={cn("h-5 w-5", v.used ? "text-gray-500" : "text-emerald-600")} />
                      </div>
                      <div className="min-w-0">
                        <h3 className={cn("font-bold text-sm", v.used ? "text-gray-500" : "text-foreground")}>
                          {v.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-bold bg-background px-2 py-0.5 rounded border border-border/50">
                            Mã: {v.code}
                          </span>
                          {v.used ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Đã sử dụng
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Chưa sử dụng
                            </span>
                          )}
                        </div>
                        {v.redeemedAt > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Đổi lúc: {formatTime(v.redeemedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">-{v.pointsUsed}đ</span>
                  </div>
                  {!v.used && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-[10px] text-blue-700 font-medium">
                        Nhập mã <span className="font-bold">{v.code}</span> khi xác nhận đơn hàng để được giảm giá
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Danh sách voucher có thể đổi */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Danh sách voucher</h2>
          </div>

          <div className="space-y-3">
            {availableVouchers.map((v) => (
              <Card key={v.id} className="border border-border/50 bg-card overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-foreground">{v.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {v.discountAmount && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            Giảm {formatPrice(v.discountAmount)}
                          </span>
                        )}
                        {v.discountRate && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            Giảm {Math.round(v.discountRate * 100)}%
                          </span>
                        )}
                        {v.minTotal > 0 && (
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
                            Tối thiểu {formatPrice(v.minTotal)}
                          </span>
                        )}
                        {v.serviceType !== "all" && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {v.serviceType === "karaoke" ? "Karaoke" : v.serviceType === "massage" ? "Massage" : "Nhà hàng"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-primary">{v.pointsCost.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">điểm</p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-3"
                    size="sm"
                    onClick={() => {
                      if (user) setRedeemModal(v)
                      else setMessage({ type: "error", text: "Vui lòng đăng nhập để đổi voucher" })
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Đổi ngay
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {!user && (
          <Card className="p-4 text-center text-sm text-muted-foreground border-dashed">
            <Link href="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link> để đổi voucher
          </Card>
        )}
      </main>

      {/* Modal xác nhận đổi */}
      {redeemModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="w-full max-w-xs p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Xác nhận đổi voucher</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn sắp đổi <span className="font-bold text-foreground">{redeemModal.title}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Mã: {redeemModal.code} | {redeemModal.description}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
              <p className="text-xs text-amber-800 font-medium">Bạn sẽ dùng</p>
              <p className="text-2xl font-black text-amber-700">{redeemModal.pointsCost.toLocaleString()} điểm</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full font-bold"
                onClick={handleRedeem}
                disabled={redeeming !== null}
              >
                {redeeming ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang xử lý...</>
                ) : (
                  "Xác nhận đổi"
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full font-medium"
                onClick={() => setRedeemModal(null)}
                disabled={redeeming !== null}
              >
                Hủy bỏ
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}