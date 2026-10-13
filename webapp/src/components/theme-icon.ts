import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import type { Theme } from '@/stores/theme'

/** One icon per theme choice: the display menu's button, the Settings row and the admin's toggle. */
export const THEME_ICON: Record<Theme, LucideIcon> = { light: Sun, dark: Moon, system: Monitor }
