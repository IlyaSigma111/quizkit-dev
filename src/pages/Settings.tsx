import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

type AppSettings = {
  default_mode: string
  default_advance: string
  default_time_seconds: number
  default_points: number
  theme: string
  internet_check: boolean
}

type Props = {
  onBack: () => void
  onThemeChange: (theme: string) => void
}

const MODES = [
  { value: 'test', label: 'Проверочная работа', icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', desc: 'Каждый в своём темпе' },
  { value: 'live', label: 'Викторина', icon: '<polygon points="5 3 19 12 5 21 5 3"/>', desc: 'Все одновременно на время' },
]

const ADVANCES = [
  { value: 'auto', label: 'Автоматически', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', desc: 'Таймер по умолчанию' },
  { value: 'manual', label: 'Вручную', icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', desc: 'Учитель переключает вопросы' },
]

const THEMES = [
  { value: 'spline', label: 'Spline Dark', icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>', desc: 'Минималистичный тёмный' },
  { value: 'purple', label: 'Пурпурное стекло', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/>', desc: 'Тёмный с фиолетовым акцентом' },
  { value: 'ocean', label: 'Океан', icon: '<path d="M2 12h20"/><path d="M2 6h20"/><path d="M2 18h20"/>', desc: 'Синяя глубина' },
  { value: 'forest', label: 'Лес', icon: '<path d="M12 2L2 12l3 0 0 8 6 0 0-4 2 0 0 4 6 0 0-8 3 0z"/>', desc: 'Зелёный спокойный' },
  { value: 'sunset', label: 'Закат', icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>', desc: 'Тёплый оранжевый' },
  { value: 'rose', label: 'Роза', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2C6 2 2 6 2 12s4 10 10 10"/>', desc: 'Розово-коралловый' },
  { value: 'sky', label: 'Небо', icon: '<path d="M2 12h20"/><path d="M6 6h4"/><path d="M14 18h6"/>', desc: 'Голубой и свежий' },
  { value: 'violet', label: 'Фиалка', icon: '<polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9"/>', desc: 'Фиолетовый акцент' },
  { value: 'cyberpunk', label: 'Киберпанк', icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>', desc: 'Неон и контраст' },
  { value: 'aurora', label: 'Северное сияние', icon: '<path d="M2 12h20M6 6h12M10 18h4"/><path d="M4 8h16M8 16h8"/>', desc: 'Бирюзово-фиолетовый' },
  { value: 'midnight', label: 'Полночь', icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>', desc: 'Глубокий тёмно-синий' },
  { value: 'amber', label: 'Янтарь', icon: '<polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9"/>', desc: 'Тёплый золотой' },
  { value: 'mint', label: 'Мята', icon: '<path d="M12 2C6 2 2 6 2 12s4 10 10 10"/><path d="M8 12l3 3 5-5"/>', desc: 'Свежий зелёный' },
  { value: 'lavender', label: 'Лаванда', icon: '<path d="M12 2a10 10 0 0 1 10 10"/><path d="M2 12a10 10 0 0 1 10-10"/><path d="M12 22a10 10 0 0 1-10-10"/>', desc: 'Нежный фиолетовый' },
  { value: 'coral', label: 'Коралл', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/>', desc: 'Розово-коралловый' },
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
        <h2>Настройки</h2>
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
                <span className="settings-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" dangerouslySetInnerHTML={{ __html: m.icon }} />
                </span>
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
                <span className="settings-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" dangerouslySetInnerHTML={{ __html: a.icon }} />
                </span>
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
                <span className="settings-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" dangerouslySetInnerHTML={{ __html: t.icon }} />
                </span>
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
          <label className="internet-check-settings">
            <input
              type="checkbox"
              checked={settings.internet_check}
              onChange={(e) => update({ internet_check: e.target.checked })}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Обнаруживать мобильный интернет у учеников
          </label>
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
