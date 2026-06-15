import { useEffect, useState } from 'react'

type BrandDisplaySize = 'default' | 'large'

const SIZE_STYLES: Record<
  BrandDisplaySize,
  { container: string; image: string; fallback: string }
> = {
  default: {
    container: 'h-11 max-w-[168px]',
    image: 'max-h-11',
    fallback: 'text-sm',
  },
  large: {
    container: 'h-16 max-w-[240px]',
    image: 'max-h-16',
    fallback: 'text-base',
  },
}

interface BrandDisplayProps {
  label: string
  logoUrl: string | null
  size?: BrandDisplaySize
}

export default function BrandDisplay({
  label,
  logoUrl,
  size = 'default',
}: BrandDisplayProps) {
  const [failed, setFailed] = useState(false)
  const styles = SIZE_STYLES[size]

  useEffect(() => {
    setFailed(false)
  }, [logoUrl])

  const showLogo = Boolean(logoUrl) && !failed

  if (showLogo) {
    return (
      <span className={`inline-flex items-center ${styles.container}`}>
        <img
          src={logoUrl!}
          alt={label}
          className={`${styles.image} w-auto max-w-full object-contain`}
          onError={() => setFailed(true)}
        />
      </span>
    )
  }

  return (
    <p className={`${styles.fallback} font-black text-slate-900 truncate`}>
      {label}
    </p>
  )
}
