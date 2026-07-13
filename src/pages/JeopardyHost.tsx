import { useState, useEffect, useRef, useCallback } from 'react'
import type { ServerInfo } from '../App'
import { QRCodeSVG } from 'qrcode.react'

function qrColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#e8e8f0'
}
function qrBg() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim()
  if (!bg || bg.startsWith('rgba') || bg.startsWith('transparent')) return '#ffffff'
  return bg
}

type JeopardyQuestion = { points: number; text: string; answer: string }
type JeopardyCategory = { name: string; emoji: string; questions: JeopardyQuestion[] }
type RevealPlace = { place: number; player_id: string; nickname: string; score: number }

type HostState = {
  phase: string
  categories: JeopardyCategory[]
  answered_cells: [number, number][]
  turn_order: string[]
  current_turn_idx: number
  current_player_id: string
  current_player_nick: string
  active_cell: [number, number] | null
  pending_answer: { player_id: string; player_nick: string; answer: string } | null
  scores: Record<string, number>
  reveal_places: RevealPlace[]
  board_mode: string
  final_active: boolean
  final_text: string | null
  final_answer: string | null
  final_player_id: string | null
  final_wagers: Record<string, number>
  final_answers: Record<string, string>
  final_correct: Record<string, boolean>
  all_answered_count: number
  total_players: number
}

type Props = {
  pin: string
  serverInfo: ServerInfo | null
  onBack: () => void
}

const POINTS = [100, 200, 300, 400, 500]

