"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Ticket, Package, Info } from "lucide-react"
import { ref, get, set, update } from "firebase/database"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface NotificationDetail {
  id: string
  title: string
  description: string
  time: string
  href: string
  type: "promotion" | "order" | "system"
  createdAt: number
  read?: boolean
  source: "user" | "global"
}

const iconMap = {
  promotion: Ticket,
  order: Package,
  system: Info,
}

export default function NotificationDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string
  const sourceParam = searchParams?.get("source") || "global"

  const [notification, setNotification] = useState<NotificationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadNotification = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const source = sourceParam === "user" ? "user" : "global"
        let snapshot
        let data

        if (source === "user" && user?.uid) {
          snapshot = await get(ref(rtdb, `notifications/personal/${user.uid}/${id}`))
          if (snapshot.exists()) {
            data = snapshot.val()
            setNotification({
              id,
              title: data.title,
              description: data.description,
              time: data.time || "",
              href: data.href || "#",
              type: data.type || "system",
              createdAt: data.createdAt || 0,
              read: data.read === true,
              source: "user",
            })
            setIsLoading(false)
            return
          }
        }

        snapshot = await get(ref(rtdb, `notifications/global/${id}`))
        if (snapshot.exists()) {
          data = snapshot.val()
          setNotification({
            id,
            title: data.title,
            description: data.description,
            time: data.time || data.subtitle || "",
            href: data.href || "#",
            type: data.type || "system",
            createdAt: data.createdAt || 0,
            read: false,
            source: "global",
          })
          setIsLoading(false)
          return
        }

        setError("Không tìm thấy thông báo.")
      } catch (err) {
        console.error(err)
        setError("Lỗi khi tải thông báo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadNotification()
  }, [id, sourceParam, user])

  const markAsRead = async () => {
    if (!notification || !user?.uid) return
    if (notification.read) return

    setIsSaving(true)
    try {
      if (notification.source === "user") {
        await update(ref(rtdb, `notifications/personal/${user.uid}/${notification.id}`), { read: true })
      } else {
        await set(ref(rtdb, `notifications/readStatus/${user.uid}/${notification.id}`), true)
      }
      setNotification({ ...notification, read: true })
    } catch (err) {
      console.error(err)
      setError("Không thể đánh dấu đã đọc.")
    } finally {
      setIsSaving(false)
    }
  }

  const Icon = notification ? iconMap[notification.type] || Info : Info

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50" onClick={() => router.push("/notifications")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Chi tiết thông báo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        {isLoading ? (
          <div className="rounded-2xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
            Đang tải chi tiết thông báo...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
          </div>
        ) : notification ? (
          <div className="space-y-6">
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{notification.type === "promotion" ? "Khuyến mãi" : notification.type === "order" ? "Đơn hàng" : "Hệ thống"}</p>
                  <p className="text-sm text-muted-foreground">{notification.time}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <h2 className="text-xl font-bold text-foreground">{notification.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{notification.description}</p>
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={() => router.push("/notifications")} className="w-full">
                Quay lại danh sách thông báo
              </Button>
              {notification.href && notification.href !== "#" && (
                <Link href={notification.href} className="block">
                  <Button variant="secondary" className="w-full">
                    Xem chi tiết liên quan
                  </Button>
                </Link>
              )}
              <Button onClick={markAsRead} disabled={notification.read || isSaving} className="w-full">
                {notification.read ? "Đã đọc" : isSaving ? "Đang cập nhật..." : "Đánh dấu đã đọc"}
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
