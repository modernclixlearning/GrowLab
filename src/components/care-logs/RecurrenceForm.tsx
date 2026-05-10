/**
 * RecurrenceForm — inline recurrence rule editor for AddCareLogModal.
 *
 * **Basic mode** (stageMode === 'basic'):
 *   3 radio buttons: One-time | Daily | Weekly
 *
 * **Expert mode** (stageMode === 'expert' or unknown):
 *   Full form: frequency radios + interval input + byWeekday checkboxes
 *   (weekly only) + until date picker + count integer input.
 *
 * The component is purely controlled — `value` + `onChange`.
 * When "One-time" is selected, `onChange(null)` is called.
 */

import type { RecurrenceRule } from '@/lib/recurrence'
import { useAuth } from '@/lib/stores/auth'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface RecurrenceFormProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
}

function defaultRule(frequency: 'daily' | 'weekly'): RecurrenceRule {
  return { frequency, interval: 1 }
}

export function RecurrenceForm({ value, onChange }: RecurrenceFormProps) {
  const { user } = useAuth()
  const isExpert = !user || user.stageMode !== 'basic'

  const mode: 'onetime' | 'daily' | 'weekly' = !value
    ? 'onetime'
    : value.frequency === 'daily'
      ? 'daily'
      : 'weekly'

  function handleModeChange(m: 'onetime' | 'daily' | 'weekly') {
    if (m === 'onetime') {
      onChange(null)
    } else {
      onChange(defaultRule(m))
    }
  }

  function update(patch: Partial<RecurrenceRule>) {
    if (!value) return
    onChange({ ...value, ...patch })
  }

  function toggleWeekday(day: number) {
    if (!value) return
    const current = value.byWeekday ?? []
    const has = current.includes(day)
    const next = has ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b)
    onChange({ ...value, byWeekday: next.length > 0 ? next : undefined })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-2">Recurrence</p>

      {/* Mode radio group */}
      <div
        role="radiogroup"
        aria-label="Recurrence frequency"
        className="grid grid-cols-3 gap-1 rounded-xl bg-card-2 p-1"
      >
        {(['onetime', 'daily', 'weekly'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => handleModeChange(m)}
            className={[
              'rounded-lg py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent capitalize',
              mode === m
                ? 'bg-accent-soft text-accent'
                : 'text-fg-2 hover:bg-card-1 hover:text-fg-1',
            ].join(' ')}
          >
            {m === 'onetime' ? 'One-time' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Expert controls — only when a recurrence is selected */}
      {isExpert && value && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card-2/50 p-3">
          {/* Interval */}
          <div className="flex items-center justify-between">
            <label htmlFor="rr-interval" className="text-xs text-fg-2">
              Repeat every
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="rr-interval"
                type="number"
                min={1}
                max={365}
                value={value.interval}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!Number.isNaN(v) && v >= 1) update({ interval: v })
                }}
                className="w-16 rounded-lg border border-border bg-card-1 px-2 py-1 text-right text-sm text-fg-1 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <span className="text-xs text-fg-2">
                {value.frequency === 'daily' ? `day${value.interval !== 1 ? 's' : ''}` : `week${value.interval !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* byWeekday (weekly only) */}
          {value.frequency === 'weekly' && (
            <div>
              <p className="mb-1.5 text-xs text-fg-2">On days</p>
              <div role="group" aria-label="Days of week" className="flex gap-1">
                {WEEKDAY_LABELS.map((label, i) => {
                  const checked = value.byWeekday?.includes(i) ?? false
                  return (
                    <button
                      key={i}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleWeekday(i)}
                      className={[
                        'flex h-8 w-8 flex-1 items-center justify-center rounded-lg text-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        checked
                          ? 'bg-accent text-bg'
                          : 'border border-border bg-card-1 text-fg-2 hover:border-accent hover:text-accent',
                      ].join(' ')}
                    >
                      {label[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Until */}
          <div className="flex items-center justify-between">
            <label htmlFor="rr-until" className="text-xs text-fg-2">
              End date (optional)
            </label>
            <input
              id="rr-until"
              type="date"
              value={value.until ? value.until.split('T')[0] : ''}
              onChange={(e) => {
                const v = e.target.value
                update({ until: v ? `${v}T00:00:00.000Z` : undefined })
              }}
              className="rounded-lg border border-border bg-card-1 px-2 py-1 text-xs text-fg-1 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {/* Count */}
          <div className="flex items-center justify-between">
            <label htmlFor="rr-count" className="text-xs text-fg-2">
              Max occurrences (optional)
            </label>
            <input
              id="rr-count"
              type="number"
              min={1}
              placeholder="∞"
              value={value.count ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                update({ count: v !== undefined && !Number.isNaN(v) ? v : undefined })
              }}
              className="w-20 rounded-lg border border-border bg-card-1 px-2 py-1 text-right text-sm text-fg-1 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        </div>
      )}
    </div>
  )
}
