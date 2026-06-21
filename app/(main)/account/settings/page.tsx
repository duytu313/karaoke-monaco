"use client"

import { useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { ArrowLeft, Globe, Moon, Shield, Bell, HelpCircle, FileText, ChevronRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"

const languageNames: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  cn: "简体中文",
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  const currentLang = "vi"

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Cài đặt</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-[1cm] mt-4">
        <section className="space-y-[1cm]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Giao diện & Ngôn ngữ</p>
          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 h-20 bg-card">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Moon className="h-7 w-7" />
                </div>
                <span className="font-bold text-lg text-foreground">Chế độ tối</span>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
            </div>
            <Link href="/account/settings/language" className="flex items-center gap-4 px-4 h-20 bg-card active:bg-muted/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Globe className="h-7 w-7" />
              </div>
              <span className="flex-1 font-bold text-lg text-foreground">Ngôn ngữ</span>
              <span className="text-base text-muted-foreground">{languageNames[currentLang]}</span>
              <ChevronRight className="h-6 w-6 text-muted-foreground/30" />
            </Link>
          </Card>
        </section>

        <section className="space-y-[1cm]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Bảo mật</p>
          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            <Link href="/account/settings/change-password" title="Đổi mật khẩu" className="flex items-center gap-4 px-4 h-20 bg-card active:bg-muted/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock className="h-7 w-7" />
              </div>
              <span className="flex-1 font-bold text-lg text-foreground">Đổi mật khẩu</span>
              <ChevronRight className="h-6 w-6 text-muted-foreground/30" />
            </Link>
            <Link href="/account/settings/privacy" className="flex items-center gap-4 px-4 h-20 bg-card active:bg-muted/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="h-7 w-7" />
              </div>
              <span className="flex-1 font-bold text-lg text-foreground">Quyền riêng tư</span>
              <ChevronRight className="h-6 w-6 text-muted-foreground/30" />
            </Link>
          </Card>
        </section>

        <section className="space-y-[1cm] pb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Thông tin ứng dụng</p>
          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            <Link href="/account/settings/help" className="flex items-center gap-4 px-4 h-20 bg-card active:bg-muted/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HelpCircle className="h-7 w-7" />
              </div>
              <span className="flex-1 font-bold text-lg text-foreground">Hỗ trợ</span>
              <ChevronRight className="h-6 w-6 text-muted-foreground/30" />
            </Link>
            <Link href="/account/settings/terms" className="flex items-center gap-4 px-4 h-20 bg-card active:bg-muted/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-7 w-7" />
              </div>
              <span className="flex-1 font-bold text-lg text-foreground">Điều khoản sử dụng</span>
              <ChevronRight className="h-6 w-6 text-muted-foreground/30" />
            </Link>
          </Card>
        </section>
      </main>
    </div>
  )
}