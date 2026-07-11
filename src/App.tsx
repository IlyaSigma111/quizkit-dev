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
  style: string
}

type Page = 'dashboard' | 'builder' | 'game' | 'settings'

function applyTheme(theme: string, style: string) {
  document.documentElement.className = `theme-${theme} style-${style}`
}

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [editQuizId, setEditQuizId] = useState<string | null>(null)
  const [gamePin, setGamePin] = useState<string | null>(null)
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [showIp, setShowIp] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('spline')
  const [currentStyle, setCurrentStyle] = useState('editorial')

  useEffect(() => {
    invoke<AppSettings>('get_settings').then(s => {
      setCurrentTheme(s.theme)
      setCurrentStyle(s.style)
      applyTheme(s.theme, s.style)
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
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
          <Settings
            onBack={() => setPage('dashboard')}
            onThemeChange={(theme) => {
              setCurrentTheme(theme)
              applyTheme(theme, currentStyle)
            }}
            onStyleChange={(style) => {
              setCurrentStyle(style)
              applyTheme(currentTheme, style)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
