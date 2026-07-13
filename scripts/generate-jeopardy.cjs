const fs = require('fs')
const path = require('path')

const themesPath = path.join(__dirname, 'data', 'jeopardy-themes.json')
const existingPath = path.join(__dirname, '..', 'public', 'templates.json')

let existing = []
try {
  if (fs.existsSync(existingPath)) {
    const raw = fs.readFileSync(existingPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed.templates) existing = parsed.templates
  }
} catch (e) {
  console.log('No existing templates.json, creating new')
}

const raw = fs.readFileSync(themesPath, 'utf-8')
const data = JSON.parse(raw)

const jeopardyTemplates = data.games.map(g => {
  const categories = g.cats.map(cat => {
    const [name, emoji, ...rest] = cat
    const questions = rest.map(([points, text, answer]) => ({ points, text, answer }))
    return { name, emoji, questions }
  })

  const [finalText, finalAnswer] = g.final

  return {
    id: g.id,
    title: g.title,
    description: `Своя игра: ${g.title}`,
    emoji: g.emoji,
    tag: 'Своя игра',
    category: 'Своя игра',
    type: 'jeopardy',
    total_time_seconds: 1200,
    categories,
    final_jeopardy: { text: finalText, answer: finalAnswer },
  }
})

// Remove old jeopardy entries with same IDs, then add new ones
const existingIds = new Set(jeopardyTemplates.map(t => t.id))
const filtered = existing.filter(t => !existingIds.has(t.id))
const merged = [...filtered, ...jeopardyTemplates]

const output = JSON.stringify({ templates: merged }, null, 2)
fs.writeFileSync(existingPath, output, 'utf-8')
console.log(`Generated ${jeopardyTemplates.length} jeopardy templates (total: ${merged.length}) → public/templates.json`)
