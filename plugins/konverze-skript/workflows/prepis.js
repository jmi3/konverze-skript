export const meta = {
  name: 'prepis',
  description: 'Věrný přepis kapitol ručně psaných skript (sken → Markdown+LaTeX) stránku po stránce s nezávislou verifikací',
  phases: [
    { title: 'Přepis', detail: 'stránka po stránce, sekvenčně v rámci kapitoly, s návazností na předchozí stránku' },
    { title: 'Verifikace', detail: 'nezávislá kontrola každé stránky proti skenu' },
  ],
}

// Vstup (args):
//   konvence  absolutní cesta ke KONVENCE.md předmětu
//   scratch   absolutní cesta ke složce pro pracovní výřezy
//   python    interpret s PyMuPDF a Pillow (typicky .venv projektu)
//   popis     jedna věta o pramenu, např. „ručně psané české poznámky k přednášce o teorii grup (NTMF061)“
//   kapitoly  [{ id, dir, title, pages }]; dir obsahuje pages/page-NN.png, přepisy jdou do transcripts/
//   davka     počet souběžně zpracovávaných kapitol (výchozí 3)
//   model, modelVerifikace   výchozí 'opus'
const A = args || {}
for (const k of ['konvence', 'scratch', 'python', 'popis', 'kapitoly']) {
  if (!A[k]) throw new Error('Chybí args.' + k + ' (viz hlavička skriptu prepis.js)')
}
const DAVKA = A.davka || 3
const MODEL = A.model || 'opus'
const MODEL_VERIF = A.modelVerifikace || 'opus'

function join(dir, ...parts) {
  const sep = dir.includes('\\') ? '\\' : '/'
  return [dir.replace(/[\\/]+$/, ''), ...parts].join(sep)
}

const TR_SCHEMA = {
  type: 'object',
  properties: {
    tail: { type: 'string', description: 'Posledních ~10 řádků přepisu, doslova (pro návaznost další stránky)' },
    figures: { type: 'array', items: { type: 'string' }, description: 'Za každý obrázek jeden řádek: název souboru, stručný popis, fig-bbox. Prázdné pole = žádné obrázky.' },
    uncertainties: { type: 'array', items: { type: 'string' }, description: 'Místa nejistoty: co a proč. Prázdné pole = bez nejistot.' },
  },
  required: ['tail', 'figures', 'uncertainties'],
}

function transcribePrompt(ch, pp, tail) {
  const img = join(ch.dir, 'pages', 'page-' + pp + '.png')
  const out = join(ch.dir, 'transcripts', 'page-' + pp + '.md')
  let p = 'Jsi precizní přepisovač ručně psaných matematických poznámek. Tvým úkolem je věrně přepsat JEDNU stránku skenu do Markdownu s LaTeX matematikou.\n\n'
  p += 'Postup:\n'
  p += '1. Přečti si konvence přepisu: ' + A.konvence + ' — řiď se jimi doslova.\n'
  p += '2. Přečti si obrázek stránky: ' + img + '\n'
  p += '3. Pokud si u některého místa nejsi jistý symbolem či slovem, vyřízni si detail pomocí Pythonu (' + A.python + ', PIL a PyMuPDF jsou nainstalované), ulož ho do ' + A.scratch + ' a znovu ho přečti nástrojem Read. Dělej to aktivně — přesnost je priorita. DŮLEŽITÉ: každý výřez ukládej pod unikátním názvem začínajícím "' + ch.id + '-p' + pp + '-", nikdy nepřepisuj existující název jiným obsahem.\n'
  p += '4. Zapiš věrný přepis celé stránky do souboru ' + out + ' (nástroj Write).\n\n'
  p += 'Kontext: Jde o stranu ' + pp + ' (z ' + ch.pages + ') kapitoly „' + ch.title + '“. Pramen: ' + A.popis + '\n\n'
  if (tail) {
    p += 'Přepis předchozí stránky končí takto (plynule navaž, věta/rovnice může pokračovat přes zlom stránky):\n\n```\n' + tail + '\n```\n\n'
  } else {
    p += 'Je to první strana kapitoly (nebo předchozí strana selhala), žádná návaznost na předchozí text.\n\n'
  }
  p += 'KRITICKÉ: Věrnost nade vše. Nic neopravuj, nic nedomýšlej, chyby originálu zachovej, nečitelné označ [nečitelné]. Přepiš úplně všechno na stránce včetně poznámek na okrajích. U obrázků uváděj fig-bbox podle skutečných hranic kresby (s malou rezervou, ne přehnaně velkoryse).\n\n'
  p += 'Na závěr vrať strukturovaný výstup: tail = posledních ~10 řádků svého přepisu doslova; figures = seznam obrázků (název + popis + bbox), prázdný pokud žádné; uncertainties = seznam nejistých míst, prázdný pokud žádná.'
  return p
}

