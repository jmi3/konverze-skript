"""Vyrenderuje stránky PDF do PNG pro přepis.

Použití: python render_pages.py <pdf> <výstupní_složka> [dpi]
"""
import sys
from pathlib import Path

import pymupdf


def main() -> None:
    pdf_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 300
    out_dir.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(pdf_path)
    zoom = dpi / 72
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), colorspace=pymupdf.csGRAY)
        out = out_dir / f"page-{i:02d}.png"
        pix.save(out)
        print(f"{out}  {pix.width}x{pix.height}")
    print(f"Hotovo: {len(doc)} stran")


if __name__ == "__main__":
    main()
