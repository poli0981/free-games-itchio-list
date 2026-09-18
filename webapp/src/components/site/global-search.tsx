import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { useVisibleGames } from '@/hooks/useGames'
import { fold } from '@/lib/game-filters'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { cn, slugify } from '@/lib/utils'

const MAX_SUGGESTIONS = 6

/** "/" focuses the search box unless the visitor is already typing somewhere. */
function useSlashShortcut(target: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      e.preventDefault()
      target.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target])
}

/**
 * Header search: suggests matching games while typing (Enter or click opens
 * one); Enter without a pick shows all results on the Games page.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const t = useT()
  const fmt = useFormat()
  const navigate = useNavigate()
  const games = useVisibleGames()
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  useSlashShortcut(input)

  const suggestions = useMemo(() => {
    const needle = fold(value.trim())
    if (!needle || !games.data) return []
    const out = []
    for (const game of games.data.games) {
      if (fold(game.name).includes(needle) || fold(game.dev).includes(needle)) out.push(game)
      if (out.length === MAX_SUGGESTIONS) break
    }
    return out
  }, [value, games.data])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }
  const goToResults = () => {
    const q = value.trim()
    navigate(q ? `/games?q=${encodeURIComponent(q)}` : '/games')
    close()
    input.current?.blur()
  }
  const goToGame = (url: string) => {
    navigate(`/games/${slugify(url)}`)
    setValue('')
    close()
    input.current?.blur()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter / arrows that finish an IME composition (e.g. Vietnamese Telex) aren't commands.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && suggestions[active]) goToGame(suggestions[active].url)
      else goToResults()
    } else if (e.key === 'Escape') {
      if (value) setValue('')
      close()
    }
  }

  // The catalog size, as on the Welcome page (18+ games count even while hidden).
  const total = games.data ? games.data.games.length + games.hiddenNsfw : undefined
  const showList = open && value.trim().length > 0

  return (
    <div className={cn('relative', className)}>
      <label className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-muted-foreground focus-within:border-primary">
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-label={t('header.search.label')}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          value={value}
          placeholder={total ? t('header.search.placeholder', { n: fmt.number(total) }) : t('header.search.label')}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(close, 120)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="rounded border px-1.5 font-mono text-[11px]" aria-hidden="true">
          /
        </kbd>
      </label>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('header.search.label')}
          className="absolute inset-x-0 top-11 z-50 overflow-hidden rounded-lg border bg-popover py-1 text-sm shadow-lg"
        >
          {suggestions.map((game, i) => (
            <li
              key={game.url}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goToGame(game.url)}
              className={cn('flex cursor-pointer flex-col px-3 py-2', i === active && 'bg-accent')}
            >
              <span className="truncate font-medium">{game.name}</span>
              <span className="truncate text-xs text-muted-foreground">{game.dev}</span>
            </li>
          ))}
          <li
            role="option"
            aria-selected={false}
            onMouseDown={(e) => e.preventDefault()}
            onClick={goToResults}
            className="cursor-pointer border-t px-3 py-2 text-muted-foreground hover:bg-accent"
          >
            {suggestions.length
              ? t('header.search.all', { q: value.trim() })
              : t('header.search.none', { q: value.trim() })}
          </li>
        </ul>
      )}
    </div>
  )
}
