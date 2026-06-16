"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { fetchUserBookings } from "@/lib/rtdb-utils"
import { BookingStatus } from "@/lib/database-schema"

const filters = ["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đang dùng", "Đã thanh toán", "Đã hủy"]

const roomMapping: Record<string, any> = {
  karaoke: { name: "Karaoke VIP", image: "/images/vip1.jpg" },
  massage: { name: "Massage Monaco", image: "/images/monaco1.jpg" },
  restaurant: { name: "Nhà hàng Monaco", image: "/images/bg-intro.jpg" }
}

interface Order {
  id: string
  room: string
  date: string
  time: string
  status: BookingStatus
  originalPrice: number
  finalPrice: number
  image: string
  points: number
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
    case "Chờ xác nhận":
      return { text: "Chờ xác nhận", color: "bg-yellow-500/20 text-yellow-500" }
    case "Đã xác nhận":
      return { text: "Đã xác nhận", color: "bg-blue-500/20 text-blue-500" }
    case "Đang dùng":
      return { text: "Đang sử dụng", color: "bg-purple-500/20 text-purple-500" }
    case "Đã thanh toán":
      return { text: "Đã hoàn thành", color: "bg-green-500/20 text-green-500" }
    case "Đã hủy":
      return { text: "Đã hủy", color: "bg-red-500/20 text-red-500" }
    default:
      return { text: status, color: "bg-slate-500/20 text-slate-500" }
  }
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState("Tất cả")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) {
        setOrders([])
        return
      }
      try {
        const bookings = await fetchUserBookings(user.uid)
        const fetchedOrders = bookings
          ? Object.entries(bookings as Record<string, any>).map(([key, data]) => {
              const roomInfo = roomMapping[data.type] || roomMapping.karaoke
              return {
                id: key,
                room: roomInfo.name,
                date: data.bookingDate,
                time: data.bookingTime,
                status: ((data.status === "pending" ? "Chờ xác nhận" : data.status) || "Chờ xác nhận") as BookingStatus,
                originalPrice: data.totalAmount,
                finalPrice: data.totalAmount,
                image: roomInfo.image,
                points: Math.floor(data.totalAmount / 10000),
                createdAt: data.createdAt || 0,
              }
            })
            .sort((a, b) => b.createdAt - a.createdAt)
          : []
        setOrders(fetchedOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
        setError("Không thể tải danh sách đơn hàng. Vui lòng kiểm tra kết nối mạng hoặc quyền truy cập RTDB.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.uid])

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "Tất cả") return true
    if (activeFilter === "Chờ xác nhận") return order.status === "Chờ xác nhận"
    if (activeFilter === "Đã xác nhận") return order.status === "Đã xác nhận"
    if (activeFilter === "Đang dùng") return order.status === "Đang dùng"
    if (activeFilter === "Đã thanh toán") return order.status === "Đã thanh toán"
    if (activeFilter === "Đã hủy") return order.status === "Đã hủy"
    return true
  })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Đơn của tôi</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant="outline"
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-full border-border/50 shrink-0 snap-start",
                activeFilter === filter
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-card hover:border-primary/50"
              )}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Order List */}
        <div className="space-y-6 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              Đang tải đơn hàng...
            </div>
          ) : filteredOrders.map((order) => {
            const status = getStatusLabel(order.status)
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md shadow-sm active:scale-[0.98]">
                  <div className="flex gap-3">
                    <Image
                      src={order.image}
                      alt={order.room}
                      width={80}
                      height={80}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {order.room}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.date} - {order.time}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-block rounded px-2 py-0.5 text-xs font-medium",
                              status.color
                            )}
                          >
                            {status.text}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            +{order.points} điểm
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.originalPrice !== order.finalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(order.originalPrice)}
                          </span>
                        )}
                        <span className="font-semibold text-primary">
                          {formatPrice(order.finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}

          {!loading && error && (
            <div className="py-10 text-center text-red-500 text-sm italic">
              {error}
            </div>
          )}
        </div>

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 shadow-inner">
              <Sparkles className="h-12 w-12 text-primary/20" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-xs text-muted-foreground italic leading-relaxed mb-8 max-w-[200px]">
              {activeFilter === "Tất cả" 
                ? "Bạn vẫn chưa có lịch hẹn nào. Hãy khám phá các dịch vụ đẳng cấp của chúng tôi ngay!" 
                : `Không tìm thấy đơn hàng nào ở trạng thái "${activeFilter}".`}
            </p>
            <Link href="/rooms">
              <Button className="bg-accent text-accent-foreground font-bold rounded-xl px-8 shadow-lg shadow-accent/20 active:scale-95 transition-all">
                Đặt lịch ngay
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
