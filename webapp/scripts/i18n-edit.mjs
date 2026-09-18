// Maintenance helper: add / update / remove message keys in BOTH dictionaries
// (src/lib/i18n/en.ts and vi.ts) with the TypeScript parser, so multi-line
// values and section comments survive.
//
//   node scripts/i18n-edit.mjs ops.json
//   ops.json: { "remove": ["exact.key", "prefix.*"],
//               "set": { "key": { "en": "…", "vi": "…" } } }
//   node scripts/i18n-edit.mjs --unused   # list keys never referenced in src/
//
// New keys are appended at the end of the object; the compiler enforces that
// vi.ts has exactly the keys of en.ts (Record<MessageKey, string>).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const FILES = { en: 'src/lib/i18n/en.ts', vi: 'src/lib/i18n/vi.ts' }

function dictionary(path) {
  const text = readFileSync(path, 'utf8')
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  let obj
  const visit = (node) => {
    if (!obj && ts.isObjectLiteralExpression(node) && node.properties.length > 50) obj = node
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!obj) throw new Error(`${path}: dictionary object not found`)
  const props = obj.properties.map((p) => ({
    key: p.name.text,
    // Remove the whole line(s) of the property including its trailing comma.
    start: text.lastIndexOf('\n', p.getStart(sf)) + 1,
    end: text.indexOf('\n', p.end) + 1,
  }))
  return { text, obj, props, sf }
}

function srcFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === 'i18n' ? [] : srcFiles(full)
    return /\.(tsx?|mjs)$/.test(name) ? [full] : []
  })
}

if (process.argv[2] === '--unused') {
  const { props } = dictionary(FILES.en)
  const code = srcFiles('src').map((f) => readFileSync(f, 'utf8')).join('\n')
  const unused = props.map((p) => p.key).filter((k) => !code.includes(`'${k}'`) && !code.includes(`"${k}"`))
  console.log(unused.join('\n'))
  process.exit(0)
}

const ops = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const matches = (key, pattern) => (pattern.endsWith('.*') ? key.startsWith(pattern.slice(0, -1)) : key === pattern)

for (const [lang, path] of Object.entries(FILES)) {
  const { text, obj, props } = dictionary(path)
  const set = ops.set ?? {}
  const drop = props.filter(
    (p) => (ops.remove ?? []).some((pat) => matches(p.key, pat)) || p.key in set,
  )
  let out = text
  // Insert new/updated keys just before the closing brace of the object.
  const closeLine = out.lastIndexOf('\n', obj.end - 1) + 1
  const additions = Object.entries(set)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v[lang])},\n`)
    .join('')
  out = out.slice(0, closeLine) + additions + out.slice(closeLine)
  for (const p of [...drop].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, p.start) + out.slice(p.end)
  }
  writeFileSync(path, out)
  console.log(`${path}: -${drop.length} +${Object.keys(set).length}`)
}
