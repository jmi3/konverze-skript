---
name: konverze-skript
description: Převod naskenovaných ručně psaných přednáškových poznámek (PDF bez textové vrstvy) na věrný přepis v Markdownu a LaTeXu a na sázenou knihu (LaTeX book, amsthm). Použít, když uživatel chce přepsat, zdigitalizovat nebo převést skripta, rukopisné poznámky či skeny přednášek do Markdownu, TeXu nebo PDF knihy, nebo navázat na rozpracovaný převod předmětu.
---

# Konverze ručně psaných skript

Postup ověřený na NTMF057 (98 stran rukopisu → kniha o 129 stranách).
Výstupem jsou výhradně soubory Markdown a TeX (a z nich přeložená PDF).
Fáze mají vlastní reference; mezi fázemi vždy rozhoduje uživatel.

| Fáze | Výstup | Reference | Workflow |
|---|---|---|---|
| 0 Inventura | rozhodnutí, odhad nákladů | tento soubor | — |
| 1 Přepis | `prepis/kap_<id>/output/<id>.md/.tex/.pdf` | [faze1-prepis.md](references/faze1-prepis.md) | `konverze-skript:prepis` |
| 2 Kniha | `kniha/main.tex`, `kniha/main.pdf` | [faze2-kniha.md](references/faze2-kniha.md) | `konverze-skript:kniha` |

Kořen pluginu: `${CLAUDE_PLUGIN_ROOT}`. Zápis `${CLAUDE_PLUGIN_ROOT}` v referenčních
souborech znamená tuto cestu.

Známé pasti a jejich ošetření: [pasti.md](references/pasti.md). Obecná konvence přepisu:
[KONVENCE.md](references/KONVENCE.md); konvence projektu viz níže.

## Zásady

- **Věrnost nade vše.** Přepis nic neopravuje ani nedomýšlí; chyby originálu zůstávají,
  nečitelné je `[nečitelné]`. Kniha smí uhladit prózu, matematiku nikdy; podezřelá místa
  nesou `% POZN. PŘEPISU`.
- **Pilot před produkcí.** Nová konvence, nový autor nebo nový formát se nejdřív zkouší
  na jedné kapitole a uživatel ho schválí.
- **Modely:** všichni agenti mají model zadaný explicitně, výchozí `opus`; strop je Opus
  (nikdy Fable ani vyšší). Levnější model (Sonnet) jen pro role, které uživatel schválí,
  např. verifikace s eskalací sporných míst na Opus.
- **Parametry, ne natvrdo:** cesty a seznamy kapitol jdou do workflow jako `args`.
- Workflow spouštět nástrojem Workflow podle jména (`konverze-skript:prepis`), případně
  přes `scriptPath` `${CLAUDE_PLUGIN_ROOT}/workflows/<jméno>.js`. Výsledek workflow vždy
  přečíst celý včetně selhání; stav „completed“ neznamená, že všichni agenti uspěli.
- Odeslání výstupů a commity jen na výslovný pokyn uživatele.

## Rozvržení výstupů

Pevná struktura složek se nepředpokládá: session může běžet přímo ve složce s PDF,
ve složce s více předměty nebo v rozpracovaném projektu. Rozvržení se **navrhuje podle
nalezené struktury jako součást plánu** (fáze 0) a uživatel ho schválí.

V referencích značí `<projekt>` kořen projektu zvolený v plánu, tedy složku, ve které
leží výstupy převodu. Návrh vychází z toho, co session najde:

- PDF přímo v pracovní složce → kořenem je tato složka, výstupy vedle PDF.
- Složka s více předměty nebo sadami PDF → podsložka pro každý předmět.
- Rozpracovaný převod (existují přepisy, kniha, konvence) → pokračovat v jeho struktuře.

Doporučený obsah kořene (názvy přizpůsobit tomu, co ve složce už je, a nic nepřepsat):

```
<projekt>/
├── KONVENCE.md               konvence projektu (volitelná): jen odchylky a doplňky, má přednost
├── README.md                 záznam rozhodnutí; existuje-li už jiný README, navrhnout jiný název
├── prepis/kap_<id>/          pages/ (PNG), transcripts/ (page-NN.md), output/
└── kniha/                    main.tex, preamble.tex, test_kap.tex, kapitoly/, figs/
```

Zdrojová PDF zůstávají, kde jsou; přesouvat či přejmenovávat je jen se souhlasem uživatele.

