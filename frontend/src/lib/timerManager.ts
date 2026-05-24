export interface Timer {
  id: string
  minutes: number
  remainingSeconds: number
  label: string
  startTime: number
  endTime: number
  active: boolean
  completed: boolean
}

export type TimerCallback = (timer: Timer) => void

export class TimerManager {
  private timers: Map<string, Timer> = new Map()
  private intervals: Map<string, number> = new Map()
  private onTick: TimerCallback | null = null
  private onComplete: TimerCallback | null = null

  setOnTick(callback: TimerCallback) {
    this.onTick = callback
  }

  setOnComplete(callback: TimerCallback) {
    this.onComplete = callback
  }

  setTimer(minutes: number, label: string): string {
    const id = crypto.randomUUID().slice(0, 8)
    const now = Date.now()
    const durationMs = minutes * 60 * 1000

    const timer: Timer = {
      id,
      minutes,
      remainingSeconds: minutes * 60,
      label,
      startTime: now,
      endTime: now + durationMs,
      active: true,
      completed: false,
    }

    this.timers.set(id, timer)

    const intervalId = window.setInterval(() => {
      const t = this.timers.get(id)
      if (!t || !t.active) {
        this.clearInterval(id)
        return
      }

      const remaining = Math.max(0, Math.round((t.endTime - Date.now()) / 1000))
      t.remainingSeconds = remaining

      if (remaining <= 0) {
        t.active = false
        t.completed = true
        this.clearInterval(id)
        this.notifyComplete(t)
        this.onComplete?.(t)
      } else {
        this.onTick?.(t)
      }
    }, 1000)

    this.intervals.set(id, intervalId)
    this.onTick?.(timer)

    // Request notification permission
    this.requestNotificationPermission()

    return id
  }

  cancelTimer(id: string): boolean {
    const timer = this.timers.get(id)
    if (!timer) return false
    timer.active = false
    this.clearInterval(id)
    this.onTick?.({ ...timer, active: false })
    return true
  }

  listTimers(): Timer[] {
    return Array.from(this.timers.values())
      .filter((t) => t.active)
      .sort((a, b) => a.endTime - b.endTime)
  }

  getAllTimers(): Timer[] {
    return Array.from(this.timers.values())
      .sort((a, b) => b.startTime - a.startTime)
  }

  private clearInterval(id: string) {
    const intervalId = this.intervals.get(id)
    if (intervalId !== undefined) {
      window.clearInterval(intervalId)
      this.intervals.delete(id)
    }
  }

  private notifyComplete(timer: Timer) {
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Timer Finalizado!", {
        body: `${timer.label} — ${timer.minutes} minutos acabaram!`,
        icon: "/favicon.ico",
      })
    }

    // In-app notification event
    window.dispatchEvent(new CustomEvent("timer-complete", {
      detail: { id: timer.id, label: timer.label, minutes: timer.minutes },
    }))
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") return false

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  clearAll() {
    this.intervals.forEach((id) => window.clearInterval(id))
    this.intervals.clear()
    this.timers.clear()
  }
}
