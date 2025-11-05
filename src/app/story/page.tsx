'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Container from '@/components/ui/Container'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Textarea from '@/components/ui/Textarea'
import Loading from '@/components/ui/Loading'
import { StoryPath, Story, GenerateStoryResponse } from '@/types'
import { copyToClipboard } from '@/lib/utils'

export default function StoryPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [userInput, setUserInput] = useState('')
  const [paths, setPaths] = useState<StoryPath[]>([])
  const [selectedPath, setSelectedPath] = useState<StoryPath | null>(null)
  const [customDirection, setCustomDirection] = useState('')
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSuggestPaths = async () => {
    if (!userInput.trim()) {
      setError('Please enter your story idea')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/suggest-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate paths')
      }

      setPaths(data.data.paths)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateStory = async () => {
    if (!selectedPath && !customDirection.trim()) {
      setError('Please select a path or provide custom direction')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          selectedPath,
          customDirection: customDirection || undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate story')
      }

      setStory(data.data.story)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyStory = () => {
    if (!story) return
    const text = `${story.line1}\n\n${story.line2}\n\n${story.line3}\n\n${story.line4}\n\n${story.line5}`
    copyToClipboard(text)
  }

  const handleReset = () => {
    setStep(1)
    setUserInput('')
    setPaths([])
    setSelectedPath(null)
    setCustomDirection('')
    setStory(null)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-slate-50">
        <Container size="md">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= num
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      step > num ? 'bg-primary-600' : 'bg-slate-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <Card>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Step 1: Share Your Story Idea
              </h2>
              <p className="text-slate-600 mb-6">
                Enter any idea, concept, or narrative you want to transform
                into a compelling 5-line story.
              </p>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Example: I want to tell the story of how our startup pivoted and found success..."
                rows={6}
                className="mb-6"
              />
              <Button
                onClick={handleSuggestPaths}
                isLoading={isLoading}
                disabled={!userInput.trim()}
                className="w-full"
              >
                Generate Story Paths
              </Button>
            </Card>
          )}

          {/* Step 2: Choose Path */}
          {step === 2 && (
            <>
              <Card className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Step 2: Choose Your Narrative Direction
                </h2>
                <p className="text-slate-600 mb-6">
                  Select one of the suggested paths or provide your own
                  direction.
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {paths.map((path) => (
                    <Card
                      key={path.id}
                      hover
                      padding="sm"
                      className={`cursor-pointer ${
                        selectedPath?.id === path.id
                          ? 'ring-2 ring-primary-600'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedPath(path)
                        setCustomDirection('')
                      }}
                    >
                      <h3 className="font-bold text-lg mb-2">{path.title}</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        {path.description}
                      </p>
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                        {path.focus}
                      </span>
                    </Card>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Or provide custom direction:
                  </label>
                  <Textarea
                    value={customDirection}
                    onChange={(e) => {
                      setCustomDirection(e.target.value)
                      setSelectedPath(null)
                    }}
                    placeholder="Describe how you want the story to be told..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerateStory}
                    isLoading={isLoading}
                    disabled={!selectedPath && !customDirection.trim()}
                    className="flex-1"
                  >
                    Generate Story
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Step 3: Story Result */}
          {step === 3 && story && (
            <Card>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Your 5-Line Story
              </h2>

              <div className="space-y-6 mb-8">
                {Object.entries(story).map(([key, value], index) => (
                  <div key={key} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <p className="flex-1 text-slate-800 leading-relaxed">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Create New Story
                </Button>
                <Button onClick={handleCopyStory} className="flex-1">
                  Copy Story
                </Button>
              </div>
            </Card>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  )
}
