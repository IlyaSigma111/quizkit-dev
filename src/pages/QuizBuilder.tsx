import { useState, useEffect } from 'react'
import type { Quiz, Question, Answer } from '../App'
import { invoke } from '@tauri-apps/api/core'

type Props = {
  quizId: string | null
  onBack: () => void
}

const COLORS = ['#FF4444', '#4488FF', '#FFBB33', '#44CC44']
const SHAPES = ['triangle', 'diamond', 'circle', 'star']
const COLOR_NAMES = ['red', 'blue', 'yellow', 'green']

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function QuizBuilder({ quizId, onBack }: Props) {
  const [quiz, setQuiz] = useState<Quiz>({
    id: quizId || makeId(),
    title: '',
    description: '',
    questions: [],
    created_at: String(Date.now()),
  })

  useEffect(() => {
    if (quizId) {
      invoke<Quiz | null>('get_quiz', { id: quizId }).then((q) => {
        if (q) setQuiz(q)
      })
    }
  }, [quizId])

  const save = () => {
    invoke('save_quiz', { quiz }).then(() => {
      alert('Сохранено!')
      onBack()
    }).catch(console.error)
  }

  const addQuestion = () => {
    const q: Question = {
      id: makeId(),
      text: '',
      time_seconds: 20,
      points: 1000,
      answers: [
        { id: makeId(), text: '', is_correct: true, color: COLOR_NAMES[0], shape: SHAPES[0] },
        { id: makeId(), text: '', is_correct: false, color: COLOR_NAMES[1], shape: SHAPES[1] },
        { id: makeId(), text: '', is_correct: false, color: COLOR_NAMES[2], shape: SHAPES[2] },
        { id: makeId(), text: '', is_correct: false, color: COLOR_NAMES[3], shape: SHAPES[3] },
      ],
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

  return (
    <div className="quiz-builder">
      <div className="builder-header">
        <button className="btn btn-secondary" onClick={onBack}>← Назад</button>
        <h2>{quizId ? 'Редактировать квиз' : 'Создать квиз'}</h2>
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
                    <span className="shape-icon">{['△', '◇', '○', '☆'][ai]}</span>
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
