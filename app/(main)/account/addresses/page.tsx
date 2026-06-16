"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Plus, Home, Briefcase, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { onValue, ref, remove, update } from "firebase/database"

interface AddressItem {
  id: string
  label: string
  type: "home" | "office"
  address: string
  isDefault: boolean
}

const typeLabelMap: Record<AddressItem["type"], string> = {
  home: "Nhà riêng",
  office: "Văn phòng",
}

export default function AddressesPage() {
  const { user, loading } = useAuth()
  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userKey = user?.username || user?.uid
    if (!userKey) {
      setAddresses([])
      setIsLoading(false)
      return
    }

    const addressesRef = ref(rtdb, `users/profiles/${userKey}/addresses`) // Đã sửa ở lần trước
    const unsubscribe = onValue(addressesRef, (snapshot) => {
      const value = snapshot.val() || {}
      const items = Object.entries(value).map(([key, item]: [string, any]) => ({
        id: key,
        label: item.label || typeLabelMap[item.type as "home" | "office"] || "Địa chỉ",
        type: item.type || "home",
        address: item.address || "",
        isDefault: item.isDefault === true,
      }))
      items.sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      setAddresses(items)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleDelete = async (id: string) => {
    const userKey = user?.username || user?.uid
    if (!userKey) return
    await remove(ref(rtdb, `users/profiles/${userKey}/addresses/${id}`)) // Đã sửa ở lần trước
  }

  const handleSetDefault = async (id: string) => {
    const userKey = user?.username || user?.uid
    if (!userKey) return
    const updates: Record<string, any> = {}
    addresses.forEach((addr) => {
      updates[`users/profiles/${userKey}/addresses/${addr.id}/isDefault`] = addr.id === id // Đã sửa ở lần trước
    })
    await update(ref(rtdb, "/"), updates)
  }

  const isAccountLoading = loading || isLoading

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/account">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-foreground">Địa chỉ đã lưu</h1>
          </div>
          <Link href="/account/addresses/new">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-primary hover:bg-primary/10">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 mt-2">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Danh sách địa chỉ</p>
          
          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <Card key={addr.id} className="p-4 border-border/50 shadow-sm relative overflow-hidden group">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {addr.type === "home" ? <Home className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm text-foreground">{addr.label}</h3>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                        {addr.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/20 flex justify-end gap-3">
                    {!addr.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] font-bold text-primary hover:bg-primary/5 uppercase tracking-tight mr-auto px-0"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        Đặt làm mặc định
                      </Button>
                    )}
                    <Link href={`/account/addresses/${addr.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Sửa
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(addr.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Xóa
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Bạn chưa có địa chỉ nào được lưu.</p>
              <Link href="/account/addresses/new">
                <Button className="bg-accent text-accent-foreground font-bold rounded-xl px-6">
                  Thêm ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30 z-40">
        <div className="mx-auto max-w-md">
          <Link href="/account/addresses/new">
            <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              Thêm địa chỉ mới
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}