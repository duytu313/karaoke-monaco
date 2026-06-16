"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Plus, Minus, Check, ShieldCheck, Phone, AlertCircle, Utensils, Wine, Cherry, Beer as BeerIcon, Music, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface Service {
  id: string | number
  name: string
  price: number
  image: string
  selected: boolean
  quantity: number
  category: string
}

interface ServiceCategory {
  id: string
  label: string
  icon: any
}

const roomTypeMap: Record<string, "karaoke" | "massage" | "restaurant"> = {
  "1": "karaoke",
  "3": "massage",
  "5": "restaurant",
}

const serviceCatalog: Record<"karaoke" | "massage" | "restaurant", {
  title: string
  subtitle: string
  categories: ServiceCategory[]
  services: Service[]
}> = {
  karaoke: {
    title: "Dịch vụ thêm Karaoke",
    subtitle: "Chọn đồ uống, đồ ăn và dịch vụ giải trí phù hợp cho phòng hát.",
    categories: [
      { id: "dry", label: "Đồ khô & Nước ngọt", icon: Utensils },
      { id: "liquor", label: "Rượu mạnh", icon: Wine },
      { id: "fruit", label: "Hoa quả", icon: Cherry },
      { id: "beer", label: "Bia", icon: BeerIcon },
      { id: "event", label: "Giải trí", icon: Music },
    ],
    services: [
      { id: 1, name: "Thịt trâu khô", price: 120000, image: "/images/thittrau.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 2, name: "Gà xé lá chanh", price: 65000, image: "/images/thitga.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 3, name: "Chân gà muối", price: 102000, image: "/images/changa.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 4, name: "Hạt dẻ cười", price: 62000, image: "/images/hatde.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 5, name: "Khoai tây", price: 68000, image: "/images/snack.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 6, name: "Nước suối", price: 20000, image: "/images/water.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 7, name: "Coca / Fanta / Soda", price: 28000, image: "/images/soda.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 8, name: "Strongbow CIDER", price: 48000, image: "/images/strongbow.jpeg", selected: false, quantity: 1, category: "dry" },
      { id: 9, name: "Khăn lạnh", price: 5500, image: "/images/khanlanh.jpg", selected: false, quantity: 1, category: "dry" },
      { id: 15, name: "MACCALAN 12", price: 2799000, image: "/images/maccalan.jpg", selected: false, quantity: 1, category: "liquor" },
      { id: 16, name: "CHIVAS 18", price: 2899000, image: "/images/chivas.jpg", selected: false, quantity: 1, category: "liquor" },
      { id: 17, name: "HENESSY VSOP", price: 2399000, image: "/images/henessy.jpg", selected: false, quantity: 1, category: "liquor" },
      { id: 18, name: "BLUE LABEL", price: 6699000, image: "/images/blue.jpg", selected: false, quantity: 1, category: "liquor" },
      { id: 19, name: "BELUGA (0.7ml)", price: 1499000, image: "/images/beluga.jpg", selected: false, quantity: 1, category: "liquor" },
      { id: 40, name: "Hoa quả thập cẩm", price: 400000, image: "/images/hoaquathapcam.jpg", selected: false, quantity: 1, category: "fruit" },
      { id: 41, name: "Hoa quả đặc biệt", price: 500000, image: "/images/hoaquadacbiet.jpg", selected: false, quantity: 1, category: "fruit" },
      { id: 42, name: "Bưởi - Xoài theo mùa", price: 450000, image: "/images/buoi.jpg", selected: false, quantity: 1, category: "fruit" },
      { id: 46, name: "BUDWEISER Nhôm", price: 98000, image: "/images/budweiser.jpg", selected: false, quantity: 1, category: "beer" },
      { id: 47, name: "Corona lớn", price: 92000, image: "/images/corona.jpg", selected: false, quantity: 1, category: "beer" },
      { id: 48, name: "Heineken chai", price: 45000, image: "/images/beer.jpg", selected: false, quantity: 1, category: "beer" },
      { id: 44, name: "Corona Nhỏ", price: 60000, image: "/images/corona.jpg", selected: false, quantity: 1, category: "beer" },
      { id: 45, name: "Heineken nhôm", price: 98000, image: "/images/heniken.jpg", selected: false, quantity: 1, category: "beer" },
      { id: 60, name: "Sinh nhật trọn gói & Trang trí", price: 500000, image: "/images/sinh-nhat.jpg", selected: false, quantity: 1, category: "event" },
      { id: 61, name: "Liên hoan & Tiệc DJ sôi động", price: 2000000, image: "/images/dj.jpeg", selected: false, quantity: 1, category: "event" },
      { id: 62, name: "Dancer – Ảo thuật – Ca sĩ", price: 1500000, image: "/images/dancer.jpg", selected: false, quantity: 1, category: "event" },
    ],
  },
  massage: {
    title: "Dịch vụ thêm Massage",
    subtitle: "Chọn gói liệu trình và tiện ích thư giãn phù hợp.",
    categories: [
      { id: "massage", label: "Liệu trình", icon: Sparkles },
      { id: "spa", label: "Spa & thư giãn", icon: ShieldCheck },
      { id: "comfort", label: "Tiện ích thêm", icon: Utensils },
    ],
    services: [
      { id: "m1", name: "Massage thư giãn 60 phút", price: 500000, image: "/images/monaco1.jpg", selected: false, quantity: 1, category: "massage" },
      { id: "m2", name: "Massage chuyên sâu 90 phút", price: 800000, image: "/images/monaco1.jpg", selected: false, quantity: 1, category: "massage" },
      { id: "m3", name: "Foot massage", price: 300000, image: "/images/monaco1.jpg", selected: false, quantity: 1, category: "massage" },
      { id: "m4", name: "Xông hơi đá muối", price: 250000, image: "/images/monaco1.jpg", selected: false, quantity: 1, category: "spa" },
      { id: "m5", name: "Tắm bùn", price: 350000, image: "/images/monaco1.jpg", selected: false, quantity: 1, category: "spa" },
      { id: "m6", name: "Trà thảo mộc", price: 45000, image: "/images/water.jpg", selected: false, quantity: 1, category: "comfort" },
      { id: "m7", name: "Khăn lạnh", price: 5500, image: "/images/khanlanh.jpg", selected: false, quantity: 1, category: "comfort" },
      { id: "m8", name: "Phòng VIP thêm", price: 150000, image: "/images/monaco1.jpg", selected: false, quantity: 1, category: "comfort" },
    ],
  },
  restaurant: {
    title: "Dịch vụ thêm Nhà hàng",
    subtitle: "Chọn món ăn, đồ uống và combo phù hợp cho bàn ăn.",
    categories: [
      { id: "starter", label: "Khai vị", icon: Utensils },
      { id: "main", label: "Món chính", icon: Wine },
      { id: "drink", label: "Đồ uống", icon: BeerIcon },
      { id: "dessert", label: "Tráng miệng", icon: Cherry },
    ],
    services: [
      { id: "r1", name: "Salad tôm", price: 180000, image: "/images/hoaquathapcam.jpg", selected: false, quantity: 1, category: "starter" },
      { id: "r2", name: "Gỏi cuốn", price: 95000, image: "/images/hoaquathapcam.jpg", selected: false, quantity: 1, category: "starter" },
      { id: "r3", name: "Lẩu Thái", price: 450000, image: "/images/bg-intro.jpg", selected: false, quantity: 1, category: "main" },
      { id: "r4", name: "Bò lúc lắc", price: 360000, image: "/images/bg-intro.jpg", selected: false, quantity: 1, category: "main" },
      { id: "r5", name: "Rượu vang đỏ", price: 420000, image: "/images/budweiser.jpg", selected: false, quantity: 1, category: "drink" },
      { id: "r6", name: "Bia tươi", price: 98000, image: "/images/beer.jpg", selected: false, quantity: 1, category: "drink" },
      { id: "r7", name: "Trà sữa", price: 65000, image: "/images/budweiser.jpg", selected: false, quantity: 1, category: "drink" },
      { id: "r8", name: "Mousse chocolate", price: 120000, image: "/images/hoaquathapcam.jpg", selected: false, quantity: 1, category: "dessert" },
      { id: "r9", name: "Kem trái cây", price: 110000, image: "/images/hoaquathapcam.jpg", selected: false, quantity: 1, category: "dessert" },
    ],
  },
}

const transparencyRules = [
  "Không ép bill",
  "Không thu phí ẩn",
  "Không gài giá"
]

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ"
}

