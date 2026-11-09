import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react'
import { useT } from '@/lib/i18n'
import { isTauri } from '@/lib/runtime'
import { openExternal } from '@/lib/external-link'

export interface ExtLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> {
  href: string
}

/**
 * A link that leaves the app: a new tab on the website, the system browser in
 * the apps. Screen readers hear where it opens (a hidden hint after the text,
 * or appended to an aria-label), since the visible arrow isn't always there.
 */
export const ExtLink = forwardRef<HTMLAnchorElement, ExtLinkProps>(
  ({ href, onClick, children, 'aria-label': ariaLabel, ...rest }, ref) => {
    const t = useT()
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented) return
      if (!isTauri()) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      void openExternal(href)
    }
    // mailto: hands off to the mail client; a new tab would just stay blank.
    const newTab = !href.startsWith('mailto:')
    const hint = newTab ? t(isTauri() ? 'common.opensBrowser' : 'common.newTab') : null
    return (
      <a
        ref={ref}
        href={href}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        aria-label={ariaLabel && hint ? `${ariaLabel} ${hint}` : ariaLabel}
        {...rest}
      >
        {children}
        {hint && !ariaLabel && <span className="sr-only"> {hint}</span>}
      </a>
    )
  },
)
ExtLink.displayName = 'ExtLink'
