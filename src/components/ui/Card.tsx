import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const Card = ({
  children,
  className,
  hover = false,
  padding = 'md',
}: CardProps) => {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'card',
        paddings[padding],
        hover && 'hover:shadow-xl hover:scale-[1.02] cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
