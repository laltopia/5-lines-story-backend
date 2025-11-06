import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for trying out 5 Lines Story',
      features: [
        '10 stories per month',
        'Basic AI suggestions',
        'Story history',
        'Multi-language support',
      ],
      cta: 'Get Started',
      href: '/sign-up',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$19',
      description: 'For professionals and content creators',
      features: [
        'Unlimited stories',
        'Advanced AI refinement',
        'Priority support',
        'Export options',
        'Team collaboration',
        'Custom templates',
      ],
      cta: 'Start Free Trial',
      href: '/sign-up',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Custom AI training',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations',
        'White-label options',
      ],
      cta: 'Contact Sales',
      href: '/sign-up',
      featured: false,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20 bg-slate-50">
        <Container>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your storytelling needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.featured
                    ? 'ring-2 ring-primary-600 shadow-xl scale-105'
                    : ''
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className="text-slate-600">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">
                        ✓
                      </span>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    variant={plan.featured ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-slate-600 mb-4">
              All plans include a 14-day money-back guarantee
            </p>
            <p className="text-sm text-slate-500">
              Questions? Contact us for more information
            </p>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
