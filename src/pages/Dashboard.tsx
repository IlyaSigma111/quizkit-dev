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
        const questions = (raw.questions || []).map((q: any, idx: number) => ({
          id: `q-${Date.now()}-${idx}`,
          text: q.text || `Вопрос ${idx + 1}`,
          time_seconds: q.time_seconds || 30,
          points: q.points || 10,
          answers: (q.answers || []).map((a: any, ai: number) => ({
            id: `a-${Date.now()}-${idx}-${ai}`,
            text: a.text || `Ответ ${ai + 1}`,
            is_correct: !!a.is_correct,
            color: ['#FF4444', '#4488FF', '#FFBB33', '#44CC44'][ai] || '#666',
            shape: ['△', '◇', '○', '☆'][ai] || '?',
          })),
        }))
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

  const [showModePicker, setShowModePicker] = useState<string | null>(null)

  const handleStart = async (quizId: string, mode: string, advance: string) => {
    try {
      const session = await invoke<GameSession>('start_game', { quizId, mode, advance })
      setShowModePicker(null)
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
          📂 JSON
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
            <button className="btn btn-secondary" onClick={() => setShowTemplate(true)} style={{ marginLeft: 'auto' }}>📋 Формат JSON</button>
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
              <button className="btn btn-play" onClick={() => setShowModePicker(quiz.id)}>
                ▶ Играть
              </button>
              <button className="btn btn-secondary" onClick={() => onEditQuiz(quiz.id)}>
                ✏ Править
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(quiz.id)}>
                🗑 Удалить
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

      {showModePicker && (
        <div className="modal-overlay" onClick={() => setShowModePicker(null)}>
          <div className="mode-picker" onClick={(e) => e.stopPropagation()}>
            <h3>Выберите формат</h3>
            <div className="mode-options">
              <button className="mode-option" onClick={() => handleStart(showModePicker, 'test', 'auto')}>
                <span className="mode-icon">📝</span>
                <span className="mode-title">Проверочная работа</span>
                <span className="mode-desc">Каждый ученик отвечает в своём темпе</span>
              </button>
              <button className="mode-option" onClick={() => handleStart(showModePicker, 'live', 'auto')}>
                <span className="mode-icon">🎮</span>
                <span className="mode-title">Викторина (авто)</span>
                <span className="mode-desc">Таймер на каждый вопрос, авто-переход</span>
              </button>
              <button className="mode-option" onClick={() => handleStart(showModePicker, 'live', 'manual')}>
                <span className="mode-icon">👆</span>
                <span className="mode-title">Викторина (вручную)</span>
                <span className="mode-desc">Учитель сам листает вопросы</span>
              </button>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowModePicker(null)}>Отмена</button>
          </div>
        </div>
      )}

      {showTemplate && (
        <div className="modal-overlay" onClick={() => setShowTemplate(false)}>
          <div className="mode-picker" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>📋 Формат JSON для импорта</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Создай .json файл с такой структурой и импортируй через кнопку «📂 JSON»
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
              }}>📋 Копировать</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTemplate(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
