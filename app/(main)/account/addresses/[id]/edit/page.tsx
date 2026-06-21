"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Home, Briefcase, MapPin, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { get, ref, remove, update } from "firebase/database"

export default function EditAddressPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [type, setType] = useState<"home" | "office">("home")
  const [address, setAddress] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadAddress = async () => {
      const userKey = user?.username || user?.uid
      if (!userKey || !params.id) return
      setIsLoading(true)
      const addressRef = ref(rtdb, `users/profiles/${userKey}/addresses/${params.id}`) // Đã sửa ở lần trước
      const snapshot = await get(addressRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        setType(data.type || "home")
        setAddress(data.address || "")
        setIsDefault(data.isDefault === true)
      }
      setIsLoading(false)
    }

    loadAddress()
  }, [params.id, user])

  const handleSave = async () => {
    const userKey = user?.username || user?.uid
    if (!userKey || !params.id || !address.trim()) return
    setIsSaving(true)

    try {
      const updates: Record<string, any> = {
        [`users/profiles/${userKey}/addresses/${params.id}/type`]: type,
        [`users/profiles/${userKey}/addresses/${params.id}/address`]: address,
        [`users/profiles/${userKey}/addresses/${params.id}/isDefault`]: isDefault,
      }

      if (isDefault) {
        const addressesSnapshot = await get(ref(rtdb, `users/profiles/${userKey}/addresses`))
        if (addressesSnapshot.exists()) {
          const allAddresses = addressesSnapshot.val() || {}
          Object.keys(allAddresses).forEach((key) => {
            if (key !== params.id) {
              updates[`users/profiles/${userKey}/addresses/${key}/isDefault`] = false
            }
          })
        }
      }

      await update(ref(rtdb, "/"), updates)
      router.push("/account/addresses")
    } catch (error) {
      console.error("Error updating address:", error)
      alert("Không thể cập nhật địa chỉ. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const userKey = user?.username || user?.uid
    if (!userKey || !params.id) return
    await remove(ref(rtdb, `users/profiles/${userKey}/addresses/${params.id}`))
    router.push("/account/addresses")
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
          <h1 className="text-lg font-bold text-foreground">Chỉnh sửa địa chỉ</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-8 mt-4">
        {/* Chọn loại địa chỉ */}
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

        {/* Nhập địa chỉ */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Chi tiết địa chỉ</p>
          <Card className="p-4 border-border/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Địa chỉ cụ thể
              </label>
              <Input 
                placeholder="Số nhà, tên đường, phường/xã..." 
                className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 h-12"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </Card>
        </section>

        {/* Cài đặt mặc định */}
        <section className="px-1">
          <div className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl shadow-sm">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-foreground">Đặt làm địa chỉ mặc định</p>
              <p className="text-xs text-muted-foreground italic tracking-tight">Tự động chọn khi đặt dịch vụ</p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </section>

        {/* Nút xóa */}
        <section className="px-1 pt-4 pb-10">
          <Button 
            variant="ghost" 
            className="w-full justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 h-12 rounded-xl border border-dashed border-red-200"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="font-bold text-sm">Xóa địa chỉ này</span>
          </Button>
        </section>
      </main>

      {/* Nút lưu */}
      <div className="sticky bottom-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <Button 
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
          onClick={handleSave}
          disabled={!address.trim() || isSaving || isLoading}
        >
          <Check className="h-5 w-5" />
          {isSaving ? "Đang lưu..." : "Cập nhật địa chỉ"}
        </Button>
      </div>
    </div>
  )
}