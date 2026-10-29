# Fáze 1: věrný přepis

Cíl: každá stránka skenu → `transcripts/page-NN.md` (Markdown + LaTeX matematika) podle
obecné konvence a konvence projektu `<projekt>/KONVENCE.md` (má přednost), nezávisle
ověřená proti skenu; z kapitol pak `output/<id>.md`,
`output/<id>.tex` a kontrolní `output/<id>.pdf`.

## Příprava kapitoly

1. Render stránek (šedotón, 300 DPI):
   `python ${CLAUDE_PLUGIN_ROOT}/skills/konverze-skript/scripts/render_pages.py <pdf> <projekt>/prepis/kap_<id>/pages 300`

`<projekt>` je kořen projektu a cesty uvnitř něj jsou doporučené; platí rozvržení
schválené v plánu (SKILL.md, „Rozvržení výstupů“).
2. Vytvořit prázdnou složku `transcripts/`.
3. Scratch pro výřezy agentů: jedna sdílená složka mimo repozitář (scratchpad session).
   Názvy výřezů mají povinný prefix `<id>-pNN-` (verifikace `verif-<id>-pNN-`); bez něj
   si paralelní agenti čtou cizí nebo staré výřezy.

## Pilot

Jedna kapitola (6–10 stran) s větami, důkazy, rámečky i obrázkem. Pilot běží stejným
workflow jako produkce, jen s jednou kapitolou. Po pilotu:

- projít přepis s uživatelem (ukázat vzorek stránky vedle skenu),
- navrhnout uživateli pravidla do konvence projektu `<projekt>/KONVENCE.md` (zvyklosti
  autora, diakritika, zvláštní značení, tabulky) a zapsat ta, která schválí,
- sestavit kapitolu (viz níže) a ověřit, že se přeloží,
- teprve na pokyn uživatele spustit další kapitoly.

## Spuštění workflow

Workflow `konverze-skript:prepis` (soubor `${CLAUDE_PLUGIN_ROOT}/workflows/prepis.js`), args:

```json
{
  "konvence": "${CLAUDE_PLUGIN_ROOT}/skills/konverze-skript/references/KONVENCE.md",
  "konvenceProjektu": "<projekt>/KONVENCE.md",
  "scratch": "<scratchpad session>",
  "python": "<cesta k .venv>/Scripts/python.exe",
  "popis": "ručně psané české poznámky k přednášce <název> (<kód>)",
  "davka": 3,
  "model": "opus",
  "modelVerifikace": "opus",
  "kapitoly": [
    { "id": "01", "dir": "<projekt>/prepis/kap_01", "title": "<název kapitoly>", "pages": 10 }
  ]
}
```

Všechny cesty v args musí být absolutní.

- `konvenceProjektu` vynechat, pokud projekt vlastní konvenci nemá.
- Stránky v kapitole jdou sekvenčně (návaznost přes `tail`), kapitoly v dávkách souběžně.
  Uživatel u NTMF057 výslovně chtěl dávky po třech kapitolách, ne všechny najednou.
- Verifikace stránky startuje hned po jejím přepisu a běží souběžně s dalšími stranami.
- Selže-li přepis stránky i po opakování, kapitola pokračuje bez návaznosti a stránka
  je ve výsledku v `failedPages`; dopsat ji ručně jedním agentem s ručně vloženým `tail`.
- Workflow nesmí běžet na Fable a model se zadává explicitně (strop Opus).

### Přerušení a pokračování

Při vyčerpání limitu workflow počká na obnovení (nebo agenti selžou). Navázat jde přes
`resumeFromRunId` se **stejným skriptem a stejnými args**: z cache se vrátí jen agenti
s nezměněným promptem. Změna velikosti dávky cache neruší, změna textu konvence či
promptu ano (stránky by se přepisovaly znovu).

## Triáž po workflow (povinná)

Výsledek obsahuje u každé stránky `uncertainties` (nejistoty přepisovače, u NTMF057
~5,6 na stranu) a u verifikace `opravy` a `podezreni`. Tyto seznamy se nesmí ztratit:

1. Sloučit podezření verifikátorů a nejistoty typu „čteno podle kontextu“ do tabulky
   (kapitola, strana, místo, varianty).
2. U každého místa rozhodnout nad výřezem skenu: ponechat, nebo `[nečitelné: snad „X“]`.
   Sporné případy předložit uživateli; nic neopravovat podle smyslu.
3. Zkontrolovat zásahy verifikace, které mění význam (negace symbolu, jazykové „opravy“).
4. Opakuje-li se stejný typ nejistoty (autorova zkratka, symbol, rozvržení), navrhnout
   pravidlo do konvence projektu.

## Sestavení kapitoly

1. `python .../scripts/kontrola_prepisu.py <kap>/transcripts` — znaky Unicode mimo
   matematiku, `&nbsp;`, odsazení, které Markdown vysází jako kód. Opravit v `page-NN.md`
   **před** prvním překladem.
2. `python .../scripts/crop_figures.py <kap>/transcripts <kap>/pages <kap>/output/figures`
   (výřezy podle `fig-bbox`; obrázek bez bbox se přeskočí s hlášením).
3. `python .../scripts/assemble.py <kap>/transcripts <kap>/output/<id>.md <kap>/output/<id>.tex "<titul>"`
   (display matematika jde do TeXu doslova, preambule ošetřuje známé pasti pandocu).
   Hlášení `POZOR: … verbatim blok` = přeodsazený řádek v přepisu.
4. `pdflatex -interaction=nonstopmode -halt-on-error <id>.tex` ve složce `output/` (2×).

Pasti a jejich příčiny: [pasti.md](pasti.md).

## Volitelné rozšíření: cvičení

Obsahují-li poznámky cvičení, která se mají zároveň vyčlenit do cvičebnice, je možné
přidat do konvence projektu pravidlo pro strojově čitelné značky
`<!-- CVICENI zacatek | id=<id>-cvNN -->` … `<!-- CVICENI konec -->` a cvičebnici z nich
poskládat skriptem. Navrženo pro NTMF061, dosud nevyzkoušeno; o použití rozhoduje uživatel
před pilotem (značky musí být v konvenci už při přepisu).
