"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell, ChevronRight, Mic2, Sparkles, UtensilsCrossed, Ticket } from "lucide-react"
import { onValue, ref } from "firebase/database"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"

const serviceIcons: Record<string, any> = {
  karaoke: Mic2,
  massage: Sparkles,
  restaurant: UtensilsCrossed,
}

const staticRooms = [
  { id: "1", name: "Karaoke", type: "karaoke" },
  { id: "3", name: "Massage", type: "massage" },
  { id: "5", name: "Nhà hàng", type: "restaurant" },
]

export default function HomePage() {
  const [featuredPromos, setFeaturedPromos] = useState<any[]>([])
  const [otherPromos, setOtherPromos] = useState<any[]>([])
  const [bannerApi, setBannerApi] = useState<CarouselApi>()
  const [cardApi, setCardApi] = useState<CarouselApi>()
  const [otherCardApi, setOtherCardApi] = useState<CarouselApi>()
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, loading } = useAuth()

  // Load promotions from Firebase
  useEffect(() => {
    const loadPromos = async () => {
      try {
        const res = await fetch("/api/promotions")
        const data = await res.json()
        if (res.ok) {
          const now = new Date()
          const active = (data.promotions || []).filter((p: any) => {
            if (!p.isActive) return false
            if (p.endDate) try { return new Date(p.endDate) >= now } catch { return true }
            return true
          })
          setFeaturedPromos(active.filter((p: any) => p.featured).slice(0, 5))
          setOtherPromos(active.filter((p: any) => !p.featured).slice(0, 5))
        }
      } catch (e) {
        console.error("Error loading promos:", e)
      }
    }
    loadPromos()
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0)
      return
    }

    const userNotificationsRef = ref(rtdb, `notifications/personal/${user.uid}`)
    const notificationsRef = ref(rtdb, "notifications/global")
    const userNotificationReadRef = ref(rtdb, `notifications/readStatus/${user.uid}`)

    let userData: Record<string, any> = {}
    let globalData: Record<string, any> = {}
    let readData: Record<string, any> = {}

    const recalc = () => {
      let count = 0
      Object.values(userData).forEach((item: any) => { if (!item?.read) count += 1 })
      Object.keys(globalData).forEach((key) => { if (!readData?.[key]) count += 1 })
      setUnreadCount(count)
    }

    const unsubUser = onValue(userNotificationsRef, (snapshot) => { userData = snapshot.val() || {}; recalc() })
    const unsubGlobal = onValue(notificationsRef, (snapshot) => { globalData = snapshot.val() || {}; recalc() })
    const unsubRead = onValue(userNotificationReadRef, (snapshot) => { readData = snapshot.val() || {}; recalc() })

    return () => { unsubUser(); unsubGlobal(); unsubRead() }
  }, [user?.uid])

  // Auto-slide for banner carousel
  useEffect(() => {
    if (!bannerApi) return
    const timer = setInterval(() => bannerApi.scrollNext(), 4000)
    return () => clearInterval(timer)
  }, [bannerApi])

  // Auto-slide for card carousel (featured)
  useEffect(() => {
    if (!cardApi) return
    const timer = setInterval(() => cardApi.scrollNext(), 3500)
    return () => clearInterval(timer)
  }, [cardApi])

  // Auto-slide for other promos carousel
  useEffect(() => {
    if (!otherCardApi) return
    const timer = setInterval(() => otherCardApi.scrollNext(), 3500)
    return () => clearInterval(timer)
  }, [otherCardApi])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm">👑</span>
            </div>
            <h1 className="text-lg font-bold">
              Xin chào, <span className="text-primary">{loading ? "..." : (user?.username || user?.name || "Khách")}</span> 👋
            </h1>
          </div>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pb-24">
        {/* Points Card */}
        <Link href="/wallet" className="block">
          <Card className="relative overflow-hidden flex items-center gap-4 border-primary/40 bg-gradient-to-br from-primary/20 via-primary/5 to-background p-5 transition-all hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98] group">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-110" />
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 shadow-inner">
              <span className="text-2xl drop-shadow-sm">🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Điểm tích lũy</p>
              <p className="text-2xl font-bold text-primary tracking-tight">
                {user?.points?.toLocaleString() || 0}{" "}
                <span className="text-sm font-medium opacity-80">điểm</span>
              </p>
            </div>
            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/30 transition-transform group-hover:translate-x-1" />
          </Card>
        </Link>

        {/* Banner Carousel - hình ảnh to */}
        {featuredPromos.length > 0 && (
          <Carousel setApi={setBannerApi} opts={{ loop: true }} className="w-full">
            <CarouselContent className="-ml-0">
              {featuredPromos.map((promo: any) => (
                <CarouselItem key={promo.id} className="pl-0">
                  <Link href={`/promotions/${promo.id}`} className="block relative overflow-hidden rounded-2xl">
                    <Image src={promo.imageUrl} alt={promo.title} width={400} height={200} className="h-44 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">{promo.title}</p>
                      <h2 className="mb-2 text-xl font-bold text-white">{promo.subtitle}</h2>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Xem ngay</Button>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        {/* Services */}
        <section>
          <h3 className="mb-4 text-base font-semibold text-foreground">Dịch vụ của chúng tôi</h3>
          <div className="grid grid-cols-3 gap-4">
            {staticRooms.map((room) => {
              const Icon = serviceIcons[room.type] || Mic2
              return (
                <Link key={room.id} href={`/rooms/${room.id}`} className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/50 text-primary shadow-sm transition-colors hover:border-primary/50">
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="text-xs font-medium">{room.name}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Khuyến mãi nổi bật */}
        {featuredPromos.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">🌟</span> Khuyến mãi nổi bật
              </h3>
              <Link href="/promotions" className="flex items-center gap-1 text-sm text-primary">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <Carousel setApi={setCardApi} opts={{ loop: true }} className="w-full">
              <CarouselContent className="-ml-0">
                {featuredPromos.map((promo: any) => (
                  <CarouselItem key={promo.id} className="pl-0">
                    <Link href={`/promotions/${promo.id}`}>
                      <Card className="flex gap-3 border-2 border-primary/30 p-3 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                          <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground text-sm">{promo.title}</h4>
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0">Nổi bật</span>
                          </div>
                          {promo.subtitle && (
                            <p className="text-xs font-semibold text-primary mt-0.5">{promo.subtitle}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{promo.content}</p>
                        </div>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>
        )}

        {/* Khuyến mãi khác */}
        {otherPromos.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" /> Khuyến mãi khác
              </h3>
              <Link href="/promotions" className="flex items-center gap-1 text-sm text-primary">
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <Carousel setApi={setOtherCardApi} opts={{ loop: true }} className="w-full">
              <CarouselContent className="-ml-0">
                {otherPromos.map((promo: any) => (
                  <CarouselItem key={promo.id} className="pl-0">
                    <Link href={`/promotions/${promo.id}`}>
                      <Card className="flex gap-3 border-border/50 p-3 transition-colors hover:border-primary/50">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                          <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <h4 className="font-bold text-foreground text-sm">{promo.title}</h4>
                          {promo.subtitle && (
                            <p className="text-xs font-semibold text-primary mt-0.5">{promo.subtitle}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{promo.content}</p>
                        </div>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>
        )}
      </main>
    </div>
  )
}