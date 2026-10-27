# Konvence přepisu ručně psaných poznámek

<!-- Obecná šablona. Pro každý předmět se kopíruje do <predmet>/KONVENCE.md a po pilotní
     kapitole doplňuje o zvyklosti konkrétního autora (oddíl „Zvyklosti autora“). -->

## Základní princip: věrnost

- Přepisuj **1:1 to, co je na stránce**. Nic nedoplňuj, nic neopravuj, nic nevynechávej.
- Chyby v originále (překlepy, chybějící čárky, chyby v matematice) **přepiš i s chybami**.
- Zachovej česko-anglický mix přesně jak je (např. „floating-point arithmetic", „unit roundoff").
- Zachovej zkratky autora beze změny: `tzv.`, `pozn.`, `lib.`, `atd.`, `tj.`, `např.`, `modif.` apod.
- Zachovej pořadí prvků na stránce shora dolů. Poznámka na okraji patří k bloku, u kterého je napsaná.
- Co nedokážeš přečíst, označ `[nečitelné]`, případně `[nečitelné: snad „X"]`. **Nikdy tiše nehádej.**
- Nepřidávej vlastní nadpisy, číslování ani strukturu, která v originále není.
- Nepřidávej vlastní vysvětlující vsuvky do textu (např. „(šipka směřuje k …)“); hranaté závorky
  patří jen značkám z této konvence (`[nečitelné]`, `[na okraji]`, `[v rámečku]`, `[svorka …]`).
- Čísla stránek (včetně kroužkovaných) a záhlaví skenu se nepřepisují.

## Formát výstupu: Markdown + LaTeX matematika

- Inline matematika: `$...$`. Samostatné (display) rovnice: `$$...$$`.
- Vícerovnicové bloky (např. algoritmy, odvození pod sebou): `$$\begin{aligned} ... \end{aligned}$$` se zarovnáním `&` tam, kde je originál zjevně zarovnává. `aligned` nikdy do inline `$…$`.
- Slova uvnitř matematických bloků: `\text{...}` (např. `\text{pro } j = 1, \dots, n`).
- Symboly: šipky `\Rightarrow`, `\to`, přibližnost `\approx`, náleží `\in`, normy `\|q\|_2`; značení autora zachovej (píše-li transpozici křížkem, použij `q^\dagger`).
- Zlomky, indexy, sumy, integrály standardním LaTeXem. U `array` musí počet sloupců v hlavičce odpovídat obsahu.
- Matematické symboly (šipky, řecká písmena, ≤, ≈, ◥ …) piš **vždy jako LaTeX v `$…$`**, nikdy jako doslovné Unicode znaky v textu.
- Pro vodorovné odsazení nikdy nepoužívej `&nbsp;` — uvnitř matematiky `\quad`/`\qquad`, v textu obyčejné mezery. Vizuální zarovnání sloupců netlač do textu.
- Řádek mimo seznam nikdy neodsazuj o 4 a více mezer (Markdown z něj udělá blok kódu). Pokračovací řádky odrážek odsazuj jen o úroveň odrážky.

## Struktura a typografie originálu

- Podtržený nadpis nebo podtržený termín → **tučně**.
- Odrážky (`•`, `-`) → markdownové odrážky, zachovej hierarchii odsazení.
- Číslované body `1)`, `2)` → přepiš jako `1)`, `2)` (ne markdownové `1.`, aby zůstal styl autora).
- Text v rámečku → blockquote začínající `> **[v rámečku]**`.
- Poznámka na okraji (typicky vlevo, menším písmem, kolmo k textu apod.) → samostatný řádek
  `> [na okraji] přesný přepis poznámky` umístěný bezprostředně před blok, ke kterému se vztahuje.
- Svorka `{`/`}` sdružující více řádků s komentářem po straně → rovnice do `aligned` bloku a hned pod něj
  kurzívou: `*[svorka u řádků: přesný přepis komentáře]*`.
- Vlnovky, podtržení ve významu zdůraznění uvnitř věty → **tučně**.
- Škrtnutý text: vynech, ale poznamenej `<!-- škrtnuto: ... -->`, pokud je čitelný.
- Přeškrtnutý nebo přepsaný symbol je oprava autora, ne negace: přepiš platnou (výslednou) variantu,
  nejasný případ označ `[nečitelné: …]` a uveď mezi nejistotami.

## Obrázky, grafy, diagramy

- **Nepřekresluj.** Na místo obrázku vlož:

```
![obrázek](figures/page-NN-fig-M.png)
*Obrázek: stručný věcný popis toho, co je nakresleno (1–2 věty). Přepiš všechny popisky/osy/symboly v obrázku.*
<!-- fig-bbox: x0,y0,x1,y1 -->
```

- `NN` = číslo stránky, `M` = pořadí obrázku na stránce (od 1).
- `fig-bbox` jsou souřadnice výřezu v **procentech stránky** (levý horní roh x0,y0; pravý dolní x1,y1), např. `<!-- fig-bbox: 10,35,85,60 -->`. Ber je podle skutečných hranic kresby s malou rezervou: nic se nesmí useknout, ale výřez nemá zabírat okolní text.
- V popisu obrázku uváděj jen to, co je vidět (směr šipek, počet křivek a popisky ověř dvakrát).
- Obrázkem se myslí skutečná kresba/graf/schéma. Rovnice, tabulky a bitová schémata z rámečků přepisuj textově, pokud to jde věrně; jinak také jako obrázek.

## Kontinuita mezi stránkami

- Dostaneš-li konec přepisu předchozí stránky, plynule navaž — věta či rovnice může pokračovat přes zlom stránky. Nezačínej v takovém případě novou odrážkou ani nadpisem.
- Neukončuj stránku žádným oddělovačem ani poznámkou o konci stránky.

## Zvyklosti autora (doplňuje se po pilotu)

- Diakritika: {{doplňovat zjevně chybějící čárky a háčky, nebo přepisovat doslova? rozhodnutí uživatele}}
- …
