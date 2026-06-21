"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { auth, rtdb } from "@/lib/firebase"
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth"
import { ref, runTransaction, set } from "firebase/database"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }

    // Chuyển khoảng trắng thành gạch dưới để an toàn khi dùng làm Key trong Database
    // Chuẩn hóa tên: viết thường, thay khoảng trắng bằng gạch dưới
    const username = formData.username.trim().toLowerCase().replace(/\s+/g, '_')
    if (!username) {
      setError("Vui lòng nhập tên đăng nhập.")
      return
    }

    const invalidUsername = /[.$#\[\]\/]/.test(username) || username.includes("__");
    if (invalidUsername || username.length < 2) {
      setError("Tên (ID) không được chứa các ký tự đặc biệt . $ # [ ] /");
      return
    }

    setIsLoading(true)
    let createdUser: any = null;

    try {
      const usernamePath = `users/profiles/${username}`

      // 1. Tạo tài khoản trong Firebase Auth (Sau lệnh này user sẽ được tự động đăng nhập)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      createdUser = userCredential.user

      // 2. Sử dụng Transaction để đảm bảo tính an toàn tuyệt đối
      // (Không cần get() kiểm tra trùng trước vì không thể đọc node của user khác do rules,
      // transaction đã tự xử lý việc kiểm tra tồn tại)
      const transactionResult = await runTransaction(ref(rtdb, usernamePath), (current) => {
        if (current !== null) return; // Nếu đã tồn tại dữ liệu tại key này, hủy transaction
        return {
          authUid: createdUser.uid,
          username,
          name: formData.name,
          phoneNumber: formData.phone,
          email: formData.email,
          points: 0,
          password: formData.password,
          role: "customer",
          createdAt: Date.now(),
        }
      })

      if (!transactionResult.committed) {
        throw new Error("username-taken")
      }

      await set(ref(rtdb, `users/uidMap/${createdUser.uid}`), username)

      router.push("/home")
    } catch (err: any) {
      // QUAN TRỌNG: Nếu đã tạo Auth thành công nhưng lưu DB thất bại, phải xóa Auth đi
      if (createdUser && err.code !== "auth/email-already-in-use") {
        try { await deleteUser(createdUser); } 
        catch (deleteErr) { console.error("Cleanup failed:", deleteErr); }
      }

      const isKnownError = [
        "auth/email-already-in-use",
        "auth/username-already-in-use",
        "auth/configuration-not-found",
        "permission_denied"
      ].includes(err.code) || (err.message && err.message.includes("permission_denied"));

      // Chỉ log lỗi nếu là lỗi không lường trước được
      if (!isKnownError) {
        console.error("Registration Error Detail:", err);
      }

      if (err.code === "auth/username-already-in-use" || (err.message && err.message.includes("permission_denied"))) {
        setError("Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác.")
      } else {
        switch (err.code) {
        case "auth/email-already-in-use":
          setError("Email này đã được sử dụng cho một tài khoản khác.")
          break
        case "auth/configuration-not-found":
          setError("Hệ thống chưa cấu hình phương thức đăng ký Email. Vui lòng liên hệ Admin.")
          break
        default:
          setError(err.message || "Đã xảy ra lỗi khi đăng ký.")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="pt-6 px-6">
        <Link
          href="/login"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm">Quay lại đăng nhập</span>
        </Link>
      </header>

      <div className="pt-8 pb-8 px-6">
        <h1 className="text-4xl font-bold text-center text-foreground">Đăng ký tài khoản</h1>
        <p className="text-lg text-muted-foreground text-center mt-2">
          Tạo tài khoản để nhận nhiều ưu đãi hấp dẫn từ Monaco
        </p>
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
              Họ và tên
            </label>
            <Input
              type="text"
              placeholder="Nhập họ và tên của bạn"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 rounded-lg border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Tên đăng nhập
            </label>
            <Input
              type="text"
              placeholder="Tên tài khoản duy nhất"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="h-12 rounded-lg border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Số điện thoại
            </label>
            <Input
              type="tel"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-12 rounded-lg border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              placeholder="Nhập email"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-12 rounded-lg border-border/50 bg-muted/50 pr-12 text-foreground placeholder:text-muted-foreground"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-16 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl mt-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}