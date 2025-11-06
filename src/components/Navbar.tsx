'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import Container from './ui/Container'
import Button from './ui/Button'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useUser()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/story', label: 'Create Story' },
    { href: '/history', label: 'History' },
    { href: '/pricing', label: 'Pricing' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 backdrop-blur-sm bg-white/90">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              5 Lines Story
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center space-x-4">
                    <Link href="/story">
                      <Button size="sm">Create Story</Button>
                    </Link>
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: 'w-10 h-10',
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link href="/sign-in">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button size="sm">Get Started</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </nav>
  )
}
