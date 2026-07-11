import { useState, useEffect, useRef } from 'react'
import type { Quiz, Question, Answer } from '../App'
import { invoke } from '@tauri-apps/api/core'

type Props = {
  quizId: string | null
  onBack: () => void
}

type QuizType = 'quiz' | 'truefalse'

const COLORS = ['#FF4444', '#4488FF', '#FFBB33', '#44CC44']
const SHAPES = ['triangle', 'diamond', 'circle', 'star']
const COLOR_NAMES = ['red', 'blue', 'yellow', 'green']
const SHAPE_SYMBOLS = ['△', '◇', '○', '☆'] as const

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function importFromJSON(json: Record<string, unknown>): Quiz {
  const questions = json.questions
  if (Array.isArray(questions) && questions.length > 0) {
    const first = questions[0] as Record<string, unknown>
    if (typeof first.question === 'string') {
      return {
        id: makeId(),
        title: String(json.title ?? ''),
        description: String(json.description ?? ''),
        created_at: String(Date.now()),
        questions: questions.map((q) => {
          const question = q as Record<string, unknown>
          const answers = (question.answers as string[]) ?? []
          const correct = Number(question.correct ?? 0)
          return {
            id: makeId(),
            text: String(question.question ?? ''),
            time_seconds: 20,
            points: 1000,
            answers: answers.map((a: string, ai: number) => ({
              id: makeId(),
              text: a,
              is_correct: ai === correct,
              color: COLOR_NAMES[ai],
              shape: SHAPES[ai],
            })),
          }
        }),
      }
    }
    if (typeof first.text === 'string') {
      return { ...json, id: String(json.id ?? makeId()), created_at: String(json.created_at ?? Date.now()) } as unknown as Quiz
    }
  }
  throw new Error('Неизвестный формат JSON')
}

function exportToJSON(quiz: Quiz): string {
  const data = {
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q) => ({
      question: q.text,
      answers: q.answers.map((a) => a.text),
      correct: q.answers.findIndex((a) => a.is_correct),
    })),
  }
  return JSON.stringify(data, null, 2)
}

