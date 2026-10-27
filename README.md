# Konverze skript

Plugin pro Claude Code, který převádí skeny ručně psaných přednáškových poznámek
na věrný přepis (Markdown + LaTeX) a na sázenou knihu (LaTeX, třída `book` s amsthm).

Postup vznikl při převodu skript NTMF057 (Počítačové metody v teoretické fyzice I,
98 stran rukopisu → kniha o 129 stranách).

## Obsah

```
.claude-plugin/marketplace.json      katalog (repozitář slouží zároveň jako marketplace)
plugins/konverze-skript/
├── .claude-plugin/plugin.json
├── skills/konverze-skript/
│   ├── SKILL.md                     řídicí postup: inventura → přepis → kniha
│   ├── references/                  konvence přepisu, postupy fází, pasti
│   ├── scripts/                     render_pages.py, kontrola_prepisu.py, crop_figures.py,
│   │                                assemble.py, requirements.txt
│   └── assets/kniha/                šablony knihy (main.tex, preamble.tex, test_kap.tex)
└── workflows/
    ├── prepis.js                    přepis a verifikace stránek (/konverze-skript:prepis)
    └── kniha.js                     kapitoly knihy a kontrola obsahu (/konverze-skript:kniha)
```

## Požadavky

- Claude Code s předplatným, které umožňuje workflow (model Opus).
- Python 3.11 nebo novější; balíčky ze `scripts/requirements.txt` se instalují do `.venv` projektu.
- TeX distribuce s `pdflatex` (MiKTeX nebo TeX Live) a balíčky `babel-czech`, `amsthm`, `hyperref`.

## Instalace

```bash
claude plugin marketplace add <URL tohoto repozitáře>
claude plugin install konverze-skript@konverze-skript
```

Uvnitř běžící session lze totéž provést příkazy `/plugin marketplace add …` a
`/plugin install konverze-skript@konverze-skript`. Pro vývoj stačí lokální cesta
ke klonu místo URL.

## Použití

V projektu se skeny stačí zadat úlohu, např. „převeď skripta ve složce X“, nebo
skill vyvolat přímo: `/konverze-skript:konverze-skript`. Skill nejprve provede
inventuru, předloží odhad nákladů a otázky k rozhodnutí a teprve po schválení
spouští přepis pilotní kapitoly.

## Náklady

Přepis s verifikací modelem Opus stojí řádově 150 tisíc tokenů na stránku rukopisu.
Předmět o 100 stranách tedy spotřebuje desítky milionů tokenů a typicky narazí
na pětihodinový limit předplatného; workflow po obnovení limitu pokračuje.
