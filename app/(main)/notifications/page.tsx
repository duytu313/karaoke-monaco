"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Ticket, Package, Info } from "lucide-react"
import { onValue, ref, update } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  href: string
  type: "promotion" | "order" | "system"
  createdAt: number
  read?: boolean
  source?: "user" | "global"
}

const iconMap = {
  promotion: Ticket,
  order: Package,
  system: Info,
}

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const [userNotifications, setUserNotifications] = useState<NotificationItem[]>([])
  const [globalNotifications, setGlobalNotifications] = useState<NotificationItem[]>([])
  const [readStates, setReadStates] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setUserNotifications([])
      setGlobalNotifications([])
      setReadStates({})
      setIsLoading(false)
      return
    }

    const userNotificationsRef = ref(rtdb, `notifications/personal/${user.uid}`)
    const globalNotificationsRef = ref(rtdb, "notifications/global")
    const readRef = ref(rtdb, `notifications/readStatus/${user.uid}`)

    const unsubUser = onValue(userNotificationsRef, (snapshot) => {
      const value = snapshot.val() || {}
      const items = Object.entries(value).map(([key, item]: [string, any]) => ({
        id: key,
        title: item.title,
        description: item.description,
        href: item.href || "#",
        type: item.type || "system",
        createdAt: item.createdAt || 0,
        time: item.createdAt ? formatDistanceToNow(item.createdAt, { addSuffix: true, locale: vi }) : (item.time || ""),
        read: item.read === true,
        source: "user" as const,
      }))
      items.sort((a, b) => b.createdAt - a.createdAt)
      setUserNotifications(items)
      setIsLoading(false)
    })

    const unsubGlobal = onValue(globalNotificationsRef, (snapshot) => {
      const value = snapshot.val() || {}
      const items = Object.entries(value).map(([key, item]: [string, any]) => ({
        id: key,
        title: item.title,
        description: item.description,
        href: item.href || "#",
        type: item.type || "system",
        createdAt: item.createdAt || 0,
        time: item.createdAt ? formatDistanceToNow(item.createdAt, { addSuffix: true, locale: vi }) : (item.time || item.subtitle || ""),
        read: false,
        source: "global" as const,
      }))
      items.sort((a, b) => b.createdAt - a.createdAt)
      setGlobalNotifications(items)
      setIsLoading(false)
    })

    const unsubRead = onValue(readRef, (snapshot) => {
      const value = snapshot.val() || {}
      const normalized: Record<string, boolean> = Object.entries(value).reduce((acc, [key, item]) => {
        acc[key] = typeof item === "object" ? (item as Record<string, any>).read === true : item === true
        return acc
      }, {} as Record<string, boolean>)
      setReadStates(normalized)
    })

    return () => {
      unsubUser()
      unsubGlobal()
      unsubRead()
    }
  }, [user])

  const notifications = [
    ...userNotifications,
    ...globalNotifications.map((notification) => ({
      ...notification,
      read: readStates[notification.id] === true,
    })),
  ].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Thông báo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        <div className="space-y-6 flex flex-col">
          {isLoading ? (
            <div className="rounded-2xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
              Hiện không có thông báo mới.
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = iconMap[notification.type] || Info
              return (
                <Link key={notification.id} href={`/notifications/${notification.id}?source=${notification.source || "global"}`}>
                  <Card className="flex items-start gap-4 border-border/50 p-4 transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">
                          {notification.title}
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.description}
                      </p>
                    </div>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}