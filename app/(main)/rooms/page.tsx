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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg">
        <div className="app-container py-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Tất cả dịch vụ</h1>
          <p className="text-lg text-muted-foreground mt-1">Chọn dịch vụ bạn muốn đặt lịch</p>
        </div>
      </header>

      <main className="app-container py-6 space-y-[1cm]">
        {rooms.map((room) => {
          const Icon = serviceIcons[room.type] || Mic2;
          return (
            <Link key={room.id} href={`/rooms/${room.id}`} className="block group">
              <div className="flex gap-5 border border-border/50 bg-card p-4 rounded-xl transition-all duration-300 hover:border-primary/50 hover:shadow-xl active:scale-[0.98] min-h-[6cm]">
                {/* Ảnh bên trái */}
                <div className="relative h-52 w-52 sm:h-60 sm:w-60 shrink-0 overflow-hidden rounded-xl">
                  <Image 
                    src={room.image} 
                    alt={room.name} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                </div>
                {/* Nội dung bên phải */}
                <div className="flex flex-col justify-center min-w-0 flex-1 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <h4 className="font-bold text-foreground text-xl sm:text-2xl shrink-0">{room.name}</h4>
                    <span className="bg-primary/10 text-primary text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold shrink-0 flex items-center gap-1.5 max-w-[50%] sm:max-w-none overflow-hidden text-ellipsis whitespace-nowrap">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> <span className="truncate">{room.category}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">4.8</span>
                  </div>
                  <span className="text-lg font-medium text-muted-foreground group-hover:text-primary transition-colors">
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