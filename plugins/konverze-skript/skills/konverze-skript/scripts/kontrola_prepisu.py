"""Kontrola přepisů před sestavením kapitoly: hledá místa, na kterých padá pandoc nebo pdflatex.

Použití: python kontrola_prepisu.py <složka_přepisů> [<složka_přepisů> ...]

Hlásí:
  - znaky mimo ASCII a českou abecedu v textu mimo matematiku (patří do $...$ jako LaTeX),
  - &nbsp;,
  - řádky odsazené o 4 a více mezer, které nejsou položkou seznamu ani uvnitř $$...$$
    (Markdown je vysází jako blok kódu).
Návratový kód 1 znamená, že bylo co hlásit.
"""
import re
import sys
from pathlib import Path

# Písmena latinky s diakritikou (Latin-1 a Latin Extended-A) zvládá inputenc utf8 sám.
LATINKA = {chr(c) for c in range(0xC0, 0x180)} - {"×", "÷"}
TYPOGRAFIE = set("„“”‚‘’–—…·°")
POVOLENE = LATINKA | TYPOGRAFIE

DISPLAY = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE = re.compile(r"\$[^$\n]+\$")
KOMENTAR = re.compile(r"<!--.*?-->", re.DOTALL)
POLOZKA = re.compile(r"^\s*([-*+]|\d+[.)])\s")


def bez_matematiky(text: str) -> str:
    # Nahrazení zachovává počet řádků, aby čísla řádků odpovídala souboru.
    def prazdne(m: re.Match) -> str:
        return "\n" * m.group(0).count("\n")

    text = KOMENTAR.sub(prazdne, text)
    text = DISPLAY.sub(prazdne, text)
    return INLINE.sub("", text)


def zkontroluj(soubor: Path) -> list[str]:
    hlaseni = []
    puvodni = soubor.read_text(encoding="utf-8")
    text = bez_matematiky(puvodni)
    # Zásobník otevřených položek seznamu: (odsazení značky, odsazení obsahu).
    # Pandoc vysází jako kód řádek odsazený o 4 a více mezer vůči obsahu položky.
    seznam: list[tuple[int, int]] = []
    for i, radek in enumerate(text.splitlines(), start=1):
        cizi = sorted({z for z in radek if ord(z) > 127 and z not in POVOLENE})
        if cizi:
            znaky = ", ".join(f"{z} (U+{ord(z):04X})" for z in cizi)
            hlaseni.append(f"{soubor}:{i}: znak mimo matematiku: {znaky}")
        if "&nbsp;" in radek:
            hlaseni.append(f"{soubor}:{i}: &nbsp;")
        if not radek.strip():
            continue
        odsazeni = len(radek) - len(radek.lstrip(" "))
        polozka = POLOZKA.match(radek)
        if polozka:
            while seznam and seznam[-1][0] >= odsazeni:
                seznam.pop()
            seznam.append((odsazeni, polozka.end()))
            continue
        if odsazeni == 0:
            seznam.clear()
            continue
        zaklad = seznam[-1][1] if seznam else 0
        if odsazeni >= zaklad + 4:
            hlaseni.append(f"{soubor}:{i}: odsazení {odsazeni} mezer (riziko bloku kódu)")
    return hlaseni


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.stdout.reconfigure(encoding="utf-8")
    hlaseni = []
    for slozka in sys.argv[1:]:
        for soubor in sorted(Path(slozka).glob("page-*.md")):
            hlaseni.extend(zkontroluj(soubor))
    for h in hlaseni:
        print(h)
    print(f"Hotovo: {len(hlaseni)} hlášení")
    sys.exit(1 if hlaseni else 0)


if __name__ == "__main__":
    main()
