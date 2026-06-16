"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Mic2, Sparkles, UtensilsCrossed, Star } from "lucide-react"

interface Room {
  id: string
  name: string
  type: string
  category: string
  priceNote: string
  image: string
}

const serviceIcons: Record<string, any> = {
  karaoke: Mic2,
  massage: Sparkles,
  restaurant: UtensilsCrossed,
}

const rooms: Room[] = [
  {
    id: "1",
    name: "Karaoke",
    type: "karaoke",
    category: "Phòng VIP",
    priceNote: "",
    image: "/images/vip1.jpg",
  },
  {
    id: "3",
    name: "Massage",
    type: "massage",
    category: "VIP & Spa",
    priceNote: "",
    image: "/images/monaco1.jpg",
  },
  {
    id: "5",
    name: "Nhà hàng",
    type: "restaurant",
    category: "Ẩm thực cao cấp",
    priceNote: "",
    image: "/images/bg-intro.jpg",
  },
]

export default function RoomsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="mx-auto max-w-md px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Tất cả dịch vụ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Chọn dịch vụ bạn muốn đặt lịch</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 space-y-5">
        {rooms.map((room) => {
          const Icon = serviceIcons[room.type] || Mic2;
          return (
            <Link key={room.id} href={`/rooms/${room.id}`} className="block group">
              <div className="flex gap-4 border-2 border-primary/30 p-4 rounded-xl bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg active:scale-[0.98]">
                {/* Ảnh bên trái */}
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl">
                  <Image 
                    src={room.image} 
                    alt={room.name} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                </div>
                {/* Nội dung bên phải */}
                <div className="flex flex-col justify-center min-w-0 flex-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-base">{room.name}</h4>
                    <span className="bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5" /> {room.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-0.5">4.8</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    Xem chi tiết →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </main>
    </div>
  )
}