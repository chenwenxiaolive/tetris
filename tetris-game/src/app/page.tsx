'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Tetris from '@/components/Tetris'
import Leaderboard from '@/components/Leaderboard'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [highScore, setHighScore] = useState<number>(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchHighScore()
    }
  }, [user])

  const fetchHighScore = async () => {
    if (!user) return
    const { data } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setHighScore(data.score)
    }
  }

  const handleGameOver = async (score: number) => {
    setLastScore(score)
    if (!user || score === 0) return

    setSaving(true)
    const username = user.email?.split('@')[0] || 'Anonymous'

    // Check if user already has a score record
    const { data: existingScore } = await supabase
      .from('scores')
      .select('id, score')
      .eq('user_id', user.id)
      .single()

    if (existingScore) {
      // Only update if new score is higher
      if (score > existingScore.score) {
        await supabase
          .from('scores')
          .update({ score, username, created_at: new Date().toISOString() })
          .eq('id', existingScore.id)
        setHighScore(score)
      }
    } else {
      // Insert new record
      await supabase.from('scores').insert({
        user_id: user.id,
        username,
        score,
      })
      if (score > highScore) {
        setHighScore(score)
      }
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-500 rounded-full animate-spin animation-delay-150" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-50" />
                <div className="relative bg-black px-4 py-2 rounded-xl border border-white/10">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    TETRIS
                  </h1>
                </div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <span className="hidden sm:block text-gray-400 text-sm">经典俄罗斯方块</span>
            </div>

            <div className="flex items-center gap-4">
              {/* User Stats */}
              <div className="hidden md:flex items-center gap-4">
                {lastScore !== null && (
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-gray-400 text-sm">上局</span>
                    <span className="text-white font-semibold">{lastScore.toLocaleString()}</span>
                    {saving && (
                      <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                  <span className="text-yellow-400/70 text-sm">最高</span>
                  <span className="text-yellow-400 font-bold">{highScore.toLocaleString()}</span>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-gray-300 text-sm hidden sm:inline">{user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={signOut}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition" />
                  <div className="relative bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 px-3 py-1.5 rounded-lg transition flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-gray-400 group-hover:text-red-400 text-sm transition hidden sm:inline">退出</span>
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Stats */}
          <div className="md:hidden flex justify-center gap-4 mb-6">
            {lastScore !== null && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-gray-400 text-xs">上局</span>
                <span className="text-white font-semibold text-sm">{lastScore.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
              <span className="text-yellow-400/70 text-xs">最高</span>
              <span className="text-yellow-400 font-bold text-sm">{highScore.toLocaleString()}</span>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex flex-wrap justify-center gap-8 items-start">
            {/* Game Area */}
            <div>
              <Tetris onGameOver={handleGameOver} />
            </div>

            {/* Leaderboard */}
            <div className="w-80">
              <Leaderboard />
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <p className="text-gray-600 text-xs">
              Built with Next.js & Supabase
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
