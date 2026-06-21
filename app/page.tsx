"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/intro")
    }, 1500) // Giảm thời gian splash xuống còn 1.5s hoặc 1s

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Monaco Logo"
          width={240}
          height={120}
          className="h-auto object-contain"
          priority
        />
        <p className="mt-4 text-2xl font-bold tracking-[0.3em] text-[#D4AF37]">
          MONACO
        </p>
        <p className="text-sm tracking-[0.4em] text-[#D4AF37] mt-1">
          KARAOKE
        </p>
      </div>
    </main>
  )
}
