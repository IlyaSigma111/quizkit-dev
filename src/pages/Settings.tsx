import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

type AppSettings = {
  default_mode: string
  default_advance: string
  default_time_seconds: number
  default_points: number
  theme: string
}

type Props = {
  onBack: () => void
  onThemeChange: (theme: string) => void
}

const MODES = [
  { value: 'test', label: 'Проверочная работа', icon: '📝', desc: 'Каждый в своём темпе' },
  { value: 'live', label: 'Викторина', icon: '🎯', desc: 'Все одновременно на время' },
]

const ADVANCES = [
  { value: 'auto', label: 'Автоматически', icon: '⏱️', desc: 'Таймер по умолчанию' },
  { value: 'manual', label: 'Вручную', icon: '👆', desc: 'Учитель переключает вопросы' },
]

const THEMES = [
  { value: 'spline', label: 'Spline Dark', icon: '🌙', desc: 'Минималистичный тёмный' },
  { value: 'purple', label: 'Пурпурное стекло', icon: '🔮', desc: 'Тёмный с фиолетовым акцентом' },
  { value: 'ocean', label: 'Океан', icon: '🌊', desc: 'Синяя глубина' },
  { value: 'forest', label: 'Лес', icon: '🌿', desc: 'Зелёный спокойный' },
  { value: 'sunset', label: 'Закат', icon: '🌅', desc: 'Тёплый оранжевый' },
]

export function Settings({ onBack, onThemeChange }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    invoke<AppSettings>('get_settings').then(setSettings).catch(console.error)
  }, [])

  const update = (patch: Partial<AppSettings>) => {
    if (!settings) return
    setSettings({ ...settings, ...patch })
    setSaved(false)
  }

  const handleSave = async () => {
    if (!settings) return
    try {
      await invoke('save_settings', { settings })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError('' + e)
    }
  }

  if (!settings) return <div className="settings-page"><div className="settings-loading">Загрузка...</div></div>

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="btn btn-secondary" onClick={onBack}>← Назад</button>
        <h2>⚙️ Настройки</h2>
        <div style={{ flex: 1 }} />
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <h3>Режим по умолчанию</h3>
          <div className="settings-row">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={`settings-card ${settings.default_mode === m.value ? 'selected' : ''}`}
                onClick={() => update({ default_mode: m.value })}
              >
                <span className="settings-card-icon">{m.icon}</span>
                <span className="settings-card-title">{m.label}</span>
                <span className="settings-card-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Переключение вопросов</h3>
          <div className="settings-row">
            {ADVANCES.map((a) => (
              <button
                key={a.value}
                className={`settings-card ${settings.default_advance === a.value ? 'selected' : ''}`}
                onClick={() => update({ default_advance: a.value })}
              >
                <span className="settings-card-icon">{a.icon}</span>
                <span className="settings-card-title">{a.label}</span>
                <span className="settings-card-desc">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Тема оформления</h3>
          <div className="settings-row settings-themes">
            {THEMES.map((t) => (
              <button
                key={t.value}
                className={`settings-card theme-card theme-card-${t.value} ${settings.theme === t.value ? 'selected' : ''}`}
                onClick={() => {
                  update({ theme: t.value })
                  onThemeChange(t.value)
                  const newSettings = { ...settings, theme: t.value }
                  invoke('save_settings', { settings: newSettings }).catch(() => {})
                }}
              >
                <span className="settings-card-icon">{t.icon}</span>
                <span className="settings-card-title">{t.label}</span>
                <span className="settings-card-desc">{t.desc}</span>
                <span className="theme-swatch" />
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Значения по умолчанию</h3>
          <div className="settings-defaults">
            <label>
              <span>Время на вопрос (сек)</span>
              <input
                type="number"
                min={5}
                max={300}
                value={settings.default_time_seconds}
                onChange={(e) => update({ default_time_seconds: Math.max(5, +e.target.value || 5) })}
              />
            </label>
            <label>
              <span>Баллы за вопрос</span>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.default_points}
                onChange={(e) => update({ default_points: Math.max(1, +e.target.value || 1) })}
              />
            </label>
          </div>
        </div>

        {error && <div className="settings-error">{error}</div>}

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? '✓ Сохранено' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  )
}
