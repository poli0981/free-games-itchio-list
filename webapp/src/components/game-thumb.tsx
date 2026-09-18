import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { thumbUrl, type ThumbWidth } from '@/lib/thumbnail'
import { cn } from '@/lib/utils'

interface GameThumbProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'srcSet'> {
  src: string | undefined
  /** Rendered variant: 160 px for rows/cards, 640 px for the detail cover. */
  size?: ThumbWidth
}

/**
 * Game cover image that degrades to the muted placeholder when the URL is
 * empty/"N/A" or the image fails to load (itch.zone covers occasionally 404).
 * Failure is tracked per-src so recycled rows (sort/filter) recover.
 */
export function GameThumb({ src, size = 160, alt = '', className, ...rest }: GameThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || !/^https?:\/\//.test(src) || failedSrc === src) {
    return <div aria-hidden="true" className={cn('bg-thumb', className)} />
  }
  return (
    <img
      src={thumbUrl(src, size)}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      {...rest}
    />
  )
}