Python prostředí: použít existující `.venv` projektu, má-li potřebné balíčky; jinak
v plánu navrhnout jeho umístění (typicky `<projekt>/.venv`, u více předmětů společné
o úroveň výš) a založit ho:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r ${CLAUDE_PLUGIN_ROOT}/skills/konverze-skript/scripts/requirements.txt
```

(Na Linuxu a macOS `.venv/bin/python`.) Dále je potřeba `pdflatex`; chybí-li, dát
uživateli přesný příkaz k instalaci, neinstalovat sám.

## Konvence projektu

Přepis se řídí dvěma soubory:

1. **Obecná konvence** `${CLAUDE_PLUGIN_ROOT}/skills/konverze-skript/references/KONVENCE.md`
   (součást pluginu, pro projekt se neupravuje),
2. **konvence projektu** `<projekt>/KONVENCE.md` (volitelná). Obsahuje jen to, čím se projekt
   liší nebo co doplňuje, a **má přednost**: kde si soubory odporují, platí konvence projektu.

Workflow přepisu dostane obě cesty (`konvence`, `konvenceProjektu`). Konvence projektu se
zakládá ze šablony `assets/KONVENCE.projekt.md`, až když je co do ní zapsat.

Navrhnout zápis do konvence projektu, když:

- se při inventuře, pilotu nebo triáži objeví něco specifického pro předmět či autora
  (vlastní značení, opakující se zkratky, typ tabulek, rozvržení stránky, cvičení),
- uživatel chce postupovat jinak, než předepisuje obecná konvence,
- padne rozhodnutí z inventury, které se přepisu týká (např. diakritika).

Návrh předložit uživateli jako konkrétní znění pravidla; zapsat až po jeho souhlasu.
Obecnou konvenci pluginu kvůli jednomu projektu neměnit; je-li změna užitečná obecně,
navrhnout ji zvlášť jako úpravu pluginu.

Pravidlo přidané až po přepsání části stránek platí jen pro další běhy: už přepsané
stránky je třeba projít znovu (nebo opravit ručně) a změna textu konvence ruší cache
při navazování přes `resumeFromRunId`.

## Fáze 0: inventura (před jakoukoli prací)

1. Zdroje: seznam PDF, počet stran (`pymupdf.open(p).page_count`), textová vrstva
   (`page.get_text()` prázdné = sken), prohlédnout jednu ukázkovou stranu.
   Zároveň zmapovat strukturu pracovní složky: kde PDF leží, co už existuje (přepisy,
   kniha, konvence, README, `.venv`), zda jde o jeden předmět, nebo o více.
2. Pořadí: zjistit ze stránky předmětu nebo od uživatele, **ne** z čísel v názvech souborů
   (u NTMF061 se lišilo a čtyři PDF byla nečíslovaná).
3. Druh obsahu: přednášky, cvičení, domácí úlohy, převzaté stránky z literatury.
4. Odhad nákladů z naměřených dat (tabulka níže) pro skutečný počet stran a kapitol.
5. Předložit uživateli plán: **navržené rozvržení výstupů** (kořen projektu, cesty pro
   přepisy, knihu, konvenci projektu, záznam rozhodnutí a `.venv`; viz „Rozvržení výstupů“)
   a očíslované otázky s doporučením: pořadí a zařazení PDF; pilotní kapitola; dávkování
   (výchozí 3 kapitoly souběžně); modely rolí; diakritika (doplňovat zjevně chybějící,
   nebo doslova); cvičení (značky pro cvičebnici, viz faze1-prepis.md); které fáze se
   budou dělat.
6. Rozhodnutí zapsat do záznamu rozhodnutí v kořeni projektu; ta, která mění pravidla
   přepisu, navrhnout do konvence projektu. Teprve pak pilot.

## Náklady (naměřeno u NTMF057, agenti Opus)

| Krok | Tokeny | Čas |
|---|---|---|
| Přepis + verifikace | ~150 tis. na stranu | ~3–4 min na stranu v jedné větvi; 71 stran / 3 souběžné kapitoly = 166 min |
| Kniha (reformát) | ~80 tis. na kapitolu (+ kontrola obsahu, neměřeno) | 14 kapitol po 6 = 14 min |

Údaje jsou součty tokenů subagentů včetně čtení z cache; dopad na limit předplatného
bývá nižší, ale předmět o ~100 stranách typicky narazí na pětihodinový limit. Odhady
z teoretické velikosti jednoho volání vycházejí asi pětkrát nízko — nepoužívat.

## Hlášení během běhu

U běhů delších než ~20 minut dát ETA předem a po každé dávce jeden řádek: čas, hotovo
a zbývá, selhání, aktualizované ETA. Po workflow přepisu vždy triáž nejistot a podezření
(faze1-prepis.md), ne jen „hotovo“.
