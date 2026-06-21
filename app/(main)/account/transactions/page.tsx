"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ReceiptText, Search, Filter, ChevronRight, CircleCheck, CircleDashed, Clock, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { fetchUserBookings } from "@/lib/rtdb-utils"

const roomNames: Record<string, string> = {
  karaoke: "Dịch vụ Karaoke",
  massage: "Dịch vụ Massage",
  restaurant: "Dịch vụ Nhà hàng"
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending": return <Clock className="h-4 w-4 text-yellow-500" />
    case "completed": return <CircleCheck className="h-4 w-4 text-green-500" />
    case "cancelled": return <Clock className="h-4 w-4 text-red-500" />
    default: return <CircleDashed className="h-4 w-4 text-blue-500" />
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const bookings = await fetchUserBookings(user.uid)
      const data = bookings
        ? Object.entries(bookings as Record<string, any>)
            .map(([key, d]) => ({
              id: key,
              room: roomNames[d.type] || "Dịch vụ khác",
              date: d.bookingDate || "N/A",
              status: d.status || "pending",
              amount: d.totalAmount || 0,
              points: Math.floor((d.totalAmount || 0) / 10000),
              createdAt: d.createdAt || 0,
            }))
            .sort((a, b) => b.createdAt - a.createdAt)
        : []
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Không thể tải lịch sử giao dịch. Vui lòng kiểm tra kết nối mạng hoặc quyền truy cập RTDB.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const filteredTransactions = transactions.filter(t => 
    t.room.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpentMonth = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Lịch sử giao dịch</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-[1cm] pb-24">
        {/* Tìm kiếm & Lọc */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Mã đơn, tên phòng..." 
              className="pl-9 bg-muted/30 border-none rounded-xl h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl border-border/50">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Danh sách giao dịch */}
        <div className="space-y-[1cm]">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Giao dịch gần đây</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /></div>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-red-500 text-xs italic">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchTransactions} className="h-8 text-[10px] font-bold uppercase tracking-tighter">Thử lại</Button>
            </div>
          ) : filteredTransactions.length > 0 ? (
          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            {filteredTransactions.map((t) => (
                <Link key={t.id} href={`/orders/${t.id}`} className="block active:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 p-4">
                    {/* Icon loại giao dịch */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      t.status === "completed" ? "bg-green-500/10" : 
                      t.status === "cancelled" ? "bg-red-500/10" : "bg-yellow-500/10"
                    )}>
                      <ReceiptText className={cn(
                        "h-5 w-5",
                        t.status === "completed" ? "text-green-600" : 
                        t.status === "cancelled" ? "text-red-600" : "text-yellow-600"
                      )} />
                    </div>

                    {/* Thông tin đơn hàng */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-bold text-sm text-foreground truncate">{t.room}</h3>
                          <div className="text-right">
                            <span className="font-bold text-sm text-primary block">
                              {t.status === "completed" ? "-" : ""}{formatPrice(t.amount)}
                            </span>
                            {t.status === "completed" && (
                              <span className="text-[10px] font-bold text-accent flex items-center justify-end gap-1">
                                <Sparkles className="h-2.5 w-2.5" />+{t.points} điểm
                              </span>
                            )}
                          </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>#{t.id}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{t.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(t.status)}
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tight",
                            t.status === "completed" ? "text-green-600" : 
                            t.status === "cancelled" ? "text-red-600" : "text-yellow-600"
                          )}>
                            {t.status === "completed" ? "Thành công" : t.status === "cancelled" ? "Đã hủy" : "Chờ xử lý"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                </Link>
              ))}
          </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-500">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ReceiptText className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">Không tìm thấy giao dịch</h3>
              <p className="text-xs text-muted-foreground italic mb-6">
                {searchTerm ? "Không có kết quả nào khớp với tìm kiếm của bạn." : "Bạn chưa thực hiện giao dịch nào tại Monaco."}
              </p>
              {!searchTerm && (
                <Link href="/rooms">
                  <Button size="sm" className="bg-accent text-accent-foreground font-bold rounded-xl px-6">
                    Trải nghiệm ngay
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Thống kê chi tiêu */}
        <section className="pt-4">
          <Card className="p-4 border-dashed border-primary/30 bg-primary/5 flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng chi tiêu tháng này</p>
              <p className="text-xl font-black text-primary">{formatPrice(totalSpentMonth)}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-xs font-bold text-primary">Xem báo cáo</Button>
          </Card>
        </section>
      </main>
    </div>
  )
}