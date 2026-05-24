import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Props {
  to: string
  variant?: 'primary' | 'secondary'
  children: ReactNode
  icon?: ReactNode
}

export default function CTAButton({ to, variant = 'primary', children, icon }: Props) {
  const styles = variant === 'primary'
    ? 'bg-primary hover:bg-primary-hover text-white shadow-card hover:shadow-card-hover'
    : 'bg-surface border-2 border-secondary text-secondary hover:bg-secondary hover:text-white'

  return (
    <Link
      to={to}
      className={`${styles} px-6 sm:px-8 py-4 rounded-card font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 min-w-[180px]`}
    >
      {icon}
      {children}
    </Link>
  )
}
