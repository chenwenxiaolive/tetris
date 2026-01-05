'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Score } from '@/lib/types'

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchScores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(10)

    if (!error && data) {
      setScores(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchScores()

    const channel = supabase
      .channel('scores_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => fetchScores()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getRankStyle = (index: number) => {
    if (index === 0) return { gradient: 'from-yellow-400 to-amber-500', glow: 'yellow-500', icon: '👑' }
    if (index === 1) return { gradient: 'from-gray-300 to-gray-400', glow: 'gray-400', icon: '🥈' }
    if (index === 2) return { gradient: 'from-orange-400 to-amber-600', glow: 'orange-500', icon: '🥉' }
    return { gradient: 'from-slate-500 to-slate-600', glow: 'slate-500', icon: null }
  }

  return (
    <div className="relative h-full">
      {/* Background glow */}
      <div className="absolute -inset-1 bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl blur-xl" />

      <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5 h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-50" />
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">排行榜</h2>
            <p className="text-xs text-gray-400">TOP 10</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-gray-400 text-sm">暂无记录</p>
            <p className="text-gray-500 text-xs mt-1">成为第一个上榜的玩家!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((score, index) => {
              const style = getRankStyle(index)
              return (
                <div
                  key={score.id}
                  className="group relative"
                >
                  {index < 3 && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${style.gradient} rounded-lg blur opacity-20 group-hover:opacity-40 transition`} />
                  )}
                  <div className={`relative flex items-center gap-3 p-3 rounded-lg transition ${
                    index < 3 ? 'bg-black/40' : 'bg-white/5 hover:bg-white/10'
                  }`}>
                    {/* Rank */}
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                      index < 3
                        ? `bg-gradient-to-br ${style.gradient} text-black`
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {style.icon || index + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {score.username}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(score.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        index < 3
                          ? `bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`
                          : 'text-white'
                      }`}>
                        {score.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={fetchScores}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition group"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新排行榜
        </button>
      </div>
    </div>
  )
}