export function JeopardyHost({ pin, serverInfo, onBack }: Props) {
  const [status, setStatus] = useState<'lobby' | 'active' | 'final'>('lobby')
  const [qrExpanded, setQrExpanded] = useState(false)
  const [players, setPlayers] = useState<{ id: string; nickname: string }[]>([])
  const [hostState, setHostState] = useState<HostState | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [boardMode, setBoardMode] = useState<string>('manual')

  const wsRef = useRef<WebSocket | null>(null)
  const countdownRef = useRef<number | null>(null)

  const connect = useCallback(() => {
    if (!serverInfo || serverInfo.port === 0) return
    const url = `ws://127.0.0.1:${serverInfo.port}/ws`
    if (wsRef.current?.url === url && wsRef.current?.readyState === WebSocket.OPEN) return
    wsRef.current?.close()
    const ws = new WebSocket(url)

    ws.onopen = () => ws.send(JSON.stringify({ type: 'register_host', pin }))

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'player_joined':
          setPlayers(prev => {
            if (prev.find(p => p.id === msg.player.id)) return prev
            return [...prev, { id: msg.player.id, nickname: msg.player.nickname }]
          })
          break
        case 'player_left':
          setPlayers(prev => prev.filter(p => p.id !== msg.player_id))
          break
        case 'game_starting':
          setStatus('active')
          setCountdown(msg.countdown || 3)
          startCountdown(msg.countdown || 3)
          break
        case 'jeopardy_host_state':
          setHostState(msg.state)
          if (msg.state.board_mode) setBoardMode(msg.state.board_mode)
          // If we're in final, set status to final
          if (msg.state.phase === 'final' || msg.state.phase === 'reveal' || msg.state.phase === 'ended') {
            setStatus('final')
          }
          break
        case 'final_results':
          setStatus('final')
          break
      }
    }

    ws.onerror = () => console.log('WS err')
    ws.onclose = () => console.log('WS closed')
    wsRef.current = ws
  }, [pin, serverInfo])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [pin, serverInfo, connect])

  const startCountdown = (n: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    let remaining = n
    countdownRef.current = window.setInterval(() => {
      remaining--
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        countdownRef.current = null
        setCountdown(null)
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  const handleStart = () => {
    wsRef.current?.send(JSON.stringify({ type: 'start_game', pin }))
  }

  const handleOpenCell = (catIdx: number, qIdx: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'jeopardy_open_cell', pin, cat_idx: catIdx, q_idx: qIdx }))
  }

  const handleJudgeFinal = (playerId: string, correct: boolean) => {
    wsRef.current?.send(JSON.stringify({ type: 'jeopardy_judge_final', pin, player_id: playerId, correct }))
  }

  const handleRevealNext = () => {
    wsRef.current?.send(JSON.stringify({ type: 'jeopardy_reveal_next', pin }))
  }

  const handleEnd = () => {
    wsRef.current?.send(JSON.stringify({ type: 'end_game', pin }))
  }

  const isAnswered = (catIdx: number, qIdx: number) => {
    return hostState?.answered_cells.some(([c, q]) => c === catIdx && q === qIdx) ?? false
  }

  // ─── Final Jeopardy view ───
  if (status === 'final' && hostState) {
    const isRevealPhase = hostState.phase === 'reveal' || hostState.phase === 'ended'
    const allRevealed = hostState.phase === 'ended'

    return (
      <div className="jeopardy-container">
        <div className="jeopardy-header">
          <button className="btn btn-secondary" onClick={onBack}>← Выход</button>
          <h2>🏆 Итоги</h2>
        </div>

        {!isRevealPhase && hostState.final_active && (
          <div className="jeopardy-final-card glass-card">
            <h2>🏆 Финальный раунд</h2>
            <div className="jeopardy-final-question">{hostState.final_text}</div>
            <div className="jeopardy-correct-answer">
              Правильный ответ: <strong>{hostState.final_answer}</strong>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {hostState.turn_order.map((pid) => {
                const nick = players.find(p => p.id === pid)?.nickname || pid.slice(0, 8)
                const wager = hostState.final_wagers[pid]
                const answer = hostState.final_answers[pid]
                const judged = hostState.final_correct[pid] !== undefined
                const isCurrent = pid === hostState.final_player_id
                if (judged) {
                  const correct = hostState.final_correct[pid]
                  return (
                    <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--bg-input)', borderRadius: 10, opacity: 0.6 }}>
                      <span style={{ fontWeight: 700, flex: 1 }}>{nick}</span>
                      <span style={{ color: correct ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{correct ? '✅ Верно' : '❌ Неверно'}</span>
                    </div>
                  )
                }
                if (!answer && !isCurrent) {
                  return (
                    <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--bg-input)', borderRadius: 10, opacity: 0.4 }}>
                      <span style={{ fontWeight: 700, flex: 1 }}>{nick}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>ожидает...</span>
                    </div>
                  )
                }
                // Current player to judge
                return (
                  <div key={pid} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px', background: 'var(--bg-input)', borderRadius: 10, border: '2px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>{nick}</span>
                      {wager !== undefined && <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Ставка: {wager}</span>}
                    </div>
                    {answer && <div style={{ padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, fontSize: 18, fontWeight: 600, textAlign: 'center' }}>«{answer}»</div>}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button className="btn btn-play" style={{ padding: '8px 20px', fontSize: 14, width: 'auto' }} onClick={() => handleJudgeFinal(pid, true)}>✅ Верно</button>
                      <button className="btn btn-danger" style={{ padding: '8px 20px', fontSize: 14, width: 'auto' }} onClick={() => handleJudgeFinal(pid, false)}>❌ Неверно</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(isRevealPhase || allRevealed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, padding: 16 }}>
            <div className="jeopardy-board glass-card" style={{ flex: 1, padding: 16 }}>
              <h3 style={{ textAlign: 'center', marginBottom: 16 }}>
                {allRevealed ? 'Итоговая таблица' : `Раскрытие: ${hostState.reveal_places.length} игроков`}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hostState.reveal_places.map((r, i) => {
                  const isRevealed = i < hostState.reveal_places.length - (allRevealed ? 0 : 1)
                  return (
                    <div key={r.player_id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: isRevealed ? 'var(--bg-input)' : 'transparent',
                      borderRadius: 10, opacity: isRevealed ? 1 : 0.3,
                      transition: 'all .3s ease'
                    }}>
                      <span style={{ fontSize: 20 }}>{['🥇', '🥈', '🥉'][i] || `#${r.place}`}</span>
                      <span style={{ fontWeight: 700, flex: 1 }}>{r.nickname}</span>
                      {isRevealed && <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--success)' }}>{r.score} баллов</span>}
                      {!isRevealed && <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>???</span>}
                    </div>
                  )
                })}
              </div>
            </div>
            {!allRevealed && (
              <button className="btn btn-primary" onClick={handleRevealNext}>
                ➡ Раскрыть следующее место
              </button>
            )}
            {allRevealed && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={onBack}>← В каталог</button>
                <button className="btn btn-primary" onClick={handleEnd}>Завершить игру</button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Lobby ───
  if (status === 'lobby') {
    const qrPin = pin
    return (
      <div className="game-host">
        <div className="game-header">
          <button className="btn btn-secondary" onClick={onBack}>← Выйти</button>
          <div className="connection-info">
            {serverInfo && <span>Сервер: <strong>{serverInfo.ip}:{serverInfo.port}</strong></span>}
          </div>
        </div>
        <div className="lobby-layout">
          <div className="lobby-players-col">
            <h2>🧠 Своя игра</h2>
            <div className="lobby-players">
              <h3>Капитаны ({players.length})</h3>
              {players.length === 0 ? (
                <p className="wait-hint">Ждём первых капитанов...</p>
              ) : (
                <div className="player-chips">
                  {players.map(p => (
                    <div key={p.id} className="player-chip">{p.nickname}</div>
                  ))}
                </div>
              )}
            </div>
            {players.length >= 1 && (
              <button className="btn btn-primary btn-start" onClick={handleStart}>
                Начать игру
              </button>
            )}
          </div>
          <div className="lobby-qr-col">
            <div className="qr-section">
              {serverInfo ? (
                <>
                  <QRCodeSVG
                    value={`http://${serverInfo.ip}:${serverInfo.port}/player/jeopardy?pin=${qrPin}&style=${document.documentElement.className.match(/style-(\S+)/)?.[1] || 'editorial'}${document.documentElement.classList.contains('dark') ? '&dark=1' : ''}`}
                    size={180}
                    bgColor={qrBg()}
                    fgColor={qrColor()}
                    style={{ cursor: 'pointer', transition: 'transform .15s' }}
                    onClick={() => setQrExpanded(true)}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <p className="qr-url">{serverInfo.ip}:{serverInfo.port}</p>
                  <p className="qr-hint">Наведи камеру на QR</p>
                  <p className="qr-url-secondary">
                    ПК: <strong>http://127.0.0.1:{serverInfo.port}/player/jeopardy?pin={qrPin}</strong>
                  </p>
                </>
              ) : (
                <p className="qr-hint">Загрузка...</p>
              )}
            </div>
          </div>
        </div>

        {qrExpanded && serverInfo && (
          <div className="modal-overlay" onClick={() => setQrExpanded(false)}>
            <div className="qr-expanded" onClick={e => e.stopPropagation()}>
              <QRCodeSVG
                value={`http://${serverInfo.ip}:${serverInfo.port}/player/jeopardy?pin=${qrPin}&style=${document.documentElement.className.match(/style-(\S+)/)?.[1] || 'editorial'}${document.documentElement.classList.contains('dark') ? '&dark=1' : ''}`}
                size={320}
                bgColor={qrBg()}
                fgColor={qrColor()}
              />
              <p className="qr-url">{serverInfo.ip}:{serverInfo.port}</p>
              <p className="qr-hint">Наведи камеру на QR</p>
              <button className="btn btn-secondary" onClick={() => setQrExpanded(false)}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Active / Board ───
  const currentNick = hostState?.current_player_nick || '...'
  const isQuestionPhase = hostState?.phase === 'question' && hostState?.active_cell
  const isBoardPhase = hostState?.phase === 'board'

  return (
    <div className="jeopardy-container">
      <div className="jeopardy-header">
        <button className="btn btn-secondary" onClick={onBack}>← Выход</button>
        <div className="jeopardy-title-group">
          <h2>🧠 Своя игра</h2>
          <span className="jeopardy-subtitle">
            Ход: <strong>{currentNick}</strong>
            {boardMode === 'auto' ? ' (авто)' : ' (ручной)'}
          </span>
        </div>
        <div className="jeopardy-header-right">
          <span className="jeopardy-score">{hostState?.all_answered_count || 0} / {hostState?.categories.length ? hostState.categories.length * 5 : 25}</span>
        </div>
      </div>

      {countdown !== null && (
        <div className="host-countdown-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.7)', zIndex: 99 }}>
          <div className="host-countdown-number" style={{ fontSize: 120 }}>{countdown}</div>
          <p style={{ color: '#fff', fontSize: 24 }}>Приготовьтесь!</p>
        </div>
      )}

      {/* Jeopardy Board */}
      {hostState && (
        <div className="jeopardy-board glass-card">
          <div className="jeopardy-header-row">
            <div className="jeopardy-header-label">Категория</div>
            {POINTS.map(pts => (
              <div key={pts} className="jeopardy-header-pts">{pts}</div>
            ))}
          </div>
          {hostState.categories.map((cat, ci) => (
            <div key={ci} className="jeopardy-row">
              <div className="jeopardy-cat-header">
                <span className="jeopardy-cat-emoji">{cat.emoji}</span>
                <span className="jeopardy-cat-name">{cat.name}</span>
              </div>
              {POINTS.map((pts, qi) => {
                const done = isAnswered(ci, qi)
                const isActive = hostState.active_cell?.[0] === ci && hostState.active_cell?.[1] === qi
                const dd = qi === 2 && ci === 0
                return (
                  <div
                    key={qi}
                    className={`jeopardy-cell ${done ? 'done' : ''} ${dd ? 'dd' : ''} ${isActive ? 'active' : ''}`}
                    onClick={() => !done && isBoardPhase && handleOpenCell(ci, qi)}
                  >
                    {done ? '✅' : isActive ? '❓' : dd ? '💰' : pts}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Question phase: show the question from the active cell (answer never shown) */}
      {isQuestionPhase && hostState?.active_cell && (
        <div className="modal-overlay">
          <div className="jeopardy-question-modal glass-card" onClick={e => e.stopPropagation()}>
            <div className="jeopardy-qm-header">
              <span className="jeopardy-qm-category">
                {hostState.categories[hostState.active_cell[0]]?.emoji} {hostState.categories[hostState.active_cell[0]]?.name}
              </span>
              <span className="jeopardy-qm-points">
                {hostState.categories[hostState.active_cell[0]]?.questions[hostState.active_cell[1]]?.points} баллов
              </span>
            </div>
            <div className="jeopardy-qm-question">
              {hostState.categories[hostState.active_cell[0]]?.questions[hostState.active_cell[1]]?.text}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>
              Ожидаем ответ от <strong>{currentNick}</strong>...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