export function QuizBuilder({ quizId, onBack }: Props) {
  const [quiz, setQuiz] = useState<Quiz>(() => ({
    id: quizId || makeId(),
    title: '',
    description: '',
    questions: [],
    created_at: String(Date.now()),
  }))
  const [quizType, setQuizType] = useState<QuizType>('quiz')
  const [showJsonMenu, setShowJsonMenu] = useState(false)
  const jsonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (quizId) {
      invoke<Quiz | null>('get_quiz', { id: quizId }).then((q) => {
        if (q) {
          setQuiz(q)
          if (q.questions.length > 0) {
            setQuizType(q.questions[0].answers.length === 2 ? 'truefalse' : 'quiz')
          }
        }
      })
    }
  }, [quizId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (jsonRef.current && !jsonRef.current.contains(e.target as Node)) {
        setShowJsonMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const save = () => {
    invoke('save_quiz', { quiz }).then(() => {
      alert('Сохранено!')
      onBack()
    }).catch(console.error)
  }

  const addQuestion = () => {
    const count = quizType === 'truefalse' ? 2 : 4
    const q: Question = {
      id: makeId(),
      text: '',
      time_seconds: 20,
      points: 1000,
      answers: Array.from({ length: count }, (_, i) => ({
        id: makeId(),
        text: quizType === 'truefalse' ? (i === 0 ? 'Верно' : 'Неверно') : '',
        is_correct: i === 0,
        color: COLOR_NAMES[i],
        shape: SHAPES[i],
      })),
    }
    setQuiz((prev) => ({ ...prev, questions: [...prev.questions, q] }))
  }

  const removeQuestion = (idx: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }))
  }

  const updateQuestion = (idx: number, field: keyof Question, value: any) => {
    setQuiz((prev) => {
      const qs = [...prev.questions]
      qs[idx] = { ...qs[idx], [field]: value }
      return { ...prev, questions: qs }
    })
  }

  const updateAnswer = (qIdx: number, aIdx: number, field: keyof Answer, value: any) => {
    setQuiz((prev) => {
      const qs = [...prev.questions]
      const answers = [...qs[qIdx].answers]
      answers[aIdx] = { ...answers[aIdx], [field]: value }
      qs[qIdx] = { ...qs[qIdx], answers }
      return { ...prev, questions: qs }
    })
  }

  const setCorrect = (qIdx: number, aIdx: number) => {
    setQuiz((prev) => {
      const qs = [...prev.questions]
      qs[qIdx] = {
        ...qs[qIdx],
        answers: qs[qIdx].answers.map((a, i) => ({ ...a, is_correct: i === aIdx })),
      }
      return { ...prev, questions: qs }
    })
  }

  const changeQuizType = (newType: QuizType) => {
    if (newType === quizType) return
    if (quiz.questions.length > 0) {
      if (!confirm('Сменить тип квиза? Все вопросы будут перестроены.')) return
      const newQuestions = quiz.questions.map((q) => {
        if (newType === 'truefalse') {
          return {
            ...q,
            answers: q.answers.slice(0, 2).map((a, i) => ({
              ...a,
              text: a.text || (i === 0 ? 'Верно' : 'Неверно'),
              color: COLOR_NAMES[i],
              shape: SHAPES[i],
            })),
          }
        }
        const answers = [...q.answers]
        while (answers.length < 4) {
          answers.push({
            id: makeId(),
            text: '',
            is_correct: false,
            color: COLOR_NAMES[answers.length],
            shape: SHAPES[answers.length],
          })
        }
        return { ...q, answers }
      })
      setQuiz((prev) => ({ ...prev, questions: newQuestions }))
    }
    setQuizType(newType)
  }

  const handleImport = () => {
    setShowJsonMenu(false)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          const imported = importFromJSON(data)
          setQuiz(imported)
          if (imported.questions.length > 0) {
            setQuizType(imported.questions[0].answers.length === 2 ? 'truefalse' : 'quiz')
          }
        } catch (err) {
          alert('Ошибка импорта: ' + (err as Error).message)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleExport = () => {
    setShowJsonMenu(false)
    const json = exportToJSON(quiz)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${quiz.title || 'quiz'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="quiz-builder">
      <div className="builder-header">
        <button className="btn btn-secondary" onClick={onBack}>← Назад</button>
        <h2>{quizId ? 'Редактировать квиз' : 'Создать квиз'}</h2>
        <div className="json-menu-wrapper" ref={jsonRef}>
          <button className="btn btn-secondary" onClick={() => setShowJsonMenu(!showJsonMenu)}>
            JSON ▾
          </button>
          {showJsonMenu && (
            <div className="json-dropdown">
              <button className="json-dropdown-item" onClick={handleImport}>Импорт JSON</button>
              <button className="json-dropdown-item" onClick={handleExport}>Экспорт JSON</button>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={save}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Сохранить
        </button>
      </div>

      <div className="builder-meta">
        <input
          type="text"
          placeholder="Название квиза"
          value={quiz.title}
          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Описание"
          value={quiz.description}
          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
        />
        <div className="quiz-type-toggle">
          <button
            className={`btn-type ${quizType === 'quiz' ? 'active' : ''}`}
            onClick={() => changeQuizType('quiz')}
          >
            △◇ Викторина
          </button>
          <button
            className={`btn-type ${quizType === 'truefalse' ? 'active' : ''}`}
            onClick={() => changeQuizType('truefalse')}
          >
            ✓✗ Правда/Ложь
          </button>
        </div>
      </div>

      <div className="questions-list">
        {quiz.questions.map((q, qi) => (
          <div key={q.id} className="question-card">
            <div className="question-top">
              <span className="q-number">Вопрос {qi + 1}</span>
              <button className="btn btn-danger-sm" onClick={() => removeQuestion(qi)}>✕</button>
            </div>
            <input
              type="text"
              placeholder="Текст вопроса"
              value={q.text}
              onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
              className="q-text-input"
            />
            <div className="q-options">
              <label>
                Время: {q.time_seconds}с
                <input
                  type="range"
                  min={5}
                  max={120}
                  value={q.time_seconds}
                  onChange={(e) => updateQuestion(qi, 'time_seconds', Number(e.target.value))}
                />
              </label>
              <label>
                Очки: {q.points}
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={100}
                  value={q.points}
                  onChange={(e) => updateQuestion(qi, 'points', Number(e.target.value))}
                />
              </label>
            </div>
            <div className="answers-grid">
              {q.answers.map((a, ai) => (
                <div
                  key={a.id}
                  className={`answer-item ${a.is_correct ? 'correct' : ''}`}
                  style={{ borderColor: COLORS[ai] }}
                >
                  <div className="answer-header">
                    <span className="shape-icon">{SHAPE_SYMBOLS[ai]}</span>
                    <input
                      type="text"
                      placeholder={`Ответ ${ai + 1}`}
                      value={a.text}
                      onChange={(e) => updateAnswer(qi, ai, 'text', e.target.value)}
                    />
                    <button
                      className={`btn-radio ${a.is_correct ? 'selected' : ''}`}
                      onClick={() => setCorrect(qi, ai)}
                      title="Правильный ответ"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary add-question-btn" onClick={addQuestion}>
        + Добавить вопрос
      </button>
    </div>
  )
}
