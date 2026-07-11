import { useState, useEffect, useRef } from 'react'
import type { Quiz, GameSession } from '../App'
import { invoke } from '@tauri-apps/api/core'

type Props = {
  onEditQuiz: (id: string) => void
  onStartGame: (pin: string) => void
}

const TEMPLATE_JSON = `{
  "title": "Название квиза",
  "description": "Описание (необязательно)",
  "questions": [
    {
      "text": "Текст вопроса",
      "time_seconds": 30,
      "points": 10,
      "answers": [
        { "text": "Правильный ответ", "is_correct": true },
        { "text": "Неправильный ответ", "is_correct": false },
        { "text": "Неправильный ответ", "is_correct": false },
        { "text": "Неправильный ответ", "is_correct": false }
      ]
    }
  ]
}`

export function Dashboard({ onEditQuiz, onStartGame }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showTemplate, setShowTemplate] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadQuizzes = () => {
    invoke<Quiz[]>('get_quizzes').then(setQuizzes).catch(console.error)
  }

  useEffect(() => { loadQuizzes() }, [])

  const handleCreate = () => {
    if (!newTitle.trim()) return
    invoke<Quiz>('create_quiz', { title: newTitle, description: newDesc })
      .then((quiz) => {
        setQuizzes((prev) => [quiz, ...prev])
        setShowCreate(false)
        setNewTitle('')
        setNewDesc('')
        onEditQuiz(quiz.id)
      })
      .catch(console.error)
  }

  const handleImport = () => {
    fileRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)
        const title = raw.title || 'Импортированный квиз'
        const description = raw.description || ''
        const isServerFormat = raw.questions?.length && typeof raw.questions[0].question === 'string'
        const questions = (raw.questions || []).map((q: any, idx: number) => {
          const answers = isServerFormat
            ? (q.answers as string[]).map((a: string, ai: number) => ({
                id: `a-${Date.now()}-${idx}-${ai}`,
                text: a,
                is_correct: ai === q.correct,
                color: ['#FF4444', '#4488FF', '#FFBB33', '#44CC44'][ai] || '#666',
                shape: ['△', '◇', '○', '☆'][ai] || '?',
              }))
            : (q.answers || []).map((a: any, ai: number) => ({
                id: `a-${Date.now()}-${idx}-${ai}`,
                text: a.text || `Ответ ${ai + 1}`,
                is_correct: !!a.is_correct,
                color: ['#FF4444', '#4488FF', '#FFBB33', '#44CC44'][ai] || '#666',
                shape: ['△', '◇', '○', '☆'][ai] || '?',
              }))
          return {
            id: `q-${Date.now()}-${idx}`,
            text: isServerFormat ? q.question : (q.text || `Вопрос ${idx + 1}`),
            time_seconds: q.time_seconds || 30,
            points: q.points || 10,
            answers,
          }
        })
        const quiz = await invoke<Quiz>('create_quiz', { title, description })
        const saved = { ...quiz, questions }
        await invoke('save_quiz', { quiz: saved })
        loadQuizzes()
      } catch (err) {
        alert('Ошибка импорта: ' + err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleDelete = (id: string) => {
    if (!confirm('Удалить квиз?')) return
    invoke('delete_quiz', { id }).then(loadQuizzes).catch(console.error)
  }

  interface ModePickerState {
    quizId: string
    step: 'type' | 'advance'
    gameType?: 'live'
  }
  const [modePicker, setModePicker] = useState<ModePickerState | null>(null)

  const handleStart = async (quizId: string, mode: string, advance: string) => {
    try {
      const session = await invoke<GameSession>('start_game', { quizId, mode, advance })
      setModePicker(null)
      onStartGame(session.pin)
    } catch (e) {
      alert('Ошибка: ' + e)
    }
  }

  const filtered = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Поиск квизов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Создать квиз
        </button>
        <button className="btn btn-secondary" onClick={handleImport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          JSON
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {showCreate && (
        <div className="create-form">
          <input
            type="text"
            placeholder="Название квиза"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <input
            type="text"
            placeholder="Описание (необязательно)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="create-actions">
            <button className="btn btn-primary" onClick={handleCreate}>Создать</button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Отмена</button>
            <button className="btn btn-secondary" onClick={() => setShowTemplate(true)} style={{ marginLeft: 'auto' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Формат JSON
            </button>
          </div>
        </div>
      )}

      <div className="quiz-grid">
        {filtered.map((quiz) => (
          <div key={quiz.id} className="quiz-card">
            <div className="quiz-card-header">
              <h3>{quiz.title}</h3>
              <span className="question-count">
                {quiz.questions.length} вопросов
              </span>
            </div>
            {quiz.description && <p className="quiz-desc">{quiz.description}</p>}
            <div className="quiz-card-actions">
              <button className="btn btn-play" onClick={() => setModePicker({ quizId: quiz.id, step: 'type' })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Играть
              </button>
              <button className="btn btn-secondary" onClick={() => onEditQuiz(quiz.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Править
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(quiz.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Удалить
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>Квизов пока нет. Создайте первый!</p>
          </div>
        )}
      </div>

      {modePicker && (
        <div className="modal-overlay" onClick={() => setModePicker(null)}>
          <div className="mode-picker" onClick={(e) => e.stopPropagation()}>
            {modePicker.step === 'type' ? (
              <>
                <h3>Выберите формат</h3>
                <div className="mode-options">
                  <button className="mode-option" onClick={() => handleStart(modePicker.quizId, 'test', 'auto')}>
                    <span className="mode-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </span>
                    <span className="mode-title">Проверочная работа</span>
                    <span className="mode-desc">Каждый ученик отвечает в своём темпе</span>
                  </button>
                  <button className="mode-option" onClick={() => setModePicker({ ...modePicker, step: 'advance', gameType: 'live' })}>
                    <span className="mode-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </span>
                    <span className="mode-title">Викторина</span>
                    <span className="mode-desc">△◇○☆ — 4 варианта ответа</span>
                  </button>
                  <button className="mode-option" onClick={() => setModePicker({ ...modePicker, step: 'advance', gameType: 'live' })}>
                    <span className="mode-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                    </span>
                    <span className="mode-title">Правда и Ложь</span>
                    <span className="mode-desc">✓✗ — 2 варианта ответа</span>
                  </button>
                </div>
                <button className="btn btn-secondary" onClick={() => setModePicker(null)}>Отмена</button>
              </>
            ) : (
              <>
                <h3>{modePicker.gameType === 'live' ? 'Викторина / Правда и Ложь' : ''}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 4 }}>
                  Режим перехода между вопросами
                </p>
                <div className="mode-options">
                  <button className="mode-option" onClick={() => handleStart(modePicker.quizId, 'live', 'auto')}>
                    <span className="mode-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </span>
                    <span className="mode-title">Автоматически</span>
                    <span className="mode-desc">Таймер на каждый вопрос</span>
                  </button>
                  <button className="mode-option" onClick={() => handleStart(modePicker.quizId, 'live', 'manual')}>
                    <span className="mode-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </span>
                    <span className="mode-title">Вручную</span>
                    <span className="mode-desc">Учитель сам листает вопросы</span>
                  </button>
                </div>
                <div className="create-actions" style={{ width: '100%' }}>
                  <button className="btn btn-secondary" onClick={() => setModePicker({ ...modePicker, step: 'type' })}>← Назад</button>
                  <button className="btn btn-secondary" onClick={() => setModePicker(null)}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showTemplate && (
        <div className="modal-overlay" onClick={() => setShowTemplate(false)}>
          <div className="mode-picker" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>Формат JSON для импорта</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Создай .json файл с такой структурой и импортируй через кнопку «JSON»
            </p>
            <pre style={{
              width: '100%', padding: 16, background: 'var(--bg-input)',
              borderRadius: 10, fontSize: 12, lineHeight: 1.5,
              overflow: 'auto', maxHeight: 360, color: 'var(--text)',
              textAlign: 'left', whiteSpace: 'pre', fontFamily: 'monospace'
            }}>{TEMPLATE_JSON}</pre>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                navigator.clipboard.writeText(TEMPLATE_JSON)
                alert('Шаблон скопирован!')
              }}>Копировать</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTemplate(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
