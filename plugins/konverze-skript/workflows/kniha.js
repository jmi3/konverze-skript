export const meta = {
  name: 'kniha',
  description: 'Kniha: verifikované přepisy kapitol → TeXové kapitoly (book, amsthm) s testovacím překladem a kontrolou matematiky',
  phases: [
    { title: 'Reformát do TeXu', detail: 'jedna kapitola = jeden agent, s testovacím překladem' },
    { title: 'Kontrola obsahu', detail: 'nezávislé porovnání matematiky přepisu a TeXu, jen hlášení' },
  ],
}

// Vstup (args):
//   kniha      složka knihy (main.tex, preamble.tex, test_kap.tex, kapitoly/, figs/)
//   reference  hotová stylová referenční kapitola (např. <kniha>/kapitoly/03.tex z pilotu)
//   kapitoly   [{ id, fig, src, title }]; src = verifikovaný přepis kapitoly (.md)
//   davka      počet souběžných kapitol (výchozí 6)
//   kontrola   false vypne fázi kontroly obsahu (výchozí zapnuto)
//   model      výchozí 'opus'
const A = args || {}
for (const k of ['kniha', 'reference', 'kapitoly']) {
  if (!A[k]) throw new Error('Chybí args.' + k + ' (viz hlavička skriptu kniha.js)')
}
const DAVKA = A.davka || 6
const MODEL = A.model || 'opus'
const KONTROLA = A.kontrola !== false

function join(dir, ...parts) {
  const sep = dir.includes('\\') ? '\\' : '/'
  return [dir.replace(/[\\/]+$/, ''), ...parts].join(sep)
}

function prompt(ch) {
  const kniha = A.kniha
  let p = 'Jsi zkušený autor matematických skript. Přeformátuj věrný přepis ručně psaných poznámek do TeXové kapitoly knihy v klasickém stylu amsmath + amsthm.\n\n'
  p += 'VSTUP (zdroj obsahu): ' + ch.src + ' — verifikovaný přepis kapitoly „' + ch.title + '“ (Markdown + LaTeX matematika). Přečti si ho celý.\n\n'
  p += 'STYLOVÁ REFERENCE: přečti si hotovou kapitolu ' + A.reference + ' a preambuli ' + join(kniha, 'preamble.tex') + ' — piš přesně v tomto duchu. K dispozici jsou česká amsthm prostředí veta, lemma, dusledek, definice, priklad, poznamka a standardní proof; \\uv{...} pro české uvozovky; graphicx, mathtools, booktabs.\n\n'
  p += 'VÝSTUP: zapiš soubor ' + join(kniha, 'kapitoly', ch.id + '.tex') + ' — tělo kapitoly (jen \\section/\\subsection a obsah, BEZ \\chapter, BEZ preambule a BEZ \\begin{document} — kapitolový nadpis dodává main.tex).\n\n'
  p += 'PRAVIDLA OBSAHU (zásadní):\n'
  p += '- Veškerý věcný a matematický obsah MUSÍ pocházet ze zdroje. Nic nedomýšlej, nepřidávej vlastní tvrzení, nic podstatného nevynechej (HTML komentáře <!-- strana N --> a fig-bbox metadata vynech; poznámky na okraji vpleť do textu nebo do prostředí poznamka).\n'
  p += '- Telegrafické odrážky přetav do plynulých, čtivých vět; krátké výčty můžou zůstat itemize/enumerate.\n'
  p += '- Prozaické překlepy originálu oprav na spisovnou češtinu, ale JEN jednoznačné. Připouští-li zkomolené slovo více čtení (např. „dlužitější“ = delší, nebo důležitější?), ponech původní tvar a označ ho komentářem `% POZN. PŘEPISU: ...`. Každou opravu slova uveď v notes ve tvaru „původní → nové“.\n'
  p += '- Matematiku (vzorce, meze, indexy, znaménka) zachovej PŘESNĚ. Matematicky podezřelá místa originálu zachovej a označ LaTeX komentářem `% POZN. PŘEPISU: ...` na řádku nad vzorcem. Značky [nečitelné] ze zdroje zachovej jako \\text{[nečitelné]}.\n'
  p += '- Rámečky s větami → prostředí veta s názvem v hranaté závorce; důkazy (Dk:) → proof; Př. → priklad, nebo prostý text, kde jde jen o drobnou ilustraci; Pozn → poznamka; definiční pasáže → definice.\n'
  p += '- Stěžejní/odkazované rovnice sázej v equation s \\label; vícerovnicové bloky v align*; markdownové tabulky převeď na tabular (booktabs). Značky (*) originálu převeď na \\label/\\eqref (různé významy = různé labely).\n'
  p += '- KAŽDÝ obrázek ze zdroje (![obrázek](figures/page-NN-fig-M.png)) převeď na: \\begin{figure}[htbp] \\centering \\includegraphics[width=0.55\\linewidth]{figs/' + ch.fig + '/page-NN-fig-M.png} \\caption{...} \\label{fig:' + ch.id + ':nazev} \\end{figure} — popisek z kurzívního textu zdroje, žádný obrázek nevynech. Obrázky existují v ' + join(kniha, 'figs', ch.fig) + '.\n'
  p += '- VŠECHNY labely prefixuj kapitolou: \\label{eq:' + ch.id + ':...}, \\label{fig:' + ch.id + ':...} atd., ascii snake_case.\n'
  p += '- Jednotkovou matici \\mathbb{1} (amsfonts nemá) sázej jako \\mathbf{1} a označ komentářem.\n\n'
  p += 'PRAVIDLA FORMY: každá věta na vlastní řádek ve zdrojáku; odstavec = prázdný řádek, ne \\\\; \\uv{...} místo uvozovek; ~ za jednopísmennými předložkami/spojkami; standardní česká matematická typografie.\n\n'
  p += 'TESTOVACÍ PŘEKLAD: po zapsání souboru spusť v adresáři knihy (nástroj Bash):\n'
  p += 'cd "' + kniha.replace(/\\/g, '/') + '" && pdflatex -interaction=nonstopmode -halt-on-error -jobname=test_' + ch.id + ' "\\\\def\\\\kapsoubor{kapitoly/' + ch.id + '}\\\\input{test_kap.tex}"\n'
  p += 'a oprav případné chyby SVÉHO souboru (preamble.tex, test_kap.tex ani jiné soubory neměň), dokud se kapitola nepřeloží.\n\n'
  p += 'Na závěr vrať strukturovaný výstup dle schématu.'
  return p
}

