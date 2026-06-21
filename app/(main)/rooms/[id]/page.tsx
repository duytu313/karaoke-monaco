"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Heart, Share2, Users, Tv, Mic2, Maximize, Sparkles, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { rtdb } from "@/lib/firebase"
import { ref, get } from "firebase/database"

const ROOM_DATA: Record<string, any> = {
  "1": {
    id: "1",
    name: "Karaoke",
    serviceType: "karaoke",
    category: "VIP",
    capacity: 20,
    price: 688000,
    priceNote: "đ/giờ",
    image: "/images/vip1.jpg",
    description: "Hệ thống phòng Karaoke đẳng cấp với dàn âm thanh chuyên nghiệp, ánh sáng LED vũ trường hiện đại. Không gian lý tưởng để tổ chức tiệc sinh nhật, sự kiện hoặc họp mặt bạn bè.",
    features: [
      { icon: Maximize, label: "60m²", desc: "Diện tích" },
      { icon: Tv, label: "75 inch", desc: "Smart TV" },
      { icon: Mic2, label: "Pro", desc: "Karaoke" },
    ],
    rating: 4.9,
  },
  "3": {
    id: "3",
    name: "Massage",
    serviceType: "massage",
    category: "VIP",
    capacity: 1,
    price: 800000,
    priceNote: "đ/lượt",
    image: "/images/monaco1.jpg",
    description: "Dịch vụ Massage trị liệu và thư giãn chuyên sâu trong không gian riêng tư, sang trọng. Đội ngũ kỹ thuật viên lành nghề giúp bạn xua tan mệt mỏi và phục hồi năng lượng tối đa.",
    features: [
      { icon: Maximize, label: "20m²", desc: "Diện tích" },
      { icon: Tv, label: "40 inch", desc: "TV" },
      { icon: Sparkles, label: "Thư giãn", desc: "Liệu pháp" },
    ],
    rating: 4.9,
  },
  "5": {
    id: "5",
    name: "Nhà hàng",
    serviceType: "restaurant",
    category: "VIP",
    capacity: 12,
    price: 1000000,
    priceNote: "đ/bàn",
    image: "/images/bg-intro.jpg",
    description: "Trải nghiệm ẩm thực tinh hoa trong không gian nhà hàng sang trọng. Thực đơn phong phú từ các món Á-Âu được chế biến bởi những đầu bếp hàng đầu, phù hợp cho mọi buổi tiệc.",
    features: [
      { icon: Maximize, label: "80m²", desc: "Diện tích" },
      { icon: UtensilsCrossed, label: "Đầu bếp", desc: "Chuyên nghiệp" },
    ],
    rating: 5.0,
  },
}

const serviceTypeIcons: Record<string, any> = {
  karaoke: Mic2,
  massage: Sparkles,
  restaurant: UtensilsCrossed,
}

interface Room {
  id: string;
  name: string;
  serviceType: string;
  category: "VIP" | "Standard";
  capacity: number;
  price: number;
  priceNote: string;
  image: string;
  description: string;
  features: { icon: any; label: string; desc: string }[];
  rating: number;
}

function formatPrice(price: number, unit: string) {
  return new Intl.NumberFormat("vi-VN").format(price) + unit
}

export default function RoomDetailPage() {
  const [isFavorite, setIsFavorite] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    const fetchRoom = async () => {
      // Kiểm tra dữ liệu tĩnh trước
      if (ROOM_DATA[id]) {
        setRoom(ROOM_DATA[id])
      } else {
        // Nếu không có trong file local mới lên Firebase tìm
        const roomRef = ref(rtdb, `rooms/${id}`)
        const snapshot = await get(roomRef)
        if (snapshot.exists()) {
          setRoom({ id, ...snapshot.val() })
        }
      }
      setLoading(false)
    }
    fetchRoom()
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center italic text-muted-foreground">Đang tải...</div>

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <Mic2 className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <h1 className="text-xl font-bold">Không tìm thấy phòng</h1>
        <p className="text-muted-foreground mt-2">Phòng này có thể không tồn tại hoặc đã bị xóa.</p>
        <Link href="/rooms" className="mt-6">
          <Button variant="default">Quay lại danh sách phòng</Button>
        </Link>
      </div>
    )
  }

  const DescriptionIcon = serviceTypeIcons[room.serviceType] || Mic2

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header Image - Contained style like Home */}
      <div className="relative p-4">
        <div className="relative h-64 w-full overflow-hidden rounded-3xl shadow-xl">
          <Image
            src={room.image}
            alt={room.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
        
        {/* Top Actions */}
        <div className="absolute left-4 right-4 top-8 flex items-center justify-between px-4">
          <Link href="/rooms">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full px-4 pb-24">
        <div className="mt-2 relative">
          {/* Room Info */}
          <Card className="border-border/50 bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{room.name}</h1>
              <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                {room.category}
              </span>
            </div>
            <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{room.capacity} người</span>
            </div>
          </Card>

          {/* Features */}
          <div className="mt-4">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Tiện nghi
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {room.features.map((feature) => (
                <Card
                  key={feature.desc}
                  className="flex flex-col items-center gap-2 border-border/50 bg-card p-4"
                >
                  <feature.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {feature.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {feature.desc}
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* Description & Action Button */}
          <div className="mt-8 space-y-4">
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Mô tả chi tiết</h2>
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
                    <div className="absolute -right-6 -top-6 opacity-10 text-primary">
                  <DescriptionIcon className="h-24 w-24 rotate-12" />
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed relative z-10 italic font-medium">
                  &quot;{room.description}&quot;
                </p>
              </div>
            </section>
            <Link href={`/rooms/${room.id}/booking`} className="block">
              <Button className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-xl shadow-lg">
                Đặt {room.name} ngay
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/30 bg-background/95 p-4 backdrop-blur-lg">
        <div className="mx-auto w-full">
          <Link href={`/rooms/${room.id}/booking`}>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Đặt {room.name} ngay
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
