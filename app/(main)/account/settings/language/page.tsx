"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { rtdb } from "@/lib/firebase"
import { ref, update } from "firebase/database"

const languages = [
  { id: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "cn", name: "简体中文", flag: "🇨🇳" },
]

export default function LanguagePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedLanguage, setSelectedLanguage] = useState("vi")
  const [isSaving, setIsSaving] = useState(false)

  // Language is no longer stored per-user. Default to 'vi' and allow changing app default.

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // store app-wide default language under settings/defaultLanguage
      const settingsRef = ref(rtdb, `settings`)
      await update(settingsRef, {
        defaultLanguage: selectedLanguage,
      })
      router.push("/account/settings")
    } catch (error) {
      console.error("Error saving language:", error)
      alert("Không thể lưu ngôn ngữ. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Ngôn ngữ</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <section className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Chọn ngôn ngữ hiển thị</p>
          <Card className="divide-y divide-border/30 border-border/50 overflow-hidden shadow-sm">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className="w-full flex items-center gap-4 px-4 h-14 bg-card active:bg-muted/50 transition-all text-left"
              >
                <span className="text-xl">{lang.flag}</span>
                <span className={cn(
                  "flex-1 font-bold text-base transition-colors",
                  selectedLanguage === lang.id ? "text-primary" : "text-foreground"
                )}>
                  {lang.name}
                </span>
                {selectedLanguage === lang.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </Card>
        </section>

        <p className="text-xs text-muted-foreground px-1 leading-relaxed italic">
          Lưu ý: Thay đổi ngôn ngữ sẽ được áp dụng ngay lập tức cho toàn bộ giao diện người dùng. Các thông báo đẩy cũng sẽ sử dụng ngôn ngữ này.
        </p>
      </main>

      {/* Bottom Action */}
      <div className="sticky bottom-0 z-40 p-4 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-lg"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  )
}