function checkPrompt(ch) {
  let p = 'Jsi nezávislý kontrolor. Kapitola „' + ch.title + '“ byla přeformátována z verifikovaného přepisu do TeXu knihy. Nic neopravuj, jen porovnej a ohlas.\n\n'
  p += 'Zdroj: ' + ch.src + '\nVýsledek: ' + join(A.kniha, 'kapitoly', ch.id + '.tex') + '\n\n'
  p += 'Úkol:\n'
  p += '1. Projdi zdroj od začátku do konce a ke každému vzorci (inline i display) najdi jeho protějšek v TeXu. Porovnej symboly, indexy, meze, znaménka, exponenty a počet členů. Čistě sazební rozdíly (\\frac vs \\tfrac, \\mathrm{d}, \\mathcal{O}, rozdělení dlouhého displeje na dva) ignoruj.\n'
  p += '2. Ověř, že v TeXu nechybí žádné tvrzení, věta, důkaz, poznámka ani obrázek zdroje a že nepřibylo nic, co ve zdroji není.\n'
  p += '3. Projdi slovní změny (opravy překlepů, přeformulování odrážek) a vypiš ty, které mohly posunout význam.\n\n'
  p += 'Vrať strukturovaný výstup: rozdíly v matematice (zdroj → TeX, místo), chybějící/přidaný obsah, rizikové slovní změny. Prázdná pole znamenají shodu.'
  return p
}

const SCHEMA = {
  type: 'object',
  properties: {
    compiled: { type: 'boolean', description: 'true pokud testovací překlad prošel' },
    pages: { type: 'number', description: 'počet stran testovacího PDF' },
    sections: { type: 'array', items: { type: 'string' } },
    notes: { type: 'array', items: { type: 'string' }, description: 'POZN. PŘEPISU komentáře, opravená slova („původní → nové“) a odchylky od zdroje' },
  },
  required: ['compiled', 'pages', 'sections', 'notes'],
}

const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    matematika: { type: 'array', items: { type: 'string' } },
    obsah: { type: 'array', items: { type: 'string' } },
    slova: { type: 'array', items: { type: 'string' } },
  },
  required: ['matematika', 'obsah', 'slova'],
}

const results = []
const nDavek = Math.ceil(A.kapitoly.length / DAVKA)
for (let i = 0; i < A.kapitoly.length; i += DAVKA) {
  const batch = A.kapitoly.slice(i, i + DAVKA)
  log('Dávka ' + (Math.floor(i / DAVKA) + 1) + '/' + nDavek + ': ' + batch.map(c => c.id).join(', '))
  const rs = await parallel(batch.map(ch => async () => {
    let r
    try {
      r = await agent(prompt(ch), { label: 'tex:' + ch.id, phase: 'Reformát do TeXu', model: MODEL, schema: SCHEMA })
    } catch (e) {
      return { id: ch.id, compiled: false, error: String(e) }
    }
    if (!r) return { id: ch.id, compiled: false, error: 'agent nevrátil výsledek' }
    const out = { id: ch.id, ...r }
    if (KONTROLA && r.compiled) {
      try {
        out.kontrola = await agent(checkPrompt(ch), { label: 'kontrola:' + ch.id, phase: 'Kontrola obsahu', model: MODEL, schema: CHECK_SCHEMA })
      } catch (e) {
        out.kontrola = { chyba: String(e) }
      }
    }
    return out
  }))
  results.push(...rs.filter(Boolean))
  log('Dávka hotova: ' + rs.filter(Boolean).map(r => r.id + (r.compiled ? ' OK' : ' CHYBA')).join(', '))
}
return results
