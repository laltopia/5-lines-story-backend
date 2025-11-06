'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Container from '@/components/ui/Container'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import { Conversation } from '@/types'
import { formatDate } from '@/lib/utils'

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/history')
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch history')
      }

      setConversations(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading text="Loading your stories..." />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-slate-50">
        <Container>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Your Story History
            </h1>
            <p className="text-slate-600">
              Browse and manage your created stories
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {conversations.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-600 mb-4">No stories yet!</p>
              <p className="text-sm text-slate-500">
                Create your first story to see it here.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conversations.map((conv) => (
                <Card key={conv.id} hover className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="text-xs text-slate-500 mb-3">
                      {formatDate(conv.created_at)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2">
                        {conv.user_input}
                      </h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p className="line-clamp-2">{conv.ai_response.line1}</p>
                        <p className="line-clamp-2">{conv.ai_response.line2}</p>
                        <p className="line-clamp-1 text-slate-400">...</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                      {conv.tokens_used} tokens used
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  )
}
