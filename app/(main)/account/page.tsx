"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Clock, MapPin, Bell, Settings, LogOut, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useState, useEffect } from "react"
import { fetchUserBookings } from "@/lib/rtdb-utils"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: User, label: "Thông tin cá nhân", href: "/account/profile" },
  { icon: Clock, label: "Lịch sử đặt phòng", href: "/orders" },
  { icon: MapPin, label: "Địa chỉ đã lưu", href: "/account/addresses" },
  { icon: Bell, label: "Thông báo", href: "/notifications" },
  { icon: Settings, label: "Cài đặt", href: "/account/settings" },
]

export default function AccountPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [orderCount, setOrderCount] = useState(0)

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  useEffect(() => {
    const loadOrderCount = async () => {
      if (!user) return

      try {
        const bookings = await fetchUserBookings(user.uid)
        setOrderCount(bookings ? Object.keys(bookings).length : 0)
      } catch (error) {
        console.error("Error fetching order count:", error)
        setOrderCount(0)
      }
    }

    loadOrderCount()
  }, [user?.uid])

  const getRank = (points: number) => {
    if (points >= 5000) return { label: "Kim Cương", color: "text-blue-400" }
    if (points >= 2000) return { label: "Vàng", color: "text-yellow-500" }
    if (points >= 500) return { label: "Bạc", color: "text-slate-400" }
    return { label: "Thành viên", color: "text-primary" }
  }

  const userPoints = user?.points || 0
  const rank = getRank(userPoints)

  if (loading) return <div className="min-h-screen flex items-center justify-center italic text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Đang xác thực...</div>

  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-20">
      {/* Enhanced Profile Header */}
      <header className="relative overflow-hidden p-10 pt-14 text-center">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl -z-10" />
        
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-28 w-28 rounded-full border-4 border-background overflow-hidden shadow-xl ring-4 ring-primary/10">
              <img 
                src={user?.avatarUrl || "/images/avatar.jpg"} 
                alt="Avatar" 
                className="h-full w-full object-cover" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {user?.username || user?.name || "Người dùng Monaco"}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700 border border-slate-300 shadow-sm">
                {rank.label}
              </span>
              <span className="text-base font-bold text-primary">{user?.points?.toLocaleString() || 0} điểm</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-[0.5cm]">
        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 gap-[0.5cm]">
          <Card className="p-5 border-border/50 bg-card/50 backdrop-blur shadow-sm text-center space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Đơn hàng</p>
            <p className="text-2xl font-black text-foreground">{orderCount}</p>
          </Card>
          <Card className="p-5 border-border/50 bg-card/50 backdrop-blur shadow-sm text-center space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Hạng thẻ</p>
            <p className={cn("text-2xl font-black", rank.color)}>{rank.label}</p>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Tài khoản</p>
          <div className="space-y-[0.5cm]"> {/* Thay thế Card bao ngoài bằng div và thêm khoảng cách giữa các Card */}
            {menuItems.map((item) => (
              <Link key={item.label} href={item.href} className="block group">
                <div className="flex items-center gap-4 px-5 h-20 bg-card border border-border/50 rounded-2xl shadow-sm active:bg-muted/50 transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="flex-1 font-bold text-lg text-foreground truncate">{item.label}</span>
                  <ChevronRight className="h-6 w-6 text-muted-foreground/30 shrink-0 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Hệ thống</p>
          <button 
            className="w-full group text-left"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4 px-5 h-20 bg-card border border-border/50 rounded-2xl shadow-sm active:bg-red-50 transition-all hover:border-red-200">
              <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 shrink-0 group-hover:bg-red-200 transition-colors">
                <LogOut className="h-6 w-6" />
              </div>
              <span className="flex-1 font-bold text-lg text-red-500">Đăng xuất</span>
              <ChevronRight className="h-6 w-6 text-red-200 shrink-0" />
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}