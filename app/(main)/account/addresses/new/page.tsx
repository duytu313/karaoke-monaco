"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home, Briefcase, MapPin, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { get, push, ref, set } from "firebase/database"

const typeLabelMap = {
  home: "Nhà riêng",
  office: "Văn phòng",
}

export default function NewAddressPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [type, setType] = useState<"home" | "office">("home")
  const [address, setAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [defaultAddress, setDefaultAddress] = useState(false)

  useEffect(() => {
    const loadHasAddresses = async () => {
      const userKey = user?.username || user?.uid
      if (!userKey) return
      const snapshot = await get(ref(rtdb, `users/profiles/${userKey}/addresses`))
      setDefaultAddress(!snapshot.exists())
    }

    loadHasAddresses()
  }, [user])

  const handleSave = async () => {
    const userKey = user?.username || user?.uid
    if (!userKey || !address.trim()) return
    setIsSaving(true)

    try {
      const addressesRef = ref(rtdb, `users/profiles/${userKey}/addresses`)
      const newAddressRef = push(addressesRef)
      const newId = newAddressRef.key
      await set(newAddressRef, {
        id: newId,
        label: typeLabelMap[type],
        type,
        address: address.trim(),
        isDefault: defaultAddress,
        createdAt: Date.now(),
      })
      router.push("/account/addresses")
    } catch (error) {
      console.error("Error saving address:", error)
      alert("Không thể lưu địa chỉ. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account/addresses">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Thêm địa chỉ mới</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-8 mt-4">
        {/* Type Selection */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Loại địa chỉ</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setType("home")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                type === "home" 
                  ? "bg-primary/10 border-primary text-primary shadow-sm" 
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Home className={cn("h-6 w-6", type === "home" ? "text-primary" : "text-muted-foreground/50")} />
              <span className="font-bold text-sm">Nhà riêng</span>
            </button>
            <button
              onClick={() => setType("office")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                type === "office" 
                  ? "bg-primary/10 border-primary text-primary shadow-sm" 
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Briefcase className={cn("h-6 w-6", type === "office" ? "text-primary" : "text-muted-foreground/50")} />
              <span className="font-bold text-sm">Văn phòng</span>
            </button>
          </div>
        </section>

        {/* Address Input */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Chi tiết địa chỉ</p>
          <Card className="p-4 border-border/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Địa chỉ cụ thể
              </label>
              <Input 
                placeholder="Số nhà, tên đường, phường/xã..." 
                className="bg-muted/20 border-border/50 focus-visible:ring-primary/20"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </Card>
          <p className="text-[10px] text-muted-foreground px-1 italic">
            * Địa chỉ này sẽ được dùng để gợi ý khi bạn đặt lịch dịch vụ tại Monaco.
          </p>
        </section>
      </main>

      {/* Bottom Action */}
      <div className="sticky bottom-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <Button 
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
          onClick={handleSave}
          disabled={!address.trim() || isSaving || !user?.uid}
        >
          <Check className="h-5 w-5" />
          {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
        </Button>
      </div>
    </div>
  )
}