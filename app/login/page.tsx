"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { auth, rtdb } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { ref, get } from "firebase/database"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      let loginEmail = formData.email.trim()

      // Nếu người dùng không nhập email (không có ký tự @), 
      // ta hiểu đó là "Tên" và đi tìm email tương ứng trong Database
      if (!loginEmail.includes("@")) {
        // Chuẩn hóa Key: viết thường và thay khoảng trắng bằng _
        const searchKey = loginEmail.trim().toLowerCase().replace(/\s+/g, '_')
        const userRef = ref(rtdb, `users/profiles/${searchKey}`)
        const snapshot = await get(userRef)
        
        if (snapshot.exists() && snapshot.val().email) {
          loginEmail = snapshot.val().email
        } else {
          setError("Tên đăng nhập không tồn tại.")
          setIsLoading(false)
          return
        }
      }

      // Xóa lỗi và giữ trạng thái loading trước khi thực hiện đăng nhập
      setError("")
      await signInWithEmailAndPassword(auth, loginEmail, formData.password)
      
      // Nếu thành công, xóa lỗi một lần nữa cho chắc chắn trước khi chuyển trang
      setError("")
      router.push("/home")
    } catch (err: any) {
      // Chỉ log lỗi nếu không phải là lỗi sai thông tin đăng nhập thông thường
      // Điều này giúp Console của bạn không bị hiện đỏ khi người dùng gõ sai pass
      if (err.code !== "auth/invalid-credential" && err.code !== "auth/wrong-password" && err.code !== "auth/user-not-found") {
        console.error("Login Error:", err)
      }

      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.")
      } else {
        setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      {/* Header */}
      <header className="pt-6 px-6">
        <Link
          href="/intro"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm">Quay lại giới thiệu</span>
        </Link>
      </header>

      <div className="pt-8 pb-8 px-6">
        <h1 className="text-2xl font-bold text-center text-foreground">Đăng nhập</h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-xs font-medium text-red-500 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Tên đăng nhập / Email
            </label>
            <Input
              type="text"
              placeholder="Nhập tên đăng nhập hoặc email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 rounded-lg border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 rounded-lg border-border/50 bg-muted/50 pr-12 text-foreground placeholder:text-muted-foreground"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </form>
        {/* Register Link */}
        <div className="text-center pb-8">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