function verifyPrompt(ch, pp) {
  const img = join(ch.dir, 'pages', 'page-' + pp + '.png')
  const tr = join(ch.dir, 'transcripts', 'page-' + pp + '.md')
  let p = 'Jsi nezávislý verifikátor přepisu ručně psaných matematických poznámek. Nepřepisuješ — hledáš rozdíly mezi skenem a hotovým přepisem.\n\n'
  p += 'Podklady:\n- Konvence přepisu: ' + A.konvence + '\n- Sken stránky: ' + img + '\n- Přepis k ověření: ' + tr + '\n\n'
  p += 'Postup:\n'
  p += '1. Přečti konvence, přepis a sken.\n'
  p += '2. Projdi sken shora dolů blok po bloku a u každého bloku ověř, že v přepisu existuje, je na správném místě a souhlasí doslova (text, symboly, indexy, meze sum/integrálů, znaménka).\n'
  p += '3. Hledej hlavně: (a) vynechané řádky či poznámky na okraji, (b) text/rovnice v přepisu, které na skenu NEJSOU (halucinace), (c) přehozené pořadí, (d) špatně přečtené symboly. U podezřelých míst si vyřízni detail skenu pomocí Pythonu (' + A.python + ', PIL) do ' + A.scratch + ' a přečti ho nástrojem Read zblízka. DŮLEŽITÉ: výřezy ukládej pod unikátními názvy začínajícími "verif-' + ch.id + '-p' + pp + '-".\n'
  p += '4. POUZE potvrzené rozdíly oprav přímo v přepisu nástrojem Edit. Kosmetické/stylové rozdíly (jiná ekvivalentní LaTeX sazba) NEOPRAVUJ. Jazykově neopravuj nic, co autor skutečně napsal (pravopis, tvary slov, zkratky). Přeškrtnutý či přepsaný symbol není negace (≥ přeškrtnuté jako oprava ≠ \\ngeq): nejasné místo ohlas, neinterpretuj. Zkontroluj také, že přepis neobsahuje &nbsp; a že víceřádková matematika je v $$...$$ blocích. Pokud si opravou nejsi jistý, neopravuj a jen ohlas.\n'
  p += '5. Pokud stránka obsahuje obrázkové reference s fig-bbox, u každé ověř, že bbox pokrývá skutečnou kresbu (celou, s malou rezervou, bez okolního textu) a případně ho uprav.\n\n'
  p += 'Na závěr vrať strukturovaný výstup: opravy = provedené opravy (co → na co, proč); podezreni = neopravená podezření (místo, co a proč). Prázdná pole znamenají, že přepis odpovídá skenu.'
  return p
}

const VERIF_SCHEMA = {
  type: 'object',
  properties: {
    opravy: { type: 'array', items: { type: 'string' } },
    podezreni: { type: 'array', items: { type: 'string' } },
  },
  required: ['opravy', 'podezreni'],
}

async function transcribeWithRetry(ch, pp, tail) {
  const opts = { label: 'prepis:' + ch.id + '-p' + pp, phase: 'Přepis', model: MODEL, schema: TR_SCHEMA }
  let r = null
  try { r = await agent(transcribePrompt(ch, pp, tail), opts) } catch (e) { r = null }
  if (!r) {
    log(ch.id + ' str. ' + pp + ': přepis selhal, zkouším znovu')
    try { r = await agent(transcribePrompt(ch, pp, tail), { ...opts, label: opts.label + '-retry' }) } catch (e) { r = null }
  }
  return r
}

async function processChapter(ch) {
  let tail = ''
  const verifies = []
  const pagesNotes = []
  const failedPages = []
  for (let p = 1; p <= ch.pages; p++) {
    const pp = p < 10 ? '0' + p : String(p)
    const r = await transcribeWithRetry(ch, pp, tail)
    if (!r) {
      failedPages.push(p)
      tail = ''
      log(ch.id + ': strana ' + pp + ' SELHALA i po retry — pokračuji další stranou bez návaznosti')
      continue
    }
    tail = r.tail
    pagesNotes.push({ page: p, figures: r.figures, uncertainties: r.uncertainties })
    // Verifikace běží souběžně s přepisem dalších stran kapitoly.
    verifies.push(
      agent(verifyPrompt(ch, pp), { label: 'verif:' + ch.id + '-p' + pp, phase: 'Verifikace', model: MODEL_VERIF, schema: VERIF_SCHEMA })
        .then(v => ({ page: p, report: v }))
        .catch(e => ({ page: p, report: 'VERIFIKACE SELHALA: ' + e }))
    )
    log(ch.id + ': přepsáno ' + p + '/' + ch.pages)
  }
  const verifyReports = await Promise.all(verifies)
  return { chapter: ch.id, failedPages, pagesNotes, verifyReports }
}

const results = []
const nDavek = Math.ceil(A.kapitoly.length / DAVKA)
for (let i = 0; i < A.kapitoly.length; i += DAVKA) {
  const batch = A.kapitoly.slice(i, i + DAVKA)
  log('Dávka ' + (Math.floor(i / DAVKA) + 1) + '/' + nDavek + ': ' + batch.map(c => c.id).join(', '))
  const rs = await parallel(batch.map(ch => () => processChapter(ch)))
  results.push(...rs.filter(Boolean))
}
const summary = results.map(r => ({
  chapter: r.chapter,
  failedPages: r.failedPages,
  pagesDone: r.pagesNotes.length,
  figures: r.pagesNotes.flatMap(n => n.figures),
  nejistoty: r.pagesNotes.reduce((s, n) => s + n.uncertainties.length, 0),
  podezreni: r.verifyReports.reduce((s, v) => s + ((v.report && v.report.podezreni) ? v.report.podezreni.length : 0), 0),
}))
log('Hotovo: ' + JSON.stringify(summary.map(s => s.chapter + ':' + s.pagesDone)))
return { summary, details: results }
