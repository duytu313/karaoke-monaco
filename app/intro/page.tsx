"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

const images = [
  "/images/bg-intro.jpg",
  "/images/monaco1.jpg",
  "/images/monaco2.jpg",
];

const slideAnimations = [
  "scale-125 translate-x-8 rotate-1",  // Slide 1: Phóng to, trượt phải & xoay nhẹ
  "scale-125 -translate-x-8 -rotate-1", // Slide 2: Phóng to, trượt trái & xoay ngược
  "scale-125 -translate-y-8 rotate-1", // Slide 3: Phóng to, trượt lên & xoay nhẹ
];

export default function IntroPage() {
  const [api, setApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)

  // Cập nhật index khi slide thay đổi (do vuốt hoặc tự động chạy)
  useEffect(() => {
    if (!api) return
    
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap())
    })
  }, [api])

  // Tự động chuyển slide sau mỗi 5 giây
  useEffect(() => {
    if (!api) return
    const timer = setInterval(() => {
      api.scrollNext()
    }, 6000)
    return () => clearInterval(timer)
  }, [api])

  return (
    <main className="min-h-[100dvh] w-full bg-slate-950/5 dark:bg-slate-950/40 relative overflow-hidden">
      {/* Background Carousel - Trượt ngang và hỗ trợ vuốt */}
      <Carousel 
        setApi={setApi} 
        opts={{ loop: true }} 
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      >
        <CarouselContent className="h-[100dvh] ml-0">
          {images.map((src, index) => (
            <CarouselItem key={index} className="relative h-full basis-full overflow-hidden pl-0">
              <Image
                src={src}
                alt={`Monaco Background ${index + 1}`}
                fill
                className={cn(
                  "object-cover opacity-50 transition-transform duration-[10000ms] ease-linear",
                  currentSlide === index ? slideAnimations[index % slideAnimations.length] : "scale-110 translate-x-0 translate-y-0"
                )}
                priority={index === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent dark:from-slate-950/40 dark:via-slate-900/30 pointer-events-none" />
      </Carousel>

      {/* Content */}
      <div 
        key={currentSlide} 
        className="relative z-10 min-h-[100dvh] flex flex-col justify-end px-4 sm:px-6 pb-8 sm:pb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out pointer-events-none"
      >
        {/* Brand */}
        <div className="mb-3 sm:mb-4 pointer-events-auto">
          <p className="text-amber-300 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] font-medium opacity-90">
            MONACO KARAOKE
          </p>
        </div>

        {/* Slide Content */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight whitespace-pre-line">
            Trải nghiệm{"\n"}đẳng cấp khác biệt
          </h1>
          <p className="text-slate-200/90 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl">
            Hệ thống giải trí hàng đầu với Karaoke, Massage, Nhà hàng sang trọng bậc nhất.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 sm:space-y-4 pointer-events-auto">
          <Button
            asChild
            variant="outline"
            className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg font-medium border-white text-white bg-white/10 hover:bg-white/20 rounded-xl"
          >
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button
            asChild
            className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400 rounded-xl shadow-xl shadow-amber-500/20"
          >
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
