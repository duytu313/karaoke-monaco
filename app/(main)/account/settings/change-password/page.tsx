"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react"
import { auth } from "@/lib/firebase"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!auth.currentUser || !auth.currentUser.email) {
      setError("Vui lòng đăng nhập để đổi mật khẩu.")
      return
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Vui lòng điền đầy đủ thông tin.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp.")
      return
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }

    setIsSaving(true)

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      setMessage("Đổi mật khẩu thành công.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      console.error(err)
      if (err?.code === "auth/wrong-password") {
        setError("Mật khẩu hiện tại không đúng.")
      } else if (err?.code === "auth/requires-recent-login") {
        setError("Vui lòng đăng nhập lại và thử lại.")
      } else {
        setError("Không thể đổi mật khẩu. Vui lòng thử lại.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/account/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Đổi mật khẩu</h1>
            <p className="text-sm text-muted-foreground">Cập nhật mật khẩu tài khoản của bạn.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 mt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Card className="p-4 border-border/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Mật khẩu hiện tại</label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Mật khẩu mới</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Xác nhận mật khẩu</label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </Card>

          {error ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
          ) : null}

          <Button type="submit" className="w-full h-12" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu mật khẩu"}
          </Button>
        </form>
      </main>
    </div>
  )
}
