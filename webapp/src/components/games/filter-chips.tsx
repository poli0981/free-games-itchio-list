import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, Eye, EyeOff, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fold, RATING_STEPS } from '@/lib/game-filters'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
  count: number
}

/** Options listed before the visitor types (tags alone have ~1,800 values). */
const MAX_LISTED = 100

function chipClass(active: boolean, className?: string): string {
  return cn(
    'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap md:h-8 md:pr-2.5 md:pl-3 md:text-[13px]',
    active
      ? 'border-primary bg-brand-soft text-foreground'
      : 'bg-card text-muted-foreground hover:text-foreground',
    className,
  )
}

function ChipPopover({
  label,
  name,
  active,
  children,
  wide,
}: {
  /** Chip text, e.g. "Genre · 2". */
  label: ReactNode
  /** Accessible name of the menu, e.g. "Genre". */
  name: string
  active: boolean
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger className={chipClass(active)}>
        {label}
        <ChevronDown className="size-3" strokeWidth={2.5} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={name} className={cn('p-0', wide ? 'w-72' : 'w-56')}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

/** A multi-select filter: chip + checklist with counts (and a finder for long lists). */
export function FilterMenu({
  label,
  selected,
  onChange,
  getOptions,
}: {
  label: string
  selected: string[]
  onChange: (values: string[]) => void
  /** Called when the menu opens, so counts are only computed for the open menu. */
  getOptions: () => FilterOption[]
}) {
  return (
    <ChipPopover
      label={selected.length ? `${label} · ${selected.length}` : label}
      name={label}
      active={selected.length > 0}
      wide
    >
      <FilterOptions label={label} selected={selected} onChange={onChange} getOptions={getOptions} />
    </ChipPopover>
  )
}

function FilterOptions({
  label,
  selected,
  onChange,
  getOptions,
}: {
  label: string
  selected: string[]
  onChange: (values: string[]) => void
  getOptions: () => FilterOption[]
}) {
  const t = useT()
  const fmt = useFormat()
  const [find, setFind] = useState('')
  const options = useMemo(() => getOptions(), [getOptions])

  const needle = fold(find.trim())
  const matching = needle ? options.filter((o) => fold(o.label).includes(needle)) : options
  const listed = matching.slice(0, MAX_LISTED)
  // A chosen value stays reachable even when it is past the cut-off.
  for (const o of matching.slice(MAX_LISTED)) if (selected.includes(o.value)) listed.push(o)
  const hidden = matching.length - listed.length

  const toggle = (value: string, on: boolean) =>
    onChange(on ? [...selected, value] : selected.filter((v) => v !== value))

  return (
    <div className="flex max-h-[min(26rem,var(--radix-popover-content-available-height))] flex-col">
      {options.length > 8 && (
        <div className="border-b p-2">
          <input
            type="search"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={t('common.search')}
            aria-label={`${t('common.search')}: ${label}`}
            className="h-8 w-full rounded-md border bg-background px-2.5 text-sm outline-hidden focus:border-primary"
          />
        </div>
      )}
      <div role="group" aria-label={label} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
        <ul>
          {listed.map((o) => (
            <li key={o.value}>
              <label className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm hover:bg-accent">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={(e) => toggle(o.value, e.target.checked)}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{fmt.number(o.count)}</span>
              </label>
            </li>
          ))}
          {listed.length === 0 && (
            <li className="px-2 py-3 text-sm text-muted-foreground">{t('games.filter.none')}</li>
          )}
          {hidden > 0 && (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              {t('games.filter.more', { n: fmt.number(hidden) })}
            </li>
          )}
        </ul>
      </div>
      {selected.length > 0 && (
        <div className="border-t p-1.5">
          <button
            type="button"
            onClick={() => onChange([])}
            className="h-8 w-full rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {t('games.filter.clear')}
          </button>
        </div>
      )}
    </div>
  )
}

/** Minimum rating: any, 4.5+, 4+, 3.5+, 3+. */
export function RatingMenu({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const t = useT()
  const fmt = useFormat()
  const label = t('games.filter.rating')
  return (
    <ChipPopover label={value === null ? label : `${label} · ${fmt.rating(value)}+`} name={label} active={value !== null}>
      <div role="radiogroup" aria-label={label} className="p-1">
        {[null, ...RATING_STEPS].map((step) => (
          <label
            key={step ?? 'any'}
            className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm hover:bg-accent"
          >
            <input
              type="radio"
              name="min-rating"
              checked={value === step}
              onChange={() => onChange(step)}
              className="size-4 shrink-0 accent-primary"
            />
            {step === null ? t('games.filter.ratingAny') : t('games.filter.ratingMin', { n: fmt.rating(step) })}
          </label>
        ))}
      </div>
    </ChipPopover>
  )
}

/** An on/off filter such as "Plays in browser". */
export function ToggleChip({ label, pressed, onChange }: { label: string; pressed: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={() => onChange(!pressed)} className={chipClass(pressed)}>
      {label}
    </button>
  )
}

/** Shows whether 18+ games are hidden; turning them on asks for the age confirmation. */
export function NsfwChip({ shown, onShow, onHide }: { shown: boolean; onShow: () => void; onHide: () => void }) {
  const t = useT()
  const Icon = shown ? Eye : EyeOff
  return (
    <button
      type="button"
      title={t(shown ? 'games.nsfw.hide' : 'games.nsfw.show')}
      onClick={shown ? onHide : onShow}
      className={cn(chipClass(false), 'border-dashed bg-transparent')}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {t(shown ? 'games.nsfw.shown' : 'games.nsfw.hidden')}
    </button>
  )
}

export interface ActivePill {
  key: string
  label: string
  onRemove: () => void
}

/** "Filters: Visual Novel ✕ · Rating ≥ 4.5 ✕ · Clear all". */
export function ActiveFilters({ pills, onClearAll }: { pills: ActivePill[]; onClearAll: () => void }) {
  const t = useT()
  if (pills.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
      <span>{t('games.active')}</span>
      {pills.map((p) => (
        <span key={p.key} className="flex items-center gap-1 rounded-full bg-brand-soft py-0.5 pr-1 pl-2.5 text-foreground">
          {p.label}
          <button
            type="button"
            onClick={p.onRemove}
            aria-label={t('games.pill.remove', { label: p.label })}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="ml-1 underline underline-offset-4 hover:text-foreground">
        {t('games.clearAll')}
      </button>
    </div>
  )
}
