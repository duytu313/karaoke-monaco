"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Ticket, Calendar, Clock, Users, MessageSquare, Plus, Minus, Trash2, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import { cn } from "@/lib/utils"

const ROOM_DATA: Record<string, any> = {
  "1": { name: "Karaoke", type: "karaoke", capacity: "10-20 người" },
  "3": { name: "Massage", type: "massage", capacity: "1 người" },
  "5": { name: "Nhà hàng", type: "restaurant", capacity: "12 người" },
}

interface ServiceItem {
  name: string
  price: number
  quantity: number
}

interface Voucher {
  id: string
  code: string
  title: string
  desc: string
  serviceType: "karaoke" | "massage" | "restaurant" | "all"
  discountAmount?: number
  discountRate?: number
  minTotal: number
}

interface BookingDetails {
  room: string
  date: string
  time: string
  guests: number
  services: ServiceItem[]
  total: number
  note: string
}

export default function ConfirmBookingPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [roomInfo, setRoomInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  const vouchers: Voucher[] = [
    {
      id: "giam100k",
      code: "GIAM100K",
      title: "Giảm 100k",
      desc: "Áp dụng cho hoá đơn từ 1.5M",
      serviceType: "all",
      discountAmount: 100000,
      minTotal: 1500000,
    },
    {
      id: "vip10",
      code: "VIP10",
      title: "Giảm 10%",
      desc: "Dành cho đơn VIP trên 1.2M",
      serviceType: "all",
      discountRate: 0.1,
      minTotal: 1200000,
    },
    {
      id: "karaoke-free-song",
      code: "FREESONG",
      title: "Tặng 1 bài",
      desc: "Chỉ dành cho Karaoke",
      serviceType: "karaoke",
      discountAmount: 80000,
      minTotal: 800000,
    },
    {
      id: "massage-relax",
      code: "RELAX50",
      title: "Giảm 50k",
      desc: "Chỉ dành cho Massage",
      serviceType: "massage",
      discountAmount: 50000,
      minTotal: 500000,
    },
    {
      id: "restaurant-combo",
      code: "COMBO15",
      title: "Giảm 15%",
      desc: "Chỉ dành cho Nhà hàng",
      serviceType: "restaurant",
      discountRate: 0.15,
      minTotal: 1000000,
    },
  ]

  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    room: "Dịch vụ...",
    date: "Đang tải...",
    time: "...",
    guests: 1,
    services: [],
    total: 0,
    note: ""
  })

  const voucherDiscount = appliedVoucher && bookingDetails.total >= appliedVoucher.minTotal
    ? appliedVoucher.discountAmount
      ? Math.min(appliedVoucher.discountAmount, bookingDetails.total)
      : Math.floor(bookingDetails.total * (appliedVoucher.discountRate || 0))
    : 0
  const finalTotal = Math.max(0, bookingDetails.total - voucherDiscount)

  const handleApplyVoucher = () => {
    setVoucherError(null)
    const code = voucherCode.trim().toUpperCase()
    if (!code) return

    const found = vouchers.find((v) => v.code === code)
    if (!found) {
      setVoucherError("Mã giảm giá không hợp lệ.")
      setAppliedVoucher(null)
      return
    }

    if (found.serviceType !== "all" && found.serviceType !== roomInfo?.type) {
      setVoucherError(`Mã này không áp dụng cho ${roomInfo?.name}.`)
      setAppliedVoucher(null)
      return
    }

    if (bookingDetails.total < found.minTotal) {
      setVoucherError(`Đơn hàng cần tối thiểu ${formatPrice(found.minTotal)} để dùng mã này.`)
      setAppliedVoucher(null)
      return
    }

    setAppliedVoucher(found)
  }

  useEffect(() => {
    const fetchData = async () => {
      let roomData = ROOM_DATA[id]
      
      if (!roomData) {
        try {
          const roomRef = ref(rtdb, `rooms/${id}`)
          const snapshot = await get(roomRef)
          roomData = snapshot.exists() ? snapshot.val() : { name: "Dịch vụ", type: "karaoke" }
        } catch (error) {
          roomData = { name: "Dịch vụ", type: "karaoke" }
        }
      }

      setRoomInfo(roomData)

      const savedData = localStorage.getItem(`temp_booking_info_${id}`)
      const parsed = savedData ? JSON.parse(savedData) : {}
      setBookingDetails({
        room: `Dịch vụ ${roomData.name}`,
        date: parsed.date || "Chưa chọn",
        time: parsed.time || "Chưa chọn",
        guests: typeof parsed.guestCount === "number" ? parsed.guestCount : 1,
        services: parsed.selectedServices || [],
        total: parsed.totalServices || 0,
        note: parsed.note || ""
      })
    }
    fetchData()
  }, [id])

  // Hàm đồng bộ dữ liệu ngược lại localStorage
  const syncToLocalStorage = (details: any) => {
    const parsed = JSON.parse(localStorage.getItem(`temp_booking_info_${id}`) || "{}")
    const updatedData = {
      ...parsed,
      selectedServices: details.services,
      note: details.note,
      totalServices: details.total,
      guestCount: details.guests
    }
    localStorage.setItem(`temp_booking_info_${id}`, JSON.stringify(updatedData))
  }

  const updateServiceQuantity = (index: number, delta: number) => {
    const updatedServices = [...bookingDetails.services]
    const newQty = Math.max(1, updatedServices[index].quantity + delta)
    updatedServices[index].quantity = newQty
    
    const newTotal = updatedServices.reduce((sum: number, s: any) => sum + s.price * s.quantity, 0)
    
    const updatedDetails = { ...bookingDetails, services: updatedServices, total: newTotal }
    setBookingDetails(updatedDetails)
    syncToLocalStorage(updatedDetails)
  }

  const removeService = (index: number) => {
    const updatedServices = bookingDetails.services.filter((_: any, i: number) => i !== index)
    const newTotal = updatedServices.reduce((sum: number, s: any) => sum + s.price * s.quantity, 0)
    
    const updatedDetails = { ...bookingDetails, services: updatedServices, total: newTotal }
    setBookingDetails(updatedDetails)
    syncToLocalStorage(updatedDetails)
  }

  const updateGuestCount = (delta: number) => {
    const updatedDetails = { ...bookingDetails, guests: Math.max(1, bookingDetails.guests + delta) }
    setBookingDetails(updatedDetails)
    syncToLocalStorage(updatedDetails)
  }

  const updateNote = (newNote: string) => {
    const updatedDetails = { ...bookingDetails, note: newNote }
    setBookingDetails(updatedDetails)
    syncToLocalStorage(updatedDetails)
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "guest",
          type: roomInfo?.type || "karaoke",
          items: bookingDetails.services,
          note: bookingDetails.note,
          bookingDate: bookingDetails.date,
          bookingTime: bookingDetails.time,
          totalAmount: bookingDetails.total,
          guestCount: bookingDetails.guests,
        }),
      })

      if (response.ok) {
        localStorage.removeItem(`temp_booking_info_${id}`)
        router.push("/orders")
      } else {
        alert("Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.")
      }
    } catch (error) {
      console.error("Confirm error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ"
  }

  if (!roomInfo) return <div className="min-h-screen flex items-center justify-center italic text-muted-foreground">Đang tải...</div>

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href={`/rooms/${id}/services`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Xác nhận đặt lịch</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 space-y-5 pb-10">
        {/* Basic Info */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Thông tin đặt lịch</h2>
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-primary/70" /> {roomInfo.type === 'restaurant' ? 'Loại hình' : 'Dịch vụ'}
              </span>
              <span className="text-foreground font-bold">{bookingDetails.room}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4 text-primary/70" /> Thời gian
              </span>
              <span className="text-foreground font-bold">{bookingDetails.date} - {bookingDetails.time}</span>
            </div>
            <div className="flex justify-between items-center gap-3 text-sm">
              <span className="text-muted-foreground flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-primary/70" /> {roomInfo.type === 'restaurant' ? 'Số chỗ' : 'Số lượng khách'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-primary/10"
                  onClick={() => updateGuestCount(-1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-foreground font-bold">{bookingDetails.guests} người</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-primary/10"
                  onClick={() => updateGuestCount(1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Dịch vụ đã chọn</h2>
          <Separator className="bg-border/30" />
          <div className="divide-y divide-border/20">
            {bookingDetails.services.map((item, index) => (
              <div key={index} className="flex flex-col py-3 gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{item.name}</span>
                    <span className="text-xs text-primary font-bold">{formatPrice(item.price)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeService(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1 w-fit">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-md hover:bg-primary/10"
                      onClick={() => updateServiceQuantity(index, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-md hover:bg-primary/10"
                      onClick={() => updateServiceQuantity(index, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voucher Input Section */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Ưu đãi & Khuyến mãi</h2>
          <Separator className="bg-border/30" />
          <div className="flex gap-2">
            <Input
              placeholder="Nhập mã voucher (VD: GIAM100K)"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="bg-muted/20 border-border/50 h-10 text-sm uppercase"
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10 px-4 font-bold text-xs shrink-0"
              onClick={handleApplyVoucher}
            >
              Áp dụng
            </Button>
          </div>

          {voucherError && (
            <p className="text-[10px] text-red-500 px-1 font-medium">{voucherError}</p>
          )}

          {appliedVoucher && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <Ticket className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">{appliedVoucher.title}</p>
                    <p className="text-[10px] text-emerald-600">Mã: {appliedVoucher.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-600">-{formatPrice(voucherDiscount)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-emerald-400 hover:text-emerald-600"
                    onClick={() => {
                      setAppliedVoucher(null)
                      setVoucherCode("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note Section */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Ghi chú cho quán</h2>
          <Separator className="bg-border/30" />
          <Textarea 
            value={bookingDetails.note}
            onChange={(e) => updateNote(e.target.value)}
            placeholder="Thêm ghi chú của bạn..."
            className="text-sm bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[80px] italic"
          />
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed px-1 italic">
          Yêu cầu đặt lịch (phòng/bàn/massage) sẽ không được bảo đảm chắc chắn khi đã xác nhận đặt chỗ thành công bởi vì còn phụ thuộc vào tình trạng còn trống thực tế tại Monaco.
        </p>
      </main>

      {/* Summary & Footer Button */}
      <div className="sticky bottom-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30 space-y-4">
        <div className="space-y-2 px-1">
          {voucherDiscount > 0 && (
            <div className="flex justify-between items-center rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2">
              <span className="text-sm text-foreground">Đã giảm</span>
              <span className="text-sm font-bold text-emerald-600">-{formatPrice(voucherDiscount)}</span>
            </div>
          )}
        </div>
        <Button 
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg"
        >
          {isLoading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
        </Button>
      </div>
    </div>
  )
}
