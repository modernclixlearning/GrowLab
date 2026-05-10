/**
 * DayPicker — Mon–Sun bar with task-count badges.
 * Keyboard accessible: left/right arrows move the selection.
 */

import { useRef } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayPickerProps {
  /** ISO string of the start of the current week (Sunday) */
  weekStart: Date
  /** Currently selected date (the component compares by date, not time) */
  selectedDate: Date
  /** Count of tasks per day index (0=Sun … 6=Sat); missing = 0 */
  taskCounts?: Partial<Record<number, number>>
  onSelect: (date: Date) => void
}

export function DayPicker({ weekStart, selectedDate, taskCounts = {}, onSelect }: DayPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const selectedIndex = days.findIndex((d) => isSameDay(d, selectedDate))

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const direction = e.key === 'ArrowLeft' ? -1 : 1
      const next = (selectedIndex + direction + 7) % 7
      onSelect(days[next])
      // Focus the button for the newly selected day
      const buttons = containerRef.current?.querySelectorAll('button')
      buttons?.[next]?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Day picker"
      className="flex gap-1 rounded-xl bg-card-2 p-1"
      onKeyDown={handleKeyDown}
    >
      {days.map((day, i) => {
        const isSelected = isSameDay(day, selectedDate)
        const count = taskCounts[i] ?? 0
        const dayNum = day.getDate()
        return (
          <button
            key={i}
            type="button"
            aria-label={`${DAY_LABELS[i]} ${dayNum}${count > 0 ? `, ${count} task${count !== 1 ? 's' : ''}` : ''}`}
            aria-pressed={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(day)}
            className={[
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              isSelected
                ? 'bg-accent-soft text-accent'
                : 'text-fg-2 hover:bg-card-1 hover:text-fg-1',
            ].join(' ')}
          >
            <span className="text-[10px] uppercase tracking-wide">{DAY_LABELS[i]}</span>
            <span className="text-base font-semibold leading-none">{dayNum}</span>
            {count > 0 && (
              <span
                className={[
                  'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                  isSelected ? 'bg-accent text-bg' : 'bg-fg-2/20 text-fg-2',
                ].join(' ')}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
