"""Sestaví kapitolu z per-stránkových přepisů a převede ji do TeXu.

Použití: python assemble.py <složka_přepisů> <výstup.md> <výstup.tex> <titul_kapitoly>
"""
import re
import sys
from pathlib import Path

import pypandoc

PREAMBLE = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[czech]{babel}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{graphicx}
\usepackage{longtable,booktabs,array,calc}
% kompatibilita: pandoc >= 3.2 předpokládá longtable >= 4.17 (\LTcaptype)
\newcounter{none}
\usepackage[margin=2.5cm]{geometry}
\usepackage{ulem}
\normalem
\providecommand{\tightlist}{\setlength{\itemsep}{0pt}\setlength{\parskip}{0pt}}
\DeclareUnicodeCharacter{2190}{\ensuremath{\leftarrow}}
\DeclareUnicodeCharacter{2192}{\ensuremath{\rightarrow}}
\DeclareUnicodeCharacter{2196}{\ensuremath{\nwarrow}}
\DeclareUnicodeCharacter{2197}{\ensuremath{\nearrow}}
\DeclareUnicodeCharacter{2198}{\ensuremath{\searrow}}
\DeclareUnicodeCharacter{2199}{\ensuremath{\swarrow}}
\DeclareUnicodeCharacter{21D0}{\ensuremath{\Leftarrow}}
\DeclareUnicodeCharacter{21D1}{\ensuremath{\Uparrow}}
\DeclareUnicodeCharacter{21D2}{\ensuremath{\Rightarrow}}
\DeclareUnicodeCharacter{21D3}{\ensuremath{\Downarrow}}
\DeclareUnicodeCharacter{21D4}{\ensuremath{\Leftrightarrow}}
\DeclareUnicodeCharacter{2212}{\ensuremath{-}}
\DeclareUnicodeCharacter{2248}{\ensuremath{\approx}}
\DeclareUnicodeCharacter{2264}{\ensuremath{\le}}
\DeclareUnicodeCharacter{2265}{\ensuremath{\ge}}
\DeclareUnicodeCharacter{2260}{\ensuremath{\ne}}
\DeclareUnicodeCharacter{2261}{\ensuremath{\equiv}}
\DeclareUnicodeCharacter{00B1}{\ensuremath{\pm}}
\DeclareUnicodeCharacter{00D7}{\ensuremath{\times}}
\DeclareUnicodeCharacter{22C5}{\ensuremath{\cdot}}
\DeclareUnicodeCharacter{221E}{\ensuremath{\infty}}
\DeclareUnicodeCharacter{2208}{\ensuremath{\in}}
\DeclareUnicodeCharacter{2200}{\ensuremath{\forall}}
\DeclareUnicodeCharacter{2203}{\ensuremath{\exists}}
\DeclareUnicodeCharacter{226A}{\ensuremath{\ll}}
\DeclareUnicodeCharacter{226B}{\ensuremath{\gg}}
\DeclareUnicodeCharacter{223C}{\ensuremath{\sim}}
\DeclareUnicodeCharacter{2032}{\ensuremath{'}}
\DeclareUnicodeCharacter{25E5}{\ensuremath{\blacktriangle}}
\DeclareUnicodeCharacter{0393}{\ensuremath{\Gamma}}
\DeclareUnicodeCharacter{0394}{\ensuremath{\Delta}}
\DeclareUnicodeCharacter{0398}{\ensuremath{\Theta}}
\DeclareUnicodeCharacter{039B}{\ensuremath{\Lambda}}
\DeclareUnicodeCharacter{03A0}{\ensuremath{\Pi}}
\DeclareUnicodeCharacter{03A3}{\ensuremath{\Sigma}}
\DeclareUnicodeCharacter{03A6}{\ensuremath{\Phi}}
\DeclareUnicodeCharacter{03A9}{\ensuremath{\Omega}}
\DeclareUnicodeCharacter{03B1}{\ensuremath{\alpha}}
\DeclareUnicodeCharacter{03B2}{\ensuremath{\beta}}
\DeclareUnicodeCharacter{03B3}{\ensuremath{\gamma}}
\DeclareUnicodeCharacter{03B4}{\ensuremath{\delta}}
\DeclareUnicodeCharacter{03B5}{\ensuremath{\varepsilon}}
\DeclareUnicodeCharacter{03B7}{\ensuremath{\eta}}
\DeclareUnicodeCharacter{03B8}{\ensuremath{\theta}}
\DeclareUnicodeCharacter{03BA}{\ensuremath{\kappa}}
\DeclareUnicodeCharacter{03BB}{\ensuremath{\lambda}}
\DeclareUnicodeCharacter{03BC}{\ensuremath{\mu}}
\DeclareUnicodeCharacter{03BD}{\ensuremath{\nu}}
\DeclareUnicodeCharacter{03BE}{\ensuremath{\xi}}
\DeclareUnicodeCharacter{03C0}{\ensuremath{\pi}}
\DeclareUnicodeCharacter{03C1}{\ensuremath{\rho}}
\DeclareUnicodeCharacter{03C3}{\ensuremath{\sigma}}
\DeclareUnicodeCharacter{03C4}{\ensuremath{\tau}}
\DeclareUnicodeCharacter{03C6}{\ensuremath{\varphi}}
\DeclareUnicodeCharacter{03C7}{\ensuremath{\chi}}
\DeclareUnicodeCharacter{03C8}{\ensuremath{\psi}}
\DeclareUnicodeCharacter{03C9}{\ensuremath{\omega}}
\providecommand{\pandocbounded}[1]{\resizebox{\ifdim\width>\linewidth\linewidth\else\width\fi}{!}{#1}}
\setcounter{secnumdepth}{0}
\begin{document}
\shorthandoff{"}
"""


def main() -> None:
    tr_dir = Path(sys.argv[1])
    out_md = Path(sys.argv[2])
    out_tex = Path(sys.argv[3])
    title = sys.argv[4] if len(sys.argv) > 4 else out_md.stem

    parts = []
    for tr in sorted(tr_dir.glob("page-*.md")):
        page_no = int(re.search(r"page-(\d+)", tr.name).group(1))
        body = tr.read_text(encoding="utf-8").strip()
        parts.append(f"<!-- ===== strana {page_no} ===== -->\n\n{body}")
    md = "\n\n".join(parts) + "\n"
    out_md.write_text(md, encoding="utf-8")
    print(f"Zapsáno {out_md} ({len(parts)} stran)")

    # Display-math bloky ($$...$$) jsou už hotový LaTeX — schovat před pandocem
    # za placeholder a po konverzi vložit doslovně jako \[...\].
    # Placeholder zachovává odsazení i blockquote prefix původního bloku,
    # aby nerozbil strukturu seznamů/citací; prefixy uvnitř bloku se stripují.
    blocks: list[str] = []

    def stash(m: re.Match) -> str:
        prefix, content = m.group(1), m.group(2)
        content = re.sub(r"^[ \t]*>\s?", "", content, flags=re.MULTILINE)
        blocks.append(content)
        return f"{prefix}QQMATHBLOCKQQ{len(blocks) - 1}QQ"

    md_stashed = re.sub(
        r"^([ \t>]*)\$\$(.+?)\$\$", stash, md, flags=re.DOTALL | re.MULTILINE
    )

    body_tex = pypandoc.convert_text(
        md_stashed, "latex", format="markdown+tex_math_dollars+raw_tex",
        extra_args=["--wrap=none"],
    )
    body_tex = body_tex.replace("\r\n", "\n")
    body_tex = re.sub(
        r"QQMATHBLOCKQQ(\d+)QQ",
        lambda m: "\\[" + blocks[int(m.group(1))] + "\\]",
        body_tex,
    )
    tex = PREAMBLE + f"\\section*{{{title}}}\n\n" + body_tex + "\n\\end{document}\n"
    out_tex.write_text(tex, encoding="utf-8", newline="\n")
    print(f"Zapsáno {out_tex}")

    for i, line in enumerate(tex.splitlines(), start=1):
        if "\\begin{verbatim}" in line:
            print(f"POZOR: {out_tex}:{i} obsahuje verbatim blok — v přepisu je zřejmě "
                  f"přeodsazený řádek, který pandoc vysázel jako kód.")


if __name__ == "__main__":
    main()
