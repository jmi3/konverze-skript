"""Vyřízne obrázky ze skenů podle fig-bbox komentářů v přepisech.

Použití: python crop_figures.py <složka_přepisů> <složka_stránek> <výstupní_složka_figures>

Hledá dvojice řádků:
    ![obrázek](figures/page-NN-fig-M.png)
    ...
    <!-- fig-bbox: x0,y0,x1,y1 -->   (procenta stránky)
"""
import re
import sys
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def main() -> None:
    tr_dir, pages_dir, out_dir = (Path(a) for a in sys.argv[1:4])
    out_dir.mkdir(parents=True, exist_ok=True)

    fig_re = re.compile(r"!\[[^\]]*\]\(figures/(page-(\d+)-fig-\d+)\.png\)")
    bbox_re = re.compile(r"<!--\s*fig-bbox:\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*-->")

    count = 0
    for tr in sorted(tr_dir.glob("page-*.md")):
        text = tr.read_text(encoding="utf-8")
        figs = list(fig_re.finditer(text))
        for m in figs:
            name, page_no = m.group(1), m.group(2)
            bbox_m = bbox_re.search(text, m.end())
            if not bbox_m:
                print(f"POZOR: {tr.name}: {name} nemá fig-bbox, přeskakuji")
                continue
            x0, y0, x1, y1 = (float(v) for v in bbox_m.groups())
            page_png = pages_dir / f"page-{int(page_no):02d}.png"
            img = Image.open(page_png)
            w, h = img.size
            crop = img.crop((int(x0 / 100 * w), int(y0 / 100 * h), int(x1 / 100 * w), int(y1 / 100 * h)))
            out = out_dir / f"{name}.png"
            crop.save(out)
            print(f"{out}  {crop.size}")
            count += 1
    print(f"Hotovo: {count} obrázků")


if __name__ == "__main__":
    main()
