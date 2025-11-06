import Link from 'next/link'
import Container from './ui/Container'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
                5 Lines Story
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                Transform your ideas into compelling narratives with AI-powered
                storytelling. The 5-line methodology makes every story clear,
                impactful, and memorable.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/story"
                    className="text-slate-600 hover:text-primary-600 transition-colors text-sm"
                  >
                    Create Story
                  </Link>
                </li>
                <li>
                  <Link
                    href="/history"
                    className="text-slate-600 hover:text-primary-600 transition-colors text-sm"
                  >
                    History
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-slate-600 hover:text-primary-600 transition-colors text-sm"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://laltopialinestories.userjot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-primary-600 transition-colors text-sm"
                  >
                    Feedback
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              © {currentYear} 5 Lines Story. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
