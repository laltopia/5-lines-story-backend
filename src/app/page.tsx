import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
          <Container>
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 animate-fade-in">
                Transform Ideas into{' '}
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Compelling Stories
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-12 animate-slide-up">
                AI-powered storytelling using the proven 5-line methodology.
                Create narratives that resonate, inspire, and drive action.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                <Link href="/story">
                  <Button size="lg">Start Creating</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Why 5 Lines Story?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Our unique methodology makes storytelling simple, effective, and
                scalable for any purpose.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card hover className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Structured Framework
                </h3>
                <p className="text-slate-600">
                  5-line methodology: Context, Desire, Obstacle, Action, and
                  Result. A proven structure for impactful stories.
                </p>
              </Card>

              <Card hover className="text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  AI-Powered
                </h3>
                <p className="text-slate-600">
                  Leverage Claude AI to generate, refine, and perfect your
                  stories. Get multiple narrative paths to choose from.
                </p>
              </Card>

              <Card hover className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Multi-Language
                </h3>
                <p className="text-slate-600">
                  Create stories in Portuguese, English, Spanish, French,
                  German, and more. AI adapts to your language.
                </p>
              </Card>
            </div>
          </Container>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-slate-50">
          <Container>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Three simple steps to create your perfect story
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Input Your Idea
                </h3>
                <p className="text-slate-600">
                  Share your story concept, business pitch, or any narrative you
                  want to tell.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Choose Your Path
                </h3>
                <p className="text-slate-600">
                  AI suggests 3 different narrative directions. Pick one or
                  customize your own.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Refine & Share
                </h3>
                <p className="text-slate-600">
                  Edit any line, refine with AI, and share your polished 5-line
                  story.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <Container>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Tell Your Story?
              </h2>
              <p className="text-xl mb-8 text-primary-50">
                Join creators, marketers, and storytellers who use 5 Lines Story
                to craft compelling narratives.
              </p>
              <Link href="/story">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary-600 hover:bg-slate-50"
                >
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  )
}
