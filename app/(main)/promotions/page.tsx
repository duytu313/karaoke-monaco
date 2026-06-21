"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Ticket, ChevronRight, Loader2, Calendar, Clock, Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"

interface Promotion {
  id: string
  title: string
  subtitle: string
  content: string
  startDate: string
  endDate: string
  imageUrl: string
  isActive: boolean
  rules: string[]
  featured: boolean
  createdAt: number
}

export default function PromotionsListPage() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === "admin"

  const loadPromotions = async () => {
    try {
      const res = await fetch("/api/promotions")
      const data = await res.json()
      if (res.ok) setPromotions(data.promotions || [])
    } catch (error) {
      console.error("Error loading promotions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa khuyến mãi này?")) return
    try {
      const res = await fetch(`/api/promotions?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error("Error deleting promotion:", error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPromo) return
    setSaving(true)

    try {
      const isNew = !promotions.find((p) => p.id === editingPromo.id)
      const res = await fetch("/api/promotions", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPromo),
      })

      if (res.ok) {
        await loadPromotions()
        setEditingPromo(null)
      }
    } catch (error) {
      console.error("Error saving promotion:", error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Không giới hạn"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("vi-VN")
    } catch {
      return dateStr
    }
  }

  const isExpired = (promo: Promotion) => {
    if (!promo.endDate) return false
    try {
      return new Date(promo.endDate) < new Date()
    } catch {
      return false
    }
  }

  const activePromotions = promotions.filter((p) => p.isActive && !isExpired(p))
  const featuredPromotions = activePromotions.filter((p) => p.featured)
  const regularPromotions = activePromotions.filter((p) => !p.featured)

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-4 px-5 py-5">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Tất cả khuyến mãi</h1>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-primary text-base"
              onClick={() => setShowAdmin(!showAdmin)}
            >
              {showAdmin ? "Đóng" : "Quản lý"}
            </Button>
          )}
        </div>
      </header>

      {isAdmin && showAdmin && (
        <div className="p-4 bg-accent/5 border-b border-border/30">
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              className="gap-1"
              onClick={() =>
                setEditingPromo({
                  id: "",
                  title: "",
                  subtitle: "",
                  content: "",
                  startDate: new Date().toISOString().split("T")[0],
                  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
                  imageUrl: "/images/bg-intro.jpg",
                  isActive: true,
                  rules: [],
                  featured: false,
                  createdAt: Date.now(),
                })
              }
            >
              <Plus className="h-4 w-4" /> Thêm khuyến mãi
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Bạn đang ở chế độ quản lý. Thêm, sửa, xóa khuyến mãi trực tiếp.
          </p>
        </div>
      )}

      {/* Admin Edit Form */}
      {editingPromo && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <Card className="w-full w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  {promotions.find((p) => p.id === editingPromo.id) ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingPromo(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold">Tiêu đề</label>
                  <Input value={editingPromo.title} onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold">Phụ đề</label>
                  <Input value={editingPromo.subtitle} onChange={(e) => setEditingPromo({ ...editingPromo, subtitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold">Nội dung</label>
                  <Textarea value={editingPromo.content} onChange={(e) => setEditingPromo({ ...editingPromo, content: e.target.value })} required rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold">Ngày bắt đầu</label>
                    <Input type="date" value={editingPromo.startDate?.split("T")[0] || ""} onChange={(e) => setEditingPromo({ ...editingPromo, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold">Ngày kết thúc</label>
                    <Input type="date" value={editingPromo.endDate?.split("T")[0] || ""} onChange={(e) => setEditingPromo({ ...editingPromo, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold">URL hình ảnh</label>
                  <Input value={editingPromo.imageUrl} onChange={(e) => setEditingPromo({ ...editingPromo, imageUrl: e.target.value })} />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingPromo.isActive} onChange={(e) => setEditingPromo({ ...editingPromo, isActive: e.target.checked })} />
                    Đang hoạt động
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingPromo.featured} onChange={(e) => setEditingPromo({ ...editingPromo, featured: e.target.checked })} />
                    Nổi bật
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      <main className="flex-1 p-5 py-6 space-y-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Khuyến mãi nổi bật */}
            {featuredPromotions.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">🌟</span>
                  <h2 className="text-lg font-bold uppercase tracking-widest text-foreground">Khuyến mãi nổi bật</h2>
                </div>
                <div className="grid grid-cols-1 gap-[1cm]">
                  {featuredPromotions.map((promo) => (
                    <div key={promo.id} className="relative">
                      <Link href={`/promotions/${promo.id}`} className="block group">
                        <Card className="overflow-hidden border-primary/30 shadow-lg rounded-[2rem] bg-card border-2 group-hover:border-primary transition-all p-0">
                          <div className="relative h-56 w-full">
                            <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute top-4 left-4">
                              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                                🔥 Nổi bật
                              </span>
                            </div>
                            <div className="absolute bottom-4 left-5 right-5">
                              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Khuyến mãi</p>
                              <h3 className="text-2xl font-bold text-white leading-tight uppercase tracking-tighter">{promo.title}</h3>
                              <p className="text-base font-semibold text-primary/90 tracking-tight">{promo.subtitle}</p>
                            </div>
                          </div>
                          <div className="p-5 bg-card space-y-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 italic">{promo.content}</p>
                            {promo.startDate && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" /> {formatDate(promo.startDate)}
                                </span>
                                <span>→</span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" /> {formatDate(promo.endDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      </Link>
                      {isAdmin && showAdmin && (
                        <div className="absolute top-4 right-4 flex gap-1 z-10">
                          <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90" onClick={() => setEditingPromo(promo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90 text-red-500" onClick={() => handleDelete(promo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Khuyến mãi thường */}
            {regularPromotions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Ticket className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold uppercase tracking-widest text-foreground">Khuyến mãi khác</h2>
                </div>
                <div className="grid grid-cols-1 gap-[1cm]">
                  {regularPromotions.map((promo) => (
                    <div key={promo.id} className="relative">
                      <Link href={`/promotions/${promo.id}`} className="block group">
                        <Card className="overflow-hidden border-border/50 shadow-md rounded-[2rem] group-hover:border-primary/50 bg-card p-0 border-none shadow-lg">
                          <div className="relative h-52 w-full">
                            <Image src={promo.imageUrl} alt={promo.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-5 right-5">
                              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Khuyến mãi</p>
                              <h3 className="text-xl font-bold text-white leading-tight uppercase tracking-tighter">{promo.title}</h3>
                              <p className="text-sm font-semibold text-primary/90 tracking-tight">{promo.subtitle}</p>
                            </div>
                            <div className="absolute top-3 right-4 h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary shadow-lg">
                              <Ticket className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="p-5 bg-card space-y-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">{promo.content}</p>
                            {promo.startDate && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" /> {formatDate(promo.startDate)}
                                </span>
                                <span>→</span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" /> {formatDate(promo.endDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      </Link>
                      {isAdmin && showAdmin && (
                        <div className="absolute top-4 right-4 flex gap-1 z-10">
                          <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90" onClick={() => setEditingPromo(promo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90 text-red-500" onClick={() => handleDelete(promo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activePromotions.length === 0 && (
              <div className="text-center py-20 space-y-3">
                <Ticket className="h-14 w-14 text-muted-foreground/20 mx-auto" />
                <p className="text-base text-muted-foreground italic">Hiện không có khuyến mãi nào</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}