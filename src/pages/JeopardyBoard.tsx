import { useState, useMemo } from 'react'

type JeopardyQuestion = {
  points: number
  text: string
  answer: string
  revealed?: boolean
}

type JeopardyCategory = {
  name: string
  emoji: string
  questions: JeopardyQuestion[]
}

type JeopardyTemplate = {
  id: string
  title: string
  description: string
  emoji: string
  tag: string
  categories: JeopardyCategory[]
  final_jeopardy?: { text: string; answer: string }
}

type Props = {
  template: JeopardyTemplate
  onBack: () => void
}

type CellKey = string
type ScoreEvent = { points: number; timestamp: number }

const POINTS = [100, 200, 300, 400, 500]
const FINAL_POINTS = 1000

export function JeopardyBoard({ template, onBack }: Props) {
  const [answered, setAnswered] = useState<Set<CellKey>>(new Set())
  const [activeQuestion, setActiveQuestion] = useState<{ catIdx: number; qIdx: number } | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState<ScoreEvent[]>([])
  const [phase, setPhase] = useState<'board' | 'final' | 'end'>('board')
  const [finalAnswer, setFinalAnswer] = useState('')
  const [finalRevealed, setFinalRevealed] = useState(false)

  const totalScore = useMemo(() => score.reduce((s, e) => s + e.points, 0), [score])

  function cellKey(catIdx: number, qIdx: number) { return `${catIdx}-${qIdx}` }

  function handleCellClick(catIdx: number, qIdx: number) {
    if (answered.has(cellKey(catIdx, qIdx))) return
    setActiveQuestion({ catIdx, qIdx })
    setShowAnswer(false)
  }

  function handleCorrect() {
    if (!activeQuestion) return
    const q = template.categories[activeQuestion.catIdx].questions[activeQuestion.qIdx]
    const pts = q.points * (dailyDouble ? 2 : 1)
    setScore(prev => [...prev, { points: pts, timestamp: Date.now() }])
    setAnswered(prev => new Set(prev).add(cellKey(activeQuestion.catIdx, activeQuestion.qIdx)))
    setActiveQuestion(null)
    setShowAnswer(false)
  }

  function handleWrong() {
    if (!activeQuestion) return
    setAnswered(prev => new Set(prev).add(cellKey(activeQuestion.catIdx, activeQuestion.qIdx)))
    setActiveQuestion(null)
    setShowAnswer(false)
  }

  function isDailyDouble(catIdx: number, qIdx: number) {
    return qIdx === 2 && catIdx === 0
  }

  const dailyDouble = activeQuestion ? isDailyDouble(activeQuestion.catIdx, activeQuestion.qIdx) : false

  function allAnswered() {
    for (let ci = 0; ci < template.categories.length; ci++) {
      for (let qi = 0; qi < 5; qi++) {
        if (!answered.has(cellKey(ci, qi))) return false
      }
    }
    return true
  }

  function handleFinalSubmit() {
    setFinalRevealed(true)
  }

  function handleFinalCorrect() {
    setScore(prev => [...prev, { points: FINAL_POINTS, timestamp: Date.now() }])
    setPhase('end')
  }

  function handleFinalWrong() {
    setPhase('end')
  }

  if (phase === 'final') {
    return (
      <div className="jeopardy-container">
        <div className="jeopardy-header">
          <button className="btn btn-secondary" onClick={() => setPhase('board')}>← Назад</button>
          <h2>🏆 Финальный раунд</h2>
          <span className="jeopardy-score">{totalScore} баллов</span>
        </div>
        <div className="jeopardy-final-card glass-card">
          <div className="jeopardy-final-title">{template.emoji} {template.title}</div>
          <div className="jeopardy-final-question">{template.final_jeopardy?.text}</div>
          {!finalRevealed ? (
            <div className="jeopardy-final-input-row">
              <input
                type="text"
                placeholder="Ваш ответ..."
                value={finalAnswer}
                onChange={e => setFinalAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFinalSubmit()}
                className="jeopardy-input"
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleFinalSubmit}>Показать ответ</button>
            </div>
          ) : (
            <div className="jeopardy-final-reveal">
              <div className="jeopardy-correct-answer">Правильный ответ: <strong>{template.final_jeopardy?.answer}</strong></div>
              <div className="jeopardy-final-actions">
                <button className="btn btn-play" onClick={handleFinalCorrect}>✅ Верно (+{FINAL_POINTS})</button>
                <button className="btn btn-danger" onClick={handleFinalWrong}>❌ Неверно</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'end') {
    return (
      <div className="jeopardy-container">
        <div className="jeopardy-header">
          <button className="btn btn-secondary" onClick={onBack}>← Выход</button>
          <h2>🏆 Игра окончена!</h2>
          <span className="jeopardy-score">{totalScore} баллов</span>
        </div>
        <div className="jeopardy-end-card glass-card">
          <div className="jeopardy-end-emoji">{totalScore >= 5000 ? '🏆' : totalScore >= 2500 ? '🥇' : totalScore >= 1000 ? '🥈' : '🥉'}</div>
          <div className="jeopardy-end-title">{template.emoji} {template.title}</div>
          <div className="jeopardy-end-score">{totalScore} баллов</div>
          <div className="jeopardy-end-detail">
            {totalScore >= 5000 ? 'Блистательная игра! Вы настоящий эрудит!' :
             totalScore >= 2500 ? 'Отличный результат! Вы многое знаете.' :
             totalScore >= 1000 ? 'Хороший результат! Есть куда расти.' :
             'Неплохо для начала! Попробуйте ещё.'}
          </div>
          <button className="btn btn-primary" onClick={onBack}>← В каталог</button>
        </div>
      </div>
    )
  }

  return (
    <div className="jeopardy-container">
      <div className="jeopardy-header">
        <button className="btn btn-secondary" onClick={onBack}>← Выход</button>
        <div className="jeopardy-title-group">
          <h2>{template.emoji} {template.title}</h2>
          <span className="jeopardy-subtitle">{template.description}</span>
        </div>
        <div className="jeopardy-header-right">
          <span className="jeopardy-score">{totalScore} баллов</span>
          <span className="jeopardy-progress">{answered.size} / {template.categories.length * 5}</span>
        </div>
      </div>

      <div className="jeopardy-board glass-card">
        <div className="jeopardy-header-row">
          <div className="jeopardy-header-label">Категория</div>
          {POINTS.map(pts => (
            <div key={pts} className="jeopardy-header-pts">{pts}</div>
          ))}
        </div>
        {template.categories.map((cat, ci) => (
          <div key={ci} className="jeopardy-row">
            <div className="jeopardy-cat-header">
              <span className="jeopardy-cat-emoji">{cat.emoji}</span>
              <span className="jeopardy-cat-name">{cat.name}</span>
            </div>
            {POINTS.map((pts, qi) => {
              const key = cellKey(ci, qi)
              const done = answered.has(key)
              const dd = isDailyDouble(ci, qi)
              return (
                <div
                  key={qi}
                  className={`jeopardy-cell ${done ? 'done' : ''} ${dd ? 'dd' : ''}`}
                  onClick={() => !done && handleCellClick(ci, qi)}
                >
                  {done ? '✅' : dd ? '💰' : pts}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {allAnswered() && template.final_jeopardy && (
        <div className="jeopardy-final-btn-row">
          <button className="btn btn-play btn-lg" onClick={() => setPhase('final')}>
            🏆 Финальный раунд!
          </button>
        </div>
      )}

      {activeQuestion !== null && (
        <div className="modal-overlay" onClick={handleWrong}>
          <div className="jeopardy-question-modal glass-card" onClick={e => e.stopPropagation()}>
            <div className="jeopardy-qm-header">
              <span className="jeopardy-qm-category">
                {template.categories[activeQuestion.catIdx].emoji} {template.categories[activeQuestion.catIdx].name}
              </span>
              <span className="jeopardy-qm-points">
                {template.categories[activeQuestion.catIdx].questions[activeQuestion.qIdx].points}
                {dailyDouble ? ' (×2)' : ''} баллов
              </span>
            </div>
            {dailyDouble && <div className="jeopardy-dd-banner">💰 Daily Double!</div>}
            <div className="jeopardy-qm-question">
              {template.categories[activeQuestion.catIdx].questions[activeQuestion.qIdx].text}
            </div>
            {!showAnswer ? (
              <div className="jeopardy-qm-actions">
                <button className="btn btn-primary btn-lg" onClick={() => setShowAnswer(true)}>
                  Показать ответ
                </button>
              </div>
            ) : (
              <div className="jeopardy-answer-section">
                <div className="jeopardy-correct-answer">
                  Ответ: <strong>{template.categories[activeQuestion.catIdx].questions[activeQuestion.qIdx].answer}</strong>
                </div>
                <div className="jeopardy-qm-actions">
                  <button className="btn btn-play btn-lg" onClick={handleCorrect}>
                    ✅ Верно! (+{template.categories[activeQuestion.catIdx].questions[activeQuestion.qIdx].points * (dailyDouble ? 2 : 1)})
                  </button>
                  <button className="btn btn-danger btn-lg" onClick={handleWrong}>
                    ❌ Неверно
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
