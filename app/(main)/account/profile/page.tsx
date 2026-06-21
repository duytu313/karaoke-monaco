"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, User, Phone, Mail, Calendar, MapPin, Home, Briefcase, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { get, ref, update } from "firebase/database"

const typeLabelMap = {
  home: "Nhà riêng",
  office: "Văn phòng",
}

interface AddressItem {
  id: string
  label: string
  type: "home" | "office"
  address: string
  isDefault: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [birthday, setBirthday] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [defaultAddress, setDefaultAddress] = useState<AddressItem | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setPhone(user.phoneNumber || "")
      setEmail(user.email || "")
      setBirthday(user.birthday || "")
    }
  }, [user])

  useEffect(() => {
    const loadDefaultAddress = async () => {
      // Chỉ load khi có username (profiles được lưu theo username, không theo uid)
      const userKey = user?.username
      if (!userKey) {
        setDefaultAddress(null)
        return
      }

      try {
        const addressesRef = ref(rtdb, `users/profiles/${userKey}/addresses`)
        const snapshot = await get(addressesRef)
        if (!snapshot.exists()) {
          setDefaultAddress(null)
          return
        }

        const value = snapshot.val() || {}
        const items: AddressItem[] = Object.entries(value).map(([key, item]: [string, any]) => ({
          id: key,
          label: item.label || typeLabelMap[item.type as "home" | "office"] || "Địa chỉ",
          type: item.type || "home",
          address: item.address || "",
          isDefault: item.isDefault === true,
        }))

        setDefaultAddress(items.find((addr) => addr.isDefault) || null)
      } catch (error) {
        console.error("Error loading default address:", error)
        setDefaultAddress(null)
      }
    }

    loadDefaultAddress()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    const userKey = user.username || user.uid
    setIsLoading(true)
    try {
      const userRef = ref(rtdb, `users/profiles/${userKey}`) // Đã sửa ở lần trước
      await update(userRef, {
        name,
        phoneNumber: phone,
        birthday,
      })
      alert("Cập nhật thông tin thành công!")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="relative overflow-hidden p-6 pb-4">
        {/* Decorative background elements like Account page */}
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl -z-10" />

        <div className="flex items-center gap-3 mb-6">
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground tracking-tight">Hồ sơ của tôi</h1>
        </div>

        {/* Avatar Section */}
        <section className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="h-28 w-28 rounded-full border-4 border-background overflow-hidden shadow-xl ring-4 ring-primary/10 bg-muted">
              <Image
                src={avatarPreview || "/images/avatar.jpg"}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white border-4 border-background shadow-lg">
              <Camera className="h-4 w-4" />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          </div>
        </section>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <section className="space-y-6">
          <Card className="p-4 border-border/50 shadow-sm space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> Họ và tên
              </label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 h-11" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Phone className="h-3 w-3" /> Số điện thoại
              </label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 h-11" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" /> Email
              </label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 h-11" 
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Ngày sinh
              </label>
              <Input 
                type="date" 
                value={birthday} 
                onChange={(e) => setBirthday(e.target.value)}
                className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 h-11" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Địa chỉ
              </label>
              {defaultAddress ? (
                <Link href="/account/addresses">
                  <div className="flex items-center justify-between bg-muted/20 border border-border/50 rounded-xl p-3 active:bg-accent/5 transition-colors">
                    <div className="flex flex-col min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        {defaultAddress.type === "home" ? (
                        <Home className="h-3 w-3 text-primary" />
                      ) : (
                        <Briefcase className="h-3 w-3 text-primary" />
                      )}
                        <span className="font-bold text-sm text-foreground">{defaultAddress.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1 italic">{defaultAddress.address}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary font-bold h-8 shrink-0">Thay đổi</Button>
                  </div>
                </Link>
              ) : (
                <Link href="/account/addresses/new">
                  <div className="flex items-center gap-4 px-4 h-12 bg-card border border-border/50 rounded-xl shadow-sm active:bg-muted/50 transition-all">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-muted-foreground italic">Chưa có địa chỉ mặc định</span>
                    <Button variant="ghost" size="sm" className="text-primary font-bold ml-auto">Thêm mới</Button>
                  </div>
                </Link>
              )}
            </div>
          </Card>
        </section>
      </main>

      <div className="sticky bottom-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <Button 
          onClick={handleSave}
          disabled={isLoading}
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  )
}