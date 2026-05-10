/**
 * Schedule Page — F3
 *
 * Week navigator + DayPicker + grouped TaskRow list.
 * Fetches scheduled care logs for the selected week window and lets
 * the user complete tasks inline.
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { DayPicker, TaskRow } from '@/components/schedule'
import { useScheduledCareLogs, useCompleteCareLog } from '@/lib/hooks/useCareLogs'
import { usePlants } from '@/lib/hooks/usePlants'
import type { CareLog } from '@/types/care-logs'

/** Returns the Sunday that starts the week containing `date` (Sun-based weeks, not ISO). */
function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // subtract day-of-week (0=Sun)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

export default function SchedulePage() {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [selectedDate, setSelectedDate] = useState<Date>(today)

  // Fetch the full week so DayPicker can show counts
  const weekEnd = addDays(weekStart, 6)
  const { data: weekData, isLoading } = useScheduledCareLogs({
    scheduledFrom: weekStart.toISOString(),
    scheduledTo: endOfDay(weekEnd).toISOString(),
  })

  // Fetch plants for name lookup
  const { data: plantsData } = usePlants()
  const plantMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of plantsData?.plants ?? []) {
      map[p.id] = p.name
    }
    return map
  }, [plantsData])

  const { mutate: complete, isPending: isCompleting } = useCompleteCareLog()

  // Group all week logs by day-of-week index (0=Sun…6=Sat)
  const countsByDay = useMemo(() => {
    const counts: Partial<Record<number, number>> = {}
    for (const log of weekData?.careLogs ?? []) {
      if (!log.scheduledAt) continue
      const d = new Date(log.scheduledAt)
      const i = d.getDay()
      counts[i] = (counts[i] ?? 0) + 1
    }
    return counts
  }, [weekData])

  // Tasks for the selected day
  const dayTasks = useMemo<CareLog[]>(() => {
    return (weekData?.careLogs ?? []).filter((log) => {
      if (!log.scheduledAt) return false
      return isSameDay(new Date(log.scheduledAt), selectedDate)
    })
  }, [weekData, selectedDate])

  function prevWeek() {
    const newStart = addDays(weekStart, -7)
    setWeekStart(newStart)
    setSelectedDate(addDays(selectedDate, -7))
  }

  function nextWeek() {
    const newStart = addDays(weekStart, 7)
    setWeekStart(newStart)
    setSelectedDate(addDays(selectedDate, 7))
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg-1">Schedule</h1>
        <p className="mt-0.5 text-sm text-fg-2">{formatHeaderDate(selectedDate)}</p>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevWeek}
          aria-label="Previous week"
          className="rounded-lg border border-border bg-card-2 p-2 text-fg-2 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-fg-2">{formatWeekRange(weekStart)}</span>
        <button
          type="button"
          onClick={nextWeek}
          aria-label="Next week"
          className="rounded-lg border border-border bg-card-2 p-2 text-fg-2 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day picker */}
      <DayPicker
        weekStart={weekStart}
        selectedDate={selectedDate}
        taskCounts={countsByDay}
        onSelect={setSelectedDate}
      />

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card-2" />
          ))
        ) : dayTasks.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card-2/50 px-6 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-fg-2/40" />
            <p className="text-sm font-medium text-fg-2">No tasks scheduled for this day</p>
            <p className="text-xs text-fg-2/60">
              Add a care log with a scheduled date to see it here.
            </p>
          </div>
        ) : (
          dayTasks.map((log) => (
            <TaskRow
              key={log.id}
              careLog={log}
              plantName={plantMap[log.plantId] ?? 'Unknown plant'}
              onComplete={log.completedAt ? undefined : (id) => complete(id)}
              isCompleting={isCompleting}
            />
          ))
        )}
      </div>
    </div>
  )
}
