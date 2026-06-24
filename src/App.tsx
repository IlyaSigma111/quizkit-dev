import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { QuizBuilder } from './pages/QuizBuilder'
import { GameHost } from './pages/GameHost'
import { Settings } from './pages/Settings'
import { invoke } from '@tauri-apps/api/core'
import './styles/globals.css'

export type Quiz = {
  id: string
  title: string
  description: string
  questions: Question[]
  created_at: string
}

export type Question = {
  id: string
  text: string
  time_seconds: number
  points: number
  answers: Answer[]
}

export type Answer = {
  id: string
  text: string
  is_correct: boolean
  color: string
  shape: string
}

export type GameSession = {
  pin: string
  quiz: Quiz
  status: string
  mode: string
  advance: string
  current_question_index: number
  players: Player[]
  player_progress: Record<string, number>
  server_port: number
}

export type Player = {
  id: string
  nickname: string
  total_score: number
  streak: number
  joined_at: string
}

export type ServerInfo = {
  ip: string
  port: number
  local_url: string
}

export type AppSettings = {
  default_mode: string
  default_advance: string
  default_time_seconds: number
  default_points: number
  theme: string
}

type Page = 'dashboard' | 'builder' | 'game' | 'settings'

function applyTheme(theme: string) {
  document.documentElement.className = `theme-${theme}`
}

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [editQuizId, setEditQuizId] = useState<string | null>(null)
  const [gamePin, setGamePin] = useState<string | null>(null)
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [showIp, setShowIp] = useState(false)

  useEffect(() => {
    invoke<AppSettings>('get_settings').then(s => {
      applyTheme(s.theme)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const poll = () => {
      invoke<ServerInfo>('get_server_info').then((info) => {
        if (cancelled) return
        if (info.port > 0) {
          setServerInfo(info)
        } else {
          setTimeout(poll, 200)
        }
      }).catch(() => { if (!cancelled) setTimeout(poll, 500) })
    }
    poll()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
            <h1 className="app-logo" onClick={() => { setPage('dashboard'); setEditQuizId(null); setGamePin(null) }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{width:22,height:22,verticalAlign:'middle',marginRight:6}}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              ИльЯкласс
            </h1>
          <span className="app-subtitle">Интерактивные викторины</span>
        </div>
        {serverInfo && (
          <div className="server-info" onClick={() => setShowIp(!showIp)} style={{ cursor: 'pointer' }} title={showIp ? 'Скрыть' : 'Показать IP'}>
            <span className="dot" />
            {showIp ? (
              <span>{serverInfo.ip}:{serverInfo.port}</span>
            ) : (
              <span>Сервер: ••••</span>
            )}
          </div>
        )}
        <button className="btn-settings" onClick={() => setPage('settings')} title="Настройки">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </button>
      </header>

      <main className="app-main">
        {page === 'dashboard' && (
          <Dashboard
            onEditQuiz={(id) => { setEditQuizId(id); setPage('builder') }}
            onStartGame={(pin) => { setGamePin(pin); setPage('game') }}
          />
        )}
        {page === 'builder' && (
          <QuizBuilder
            quizId={editQuizId}
            onBack={() => setPage('dashboard')}
          />
        )}
        {page === 'game' && gamePin && (
          <GameHost
            pin={gamePin}
            serverInfo={serverInfo}
            onBack={() => { setGamePin(null); setPage('dashboard') }}
          />
        )}
        {page === 'settings' && (
          <Settings onBack={() => setPage('dashboard')} onThemeChange={applyTheme} />
        )}
      </main>
    </div>
  )
}

export default App
