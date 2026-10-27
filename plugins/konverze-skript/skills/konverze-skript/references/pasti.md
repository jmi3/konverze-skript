# Pasti zjištěné při převodu NTMF057

Každá položka: příznak → příčina → ošetření. Ošetřené v nástrojích jsou označeny (✓).

## Prostředí

- `pandoc` není v PATH → balíček `pypandoc_binary` dodává vlastní pandoc (✓ requirements.txt).
- Balíčky v systémovém Pythonu → vždy `.venv` projektu (`python -m venv .venv`,
  `.venv/Scripts/python -m pip install -r requirements.txt`; na Linuxu `.venv/bin/python`).
- Nástroj Read čte z PDF jen několik stran jako obrázky → obsah knihy nekontrolovat
  vizuálně přes PDF, ale porovnáním zdrojů (workflow `kniha`, fáze kontroly).

## Pandoc a pdflatex (assemble.py)

- `Missing $ inserted` ve víceřádkové matematice → pandoc vkládá prázdné řádky do
  `$$…$$` → bloky se schovají za placeholder a vloží doslova jako `\[…\]` (✓).
- `Undefined control sequence \pandocbounded` → nový pandoc → `\providecommand` v preambuli (✓).
- `Argument of \language@active@arg" has an extra }` → babel `czech` dělá z `"` aktivní
  znak → `\shorthandoff{"}` (✓).
- `\begin{verbatim}` v TeXu → řádek přepisu odsazený o 4+ mezer vůči obsahu → oprava
  v přepisu; hledá `kontrola_prepisu.py` předem a `assemble.py` hlásí potom (✓).
- `Unicode character … not set up for use with LaTeX` → doslovné šipky a řecká písmena
  v textu → konvence je zakazuje, `kontrola_prepisu.py` je najde, preambule má pojistné
  `\DeclareUnicodeCharacter` (✓).
- `Paragraph ended before \LT@array was complete` → na Windows `\r\n` z pandocu zapsané
  jako `\r\r\n` → normalizace na LF a zápis s `newline="\n"` (✓).
- `Environment longtable undefined`, `No counter 'none' defined`, `Missing number` u šířek
  sloupců → balíčky `longtable,booktabs,array,calc` a `\newcounter{none}` (pandoc ≥ 3.2
  se starším longtable) (✓).

## Agenti a workflow

- Výpadek spojení zastavil celou kapitolu a zahodil hotové reporty verifikací → retry,
  pokračování bez návaznosti, `.catch` u verifikací (✓ prepis.js).
- Verifikátor dostal výřez jiné stránky → unikátní prefixy názvů výřezů (✓ prompty).
- Verifikátor vyložil přeškrtnutí jako negaci (`\geq` → `\ngeq`) a „opravil“ autorův
  pravopis → výslovný zákaz v promptu verifikace a v konvenci (✓).
- Nejistoty přepisovačů a podezření verifikátorů nikdo nečetl → povinná triáž (SKILL.md).
- fig-bbox „velkoryse“ → výřezy s okolním textem; nejčastější oprava verifikace
  → „podle hranic kresby s malou rezervou“ (✓ konvence). U překrývajících se kreseb čistý
  obdélník neexistuje; ponechat, hlásit.
- Pětihodinový limit shodil 12 ze 14 agentů knihy a workflow skončil jako „completed“
  → vždy číst blok selhání ve výsledku; navázat přes `resumeFromRunId` bez změny promptů.
- Kniha se kontrolovala jen překladem a „opravy překlepů“ vnesly odhady
  („dlužitější“ → „delší“) → fáze kontroly obsahu a výpis opravených slov (✓ kniha.js).
- Absolutní cesty natvrdo ve workflow → parametry `args` (✓).
