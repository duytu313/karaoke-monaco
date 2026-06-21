"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Sparkles, Check, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface TaskItem {
  id: string
  title: string
  description: string
  icon: string
  points: number
  status: "pending" | "completed" | "claimed"
  current?: number
  target?: number
}

interface TaskResult {
  id: string
  title: string
  points: number
  status: string
}

export default function WalletTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [newCompletions, setNewCompletions] = useState<TaskResult[]>([])
  const [showResult, setShowResult] = useState(false)
  const [stats, setStats] = useState<{ totalBookings: number; totalSpent: number } | null>(null)

  const loadTasks = async (showLoading = true) => {
    if (!user?.uid) {
      setTasks([])
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)

    try {
      const res = await fetch("/api/tasks/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      })

      const data = await res.json()
      if (res.ok) {
        setTasks(data.results || [])
        setStats(data.stats)
        if (data.newPoints > 0) {
          setNewCompletions(data.results.filter((r: any) => r.status === "completed"))
          setShowResult(true)
        }
      }
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [user])

  const getProgress = (task: TaskItem): number => {
    if (task.status === "claimed") return 100
    if (!task.target || !task.current) return 0
    return Math.min(100, Math.round((task.current / task.target) * 100))
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-emerald-500"
    if (progress >= 50) return "bg-primary"
    return "bg-amber-500"
  }

  const getProgressText = (task: TaskItem): string => {
    if (task.status === "claimed") return "Đã nhận thưởng"
    if (task.current !== undefined && task.target !== undefined) {
      return `${task.current}/${task.target}`
    }
    return task.status === "completed" ? "Đủ điều kiện!" : "Chưa đạt"
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ"
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/wallet">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-accent/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Nhiệm vụ</h1>
            <p className="text-sm text-muted-foreground">Hoàn thành nhiệm vụ để nhận thêm điểm.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-[1cm] pb-24">
        {/* Thống kê nhanh */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 border-border/50 bg-card text-center">
              <p className="text-xs text-muted-foreground font-medium">Tổng đơn đã đặt</p>
              <p className="text-2xl font-black text-foreground mt-1">{stats.totalBookings}</p>
            </Card>
            <Card className="p-4 border-border/50 bg-card text-center">
              <p className="text-xs text-muted-foreground font-medium">Tổng chi tiêu</p>
              <p className="text-2xl font-black text-foreground mt-1">{formatPrice(stats.totalSpent)}</p>
            </Card>
          </div>
        )}

        {/* Nút kiểm tra */}
        <Button
          variant="outline"
          className="w-full rounded-2xl border-primary/30 gap-2"
          onClick={() => {
            setChecking(true)
            loadTasks(false)
          }}
          disabled={checking}
        >
          {checking ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra...</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> Kiểm tra nhiệm vụ</>
          )}
        </Button>

        {/* Danh sách nhiệm vụ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Danh sách nhiệm vụ</h2>
          </div>

          {loading ? (
            <div className="space-y-[1cm]">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 border-border/50 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-2 bg-muted rounded w-full" />
                </Card>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground italic border-dashed">
              {user ? "Đang tải nhiệm vụ..." : "Đăng nhập để xem nhiệm vụ"}
            </Card>
          ) : (
            <div className="space-y-[1cm]">
              {tasks.map((task) => {
                const progress = getProgress(task)
                const isComplete = progress >= 100 && task.status !== "claimed"

                return (
                  <Card key={task.id} className={cn(
                    "p-4 border-2 transition-all",
                    task.status === "claimed" ? "border-gray-200 bg-gray-50" :
                    isComplete ? "border-emerald-300 bg-emerald-50/50" : "border-border/50"
                  )}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{task.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={cn(
                            "font-bold text-sm",
                            task.status === "claimed" ? "text-gray-500" : "text-foreground"
                          )}>
                            {task.title}
                          </h3>
                          <span className="text-xs font-bold text-primary shrink-0">+{task.points}đ</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>

                        {/* Thanh tiến độ */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "text-[10px] font-bold",
                              task.status === "claimed" ? "text-gray-500" :
                              isComplete ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                              {getProgressText(task)}
                            </span>
                            {!task.id.includes("booking") && !task.id.includes("spend") ? null : (
                              <span className="text-[10px] text-muted-foreground">{progress}%</span>
                            )}
                          </div>
                          {task.current !== undefined && task.target !== undefined && (
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", getProgressColor(progress))}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Trạng thái */}
                        {isComplete && (
                          <div className="mt-2 flex items-center gap-1 text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">Đủ điều kiện nhận thưởng!</span>
                          </div>
                        )}
                        {task.status === "claimed" && (
                          <div className="mt-2 flex items-center gap-1 text-gray-500">
                            <Check className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">Đã nhận thưởng</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {!user && (
          <Card className="p-4 text-center text-sm text-muted-foreground border-dashed">
            <Link href="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link> để xem nhiệm vụ
          </Card>
        )}
      </main>

      {/* Modal kết quả */}
      {showResult && newCompletions.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="w-full max-w-sm p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                <Sparkles className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">🎉 Hoàn thành nhiệm vụ!</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn đã hoàn thành các nhiệm vụ sau:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {newCompletions.map((r, i) => (
                <div key={i} className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-800">{r.title}</p>
                    <p className="text-xs text-emerald-600">Nhận +{r.points} điểm</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full font-bold"
              onClick={() => setShowResult(false)}
            >
              Tuyệt vời!
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}