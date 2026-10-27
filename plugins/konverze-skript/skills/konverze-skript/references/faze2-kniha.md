# Fáze 2: kniha

Cíl: konsolidovaná kniha `book` + amsmath + amsthm s českými prostředími, jedna kapitola
na zdrojové PDF. Obsah pochází jen z verifikovaného přepisu; próza se smí uhladit,
matematika zůstává doslova.

## Pravidla věrnosti (schválená u NTMF057)

- Telegrafické odrážky → plynulé věty; jednoznačné prozaické překlepy → spisovná čeština.
- Nejednoznačné zkomoleniny se neopravují: zůstanou a dostanou `% POZN. PŘEPISU`.
- Matematika (symboly, indexy, meze, znaménka) beze změny. Podezřelé místo originálu
  zůstane a nad vzorcem dostane `% POZN. PŘEPISU: …`.
- `[nečitelné]` → `\text{[nečitelné]}`.

## Výběr formátu

Výchozí styl je šablona `assets/kniha` (plain `book` + amsmath + amsthm). Jiný styl
(např. vlastní třída uživatele) jen na jeho přání, a to nejdřív jako náhled jedné
kapitoly, který uživatel schválí.

## Kostra

1. Zkopírovat `${CLAUDE_PLUGIN_ROOT}/skills/konverze-skript/assets/kniha/`
   (`main.tex`, `preamble.tex`, `test_kap.tex`) do `<predmet>/kniha/` a vyplnit `{{…}}`.
   `main.tex`: `\chapter{…}` + `\input{kapitoly/<id>}` v pořadí, které schválil uživatel.
2. Obrázky: `prepis/kap_<id>/output/figures/*.png` → `kniha/figs/k<id>/`.
3. Stylová reference: jedna kapitola (nejlépe pilotní) přeformátovaná ručně nebo jedním
   agentem a schválená uživatelem → `kniha/kapitoly/<id>.tex`.
4. Vlastní makra potřebná v kapitolách patří do `preamble.tex`, ne do kapitol.

## Spuštění workflow

Workflow `konverze-skript:kniha` (`${CLAUDE_PLUGIN_ROOT}/workflows/kniha.js`), args:

```json
{
  "kniha": "<abs>/<predmet>/kniha",
  "reference": "<abs>/<predmet>/kniha/kapitoly/03.tex",
  "davka": 6,
  "model": "opus",
  "kapitoly": [
    { "id": "01", "fig": "k01", "src": "<abs>/<predmet>/prepis/kap_01/output/01.md", "title": "<název>" }
  ]
}
```

Referenční kapitolu do seznamu nedávat. Každý agent kapitolu sám zkušebně přeloží přes
`test_kap.tex` a smí měnit jen svůj soubor. Druhá fáze workflow (kontrola obsahu)
porovná matematiku přepisu a TeXu a nic neopravuje; `kontrola: false` ji vypne.

## Po workflow

1. Projít `notes` (opravená slova „původní → nové“, POZN. PŘEPISU) a výstupy kontroly;
   rizikové slovní opravy a rozdíly v matematice předložit uživateli.
2. Celá kniha: `pdflatex -interaction=nonstopmode main.tex` 3× (obsah, pak reference).
3. Ověřit: 0 × `LaTeX Warning: Reference .* undefined` v `main.log`, počet stran, žádné
   `Missing character`. Vedlejší soubory `test_*` smazat.
4. Bitmapové fonty: hlásí-li MiKTeX generování `*.600gf`, chybí `cm-super`; řešením je
   instalace `cm-super` nebo `\usepackage{lmodern}` v preambuli (nevyzkoušeno, ověřit).
