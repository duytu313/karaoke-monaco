"use client"

import { useState, useEffect } from "react"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, update } from "firebase/database"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" // Giả định bạn có component này hoặc dùng div
import { CheckCircle2, Clock, CreditCard, User, Utensils, Mic2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ReceptionistDashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bookingsRef = ref(rtdb, "bookings")
    // Lắng nghe thay đổi thời gian thực
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const list = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        })).sort((a, b) => b.createdAt - a.createdAt) // Đơn mới nhất lên đầu
        setBookings(list)
      } else {
        setBookings([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const updateStatus = async (bookingId: string, userId: string, newStatus: string) => {
    try {
      await update(ref(rtdb, `bookings/${bookingId}`), { status: newStatus })
      // Gọi API gửi thông báo cho khách hàng khi trạng thái thay đổi
      await fetch("/api/bookings/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId, status: newStatus }),
      })
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error)
    }
  }

  const handleCheckout = async (bookingId: string) => {
    // Gọi API hoàn thành đơn và tích điểm đã có của bạn
    try {
      const res = await fetch("/api/bookings/complete", { 
        method: "POST",
        body: JSON.stringify({ bookingId }),
      })
      if (res.ok) alert("Thanh toán và tích điểm thành công!")
    } catch (error) {
      alert("Lỗi khi thanh toán")
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "Chờ đến": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Đã đến": "bg-blue-100 text-blue-700 border-blue-200",
      "Đang dùng": "bg-purple-100 text-purple-700 border-purple-200",
      "Chờ thanh toán": "bg-orange-100 text-orange-700 border-orange-200",
      "Đã thanh toán": "bg-green-100 text-green-700 border-green-200",
      "Đã hủy": "bg-red-100 text-red-700 border-red-200",
    }
    return styles[status] || "bg-gray-100 text-gray-700"
  }

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu thực tế...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quầy Lễ Tân Monaco</h1>
          <p className="text-slate-500 text-sm">Quản lý đặt phòng và thanh toán thời gian thực</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium">Hệ thống trực tuyến</span>
        </div>
      </header>

      <div className="grid gap-6">
        {bookings.length === 0 && <p className="text-center py-20 text-muted-foreground">Chưa có đơn hàng nào.</p>}
        
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden border-slate-200 shadow-sm transition-hover hover:shadow-md">
            <div className="flex flex-col md:flex-row">
              {/* Info Section */}
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {booking.type === 'karaoke' ? <Mic2 size={20}/> : booking.type === 'massage' ? <Sparkles size={20}/> : <Utensils size={20}/>}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Đơn hàng #{booking.id.slice(-5)}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User size={14} /> ID Khách: <span className="font-mono text-[10px]">{booking.userId}</span>
                      </p>
                    </div>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", getStatusBadge(booking.status))}>
                    {booking.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600"><Clock size={16} className="text-slate-400"/> {booking.bookingDate} {booking.bookingTime}</div>
                  <div className="flex items-center gap-2 font-bold text-primary"><CreditCard size={16}/> {new Intl.NumberFormat('vi-VN').format(booking.totalAmount)}đ</div>
                </div>
              </div>

              {/* Action Section */}
              <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-5 flex items-center gap-2 justify-end min-w-[200px]">
                {booking.status === "Chờ đến" && (
                  <Button 
                    onClick={() => updateStatus(booking.id, booking.userId, "Đã đến")}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    Khách đã đến
                  </Button>
                )}
                {booking.status === "Đã đến" && (
                  <Button 
                    onClick={() => updateStatus(booking.id, booking.userId, "Đang dùng")}
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                  >
                    Bắt đầu dùng phòng
                  </Button>
                )}
                {booking.status === "Đang dùng" && (
                  <Button 
                    onClick={() => updateStatus(booking.id, booking.userId, "Chờ thanh toán")}
                    className="bg-orange-600 hover:bg-orange-700 w-full"
                  >
                    Kết thúc & Tính tiền
                  </Button>
                )}
                {booking.status === "Chờ thanh toán" && (
                  <Button 
                    onClick={() => handleCheckout(booking.id)}
                    className="bg-green-600 hover:bg-green-700 w-full flex gap-2"
                  >
                    <CheckCircle2 size={18} /> Thanh toán
                  </Button>
                )}
                {booking.status === "Đã thanh toán" && (
                  <span className="text-green-600 font-bold text-sm italic">Đã hoàn tất</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}