export default function ServicesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [roomType, setRoomType] = useState<"karaoke" | "massage" | "restaurant">("karaoke")
  const [services, setServices] = useState<Service[]>([])
  const [note, setNote] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const catalog = serviceCatalog[roomType]

  // Khôi phục thông tin từ localStorage khi trang được tải
  useEffect(() => {
    const type = roomTypeMap[id] || "karaoke"
    setRoomType(type)
    const savedData = localStorage.getItem(`temp_booking_info_${id}`)
    const baseServices = serviceCatalog[type].services

    if (savedData) {
      const parsed = JSON.parse(savedData)
      if (parsed.selectedServices) {
        setServices(baseServices.map(service => {
          const savedService = parsed.selectedServices.find((s: any) => s.id === service.id)
          return savedService ? { ...service, selected: true, quantity: savedService.quantity || 1 } : service
        }))
      } else {
        setServices(baseServices)
      }
      if (parsed.note) setNote(parsed.note)
    } else {
      setServices(baseServices)
    }
  }, [id])

  // Tự động lưu khi thay đổi dịch vụ hoặc ghi chú
  useEffect(() => {
    const selected = services.filter((s) => s.selected)
    const existingData = JSON.parse(localStorage.getItem(`temp_booking_info_${id}`) || "{}")
    const updatedData = {
      ...existingData,
      roomId: id,
      selectedServices: selected.map(s => ({ id: s.id, name: s.name, quantity: s.quantity, price: s.price })),
      note: note,
      totalServices: selected.reduce((sum, s) => sum + s.price * s.quantity, 0)
    }
    localStorage.setItem(`temp_booking_info_${id}`, JSON.stringify(updatedData))
  }, [services, note, id])

  const toggleService = (id: string | number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    )
  }

  const updateQuantity = (id: string | number, delta: number) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, quantity: Math.max(1, s.quantity + delta) }
          : s
      )
    )
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedServices = services.filter((s) => s.selected)
  const totalPrice = selectedServices.reduce(
    (sum, s) => sum + s.price * s.quantity,
    0
  )

  const handleBack = () => {
    const existingData = JSON.parse(localStorage.getItem("temp_booking_info") || "{}")
    const updatedData = {
      ...existingData,
      selectedServices: selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        quantity: s.quantity,
        price: s.price
      })),
      note: note,
      totalServices: totalPrice
    }
    localStorage.setItem("temp_booking_info", JSON.stringify(updatedData))
    router.push(`/rooms/${id}/booking`)
  }

  const handleContinue = () => {
    const existingData = JSON.parse(localStorage.getItem("temp_booking_info") || "{}")
    const updatedData = {
      ...existingData,
      selectedServices: selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        quantity: s.quantity,
        price: s.price
      })),
      note: note,
      totalServices: totalPrice
    }
    localStorage.setItem("temp_booking_info", JSON.stringify(updatedData))
    router.push(`/rooms/${id}/confirm`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">{catalog.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{catalog.subtitle}</p>
        </div>
      </header>
      
      {/* Search Bar */}
      <div className="mx-auto max-w-md px-4 py-3">
        <Input
          placeholder="Tìm kiếm dịch vụ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 rounded-xl bg-muted/50 border-none"
        />
      </div>
      <main className="mx-auto max-w-md space-y-6 px-4 py-4 pb-48">
        {/* Transparency Commitment Section */}
        <section className="space-y-3">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-sm uppercase tracking-wider">Giá cả minh bạch</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {transparencyRules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-background/50 py-1 px-2 rounded-full border border-border/50">
                  <span className="text-red-500">❌</span> {rule}
                </div>
              ))}
            </div>
            <Separator className="bg-primary/10" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground italic font-medium">Hotline khiếu nại (Mr. Long):</span>
              <a href="tel:0846807777" className="flex items-center gap-1 text-primary font-bold hover:underline">
                <Phone className="h-3 w-3" /> 084.680.7777
              </a>
            </div>
          </div>
        </section>

        {/* Render Services by Category */}
        {catalog.categories.map((cat) => (
          <section key={cat.id} className="space-y-3">
            <div className="flex items-center gap-2 px-1 text-foreground/80">
              <cat.icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest">{cat.label}</h3>
            </div>
            <div className="space-y-3">
              {services
                .filter((s) => s.category === cat.id && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((service) => (
                  <Card
                    key={service.id}
                    className={cn(
                      "border-border/50 bg-card p-4 transition-all shadow-sm active:scale-[0.98]",
                      service.selected && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                          service.selected
                            ? "border-primary bg-primary"
                            : "border-border/50 bg-transparent"
                        )}
                      >
                        {service.selected && (
                          <Check className="h-4 w-4 text-primary-foreground" />
                        )}
                      </button>

                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/20">
                        <Image
                          src={service.image}
                          alt={service.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate text-sm">{service.name}</h3>
                        <p className="text-sm font-bold text-primary">{formatPrice(service.price)}</p>
                      </div>

                      {service.selected && (
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1 border border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-primary/10"
                            onClick={() => updateQuantity(service.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">
                            {service.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-primary/10"
                            onClick={() => updateQuantity(service.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        ))}

      </main>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 p-4 pb-24 backdrop-blur-lg shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-start gap-2 px-1">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground italic leading-tight font-medium">
              Lưu ý: Giá có thể thay đổi theo thời điểm. Menu chỉ mang tính chất tham khảo. 
              Nhân viên sẽ tư vấn cụ thể khi quý khách nhận phòng.
            </p>
          </div>
          
          <Textarea 
            placeholder="Ghi chú thêm cho quán (Ví dụ: Thêm đá, dặn phục vụ...)" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[44px] h-11 bg-muted/20 border-border/50 resize-none focus-visible:ring-primary/20 text-xs py-2"
          />

          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">Tổng dịch vụ</span>
            <span className="text-2xl font-bold text-primary tracking-tight">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <Button onClick={handleContinue} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}
