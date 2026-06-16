"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, "0")
  const minute = i % 2 === 0 ? "00" : "30"
  return `${hour}:${minute}`
})

// Định nghĩa giới hạn đặt trước (ví dụ: 30 ngày)
const LIMIT_DAYS = 30;
const getLimitDateString = () => {
  const d = new Date()
  d.setDate(d.getDate() + LIMIT_DAYS)
  return formatToLocalDateString(d)
}

function formatToLocalDateString(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function generateDates(baseDate: Date) {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() + i)
    dates.push({
      day: date.getDate(),
      weekday: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()],
      full: formatToLocalDateString(date),
    })
  }
  return dates
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date())
  const todayStr = formatToLocalDateString(currentTime)
  const limitDateString = getLimitDateString()

  // Khởi tạo dữ liệu từ localStorage ngay lập tức để tránh bị reset
  const [savedBooking, setSavedBooking] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`temp_booking_info_${id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        // KIỂM TRA: Nếu ngày đã lưu nhỏ hơn ngày hiện tại, coi như dữ liệu lỗi thời
        if (parsed.date && parsed.date < formatToLocalDateString(new Date())) {
          return null
        }
        return parsed
      }
    }
    return null
  })

  const [baseDate, setBaseDate] = useState(() => {
    // Nếu có ngày đã lưu và ngày đó không phải là quá khứ
    if (savedBooking?.date && savedBooking.date >= todayStr) {
      const d = new Date(savedBooking.date)
      d.setHours(0, 0, 0, 0)
      return d
    }
    const d = new Date(currentTime)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const dates = generateDates(baseDate)
  const [selectedDate, setSelectedDate] = useState(() => {
    if (savedBooking?.date && savedBooking.date >= todayStr) return savedBooking.date
    return todayStr
  })

  const [selectedTime, setSelectedTime] = useState(() => {
    // Chỉ khôi phục giờ nếu ngày không bị reset về hôm nay
    if (savedBooking?.time && selectedDate === savedBooking.date) return savedBooking.time
    
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    if (minutes === 0) return `${String(hours).padStart(2, "0")}:00`
    if (minutes <= 30) return `${String(hours).padStart(2, "0")}:30`
    return `${String((hours + 1) % 24).padStart(2, "0")}:00`
  })

  // Hiệu ứng "Thời gian thực": Tự động cập nhật giờ hiện tại mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000) // Cập nhật mỗi 30 giây để đảm bảo tính chính xác
    return () => clearInterval(interval)
  }, [])

  // Tự động lưu dữ liệu mỗi khi có thay đổi để tránh bị reset khi thoát
  useEffect(() => {
    const existingData = JSON.parse(localStorage.getItem(`temp_booking_info_${id}`) || "{}")
    const bookingData = {
      ...existingData,
      roomId: id,
      date: selectedDate,
      time: selectedTime,
    }
    localStorage.setItem(`temp_booking_info_${id}`, JSON.stringify(bookingData))
  }, [selectedDate, selectedTime, id])

  const visibleTimeSlots = useMemo(() => {
    const isToday = selectedDate === formatToLocalDateString(currentTime)
    if (!isToday) return TIME_SLOTS

    return TIME_SLOTS.filter(time => {
      const [h, m] = time.split(':').map(Number)
      const slotTime = new Date(currentTime)
      slotTime.setHours(h, m, 0, 0)
      
      // Quy tắc: Chỉ hiện các khung giờ cách hiện tại ít nhất 15 phút (thời gian chuẩn bị)
      return slotTime.getTime() > currentTime.getTime() + 15 * 60 * 1000
    })
  }, [selectedDate, currentTime])

  useEffect(() => {
    if (visibleTimeSlots.length > 0 && !visibleTimeSlots.includes(selectedTime)) {
      setSelectedTime(visibleTimeSlots[0])
    }
  }, [selectedDate, visibleTimeSlots, selectedTime])

  const handleNext = () => {
    const next = new Date(baseDate)
    next.setDate(baseDate.getDate() + 7)
    setBaseDate(next)
  }

  const handlePrev = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const prev = new Date(baseDate)
    prev.setDate(baseDate.getDate() - 7)
    setBaseDate(prev < today ? today : prev)
  }

  const isPrevDisabled = baseDate.getTime() <= new Date().setHours(0, 0, 0, 0)
  const isNextDisabled = useMemo(() => {
    const nextWeek = new Date(baseDate)
    nextWeek.setDate(baseDate.getDate() + 7)
    return formatToLocalDateString(nextWeek) > limitDateString
  }, [baseDate, limitDateString])

  const handleContinue = () => {
    const existingData = JSON.parse(localStorage.getItem(`temp_booking_info_${id}`) || "{}")
    const bookingData = {
      ...existingData,
      date: selectedDate,
      time: selectedTime,
    }
    localStorage.setItem(`temp_booking_info_${id}`, JSON.stringify(bookingData))
    router.push(`/rooms/${id}/services`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
          <Link href={`/rooms/${id}`}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">
            Chọn thời gian
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 py-4 pb-24">
        {/* Date Selection */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev} disabled={isPrevDisabled}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Tháng {baseDate.getMonth() + 1} - {baseDate.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext} disabled={isNextDisabled}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between gap-2">
            {dates.map((date) => {
              const isDisabled = date.full > limitDateString
              return (
                <button
                  key={date.full}
                  disabled={isDisabled}
                  onClick={() => setSelectedDate(date.full)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-xl py-3 transition-colors",
                    selectedDate === date.full
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-card/80",
                    isDisabled && "opacity-20 cursor-not-allowed"
                  )}
                >
                  <span className="text-xs opacity-70">{date.weekday}</span>
                  <span className="text-lg font-semibold">{date.day}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Time Slots */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Thời gian
          </h2>
          <Card className="border-border/50 bg-card p-4">
            {visibleTimeSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {visibleTimeSlots.map((time) => {
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "rounded-lg py-2 text-sm font-medium transition-colors",
                        selectedTime === time
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Đã hết khung giờ khả dụng</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Rất tiếc, các khung giờ trong ngày hôm nay đã trôi qua.<br />Vui lòng chọn ngày khác để tiếp tục đặt lịch.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </section>

      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 border-t border-border/30 bg-background/95 p-4 backdrop-blur-lg">
        <div className="mx-auto max-w-md">
          <Button 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={visibleTimeSlots.length === 0}
            onClick={handleContinue}
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}
