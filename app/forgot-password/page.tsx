"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle forgot password logic here
    console.log("Forgot password:", email)
    setIsSubmitted(true)
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background flex flex-col border-x border-border/10">
      {/* Header */}
      <header className="pt-6 px-6">
        <Link
          href="/login"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Quay lại</span>
        </Link>
      </header>

      <div className="pt-8 pb-8 px-6">
        <h1 className="text-2xl font-bold text-center text-foreground">Quên mật khẩu</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        {!isSubmitted ? (
          <>
            <p className="text-muted-foreground text-sm text-center mb-8">
              Nhập email hoặc số điện thoại đã đăng ký để nhận hướng dẫn đặt lại mật khẩu
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email / Số điện thoại
                </label>
                <Input
                  type="text"
                  placeholder="Nhập email hoặc số điện thoại"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
              >
                Gửi yêu cầu
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 mt-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Yêu cầu đã được gửi!
              </h2>
              <p className="text-sm text-muted-foreground">
                Vui lòng kiểm tra email hoặc tin nhắn điện thoại để nhận hướng dẫn đặt lại mật khẩu.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full h-12 border-border/50 text-foreground font-medium rounded-lg"
            >
              <Link href="/login">Quay về đăng nhập</Link>
            </Button>
          </div>
        )}

        {/* Help text */}
        {!isSubmitted && (
          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground">
              Cần hỗ trợ?{" "}
              <a href="tel:1900xxxx" className="text-primary font-medium hover:underline">
                Liên hệ hotline
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
