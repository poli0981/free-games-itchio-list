import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface GameThumbProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  src: string | undefined
}

/**
 * Game cover image that degrades to the muted placeholder when the URL is
 * empty or the image fails to load (itch.zone covers occasionally 404).
 * Failure is tracked per-src so recycled rows (sort/filter) recover.
 */
export function GameThumb({ src, alt = '', className, ...rest }: GameThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) {
    return <div aria-hidden="true" className={cn('bg-muted', className)} />
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
      {...rest}
    />
  )
}
