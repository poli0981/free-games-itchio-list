import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react'
import { isTauri } from '@/lib/runtime'
import { openExternal } from '@/lib/external-link'

export interface ExtLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> {
  href: string
}

export const ExtLink = forwardRef<HTMLAnchorElement, ExtLinkProps>(
  ({ href, onClick, children, ...rest }, ref) => {
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
    return (
      <a
        ref={ref}
        href={href}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </a>
    )
  },
)
ExtLink.displayName = 'ExtLink'
