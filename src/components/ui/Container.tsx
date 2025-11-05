import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const Container = ({ children, className, size = 'lg' }: ContainerProps) => {
  const sizes = {
    sm: 'max-w-4xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  )
}

export default Container
