'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export function UserJotWidget() {
  useEffect(() => {
    // Initialize UserJot if not already done
    if (typeof window !== 'undefined' && !(window as any).UserJot) {
      ;(window as any).UserJot = {
        config: {
          projectId: 'laltopialinestories',
        },
      }
    }
  }, [])

  return (
    <>
      <Script
        src="https://cdn.userjot.com/widget.js"
        strategy="lazyOnload"
        data-project="laltopialinestories"
      />
    </>
  )
}
