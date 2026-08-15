import fitz
from pathlib import Path
src=Path('attached_assets/Kareem_Atef_[١]_1786813345385.pdf')
out=Path('.agents/outputs/resume-pages')
out.mkdir(parents=True, exist_ok=True)
doc=fitz.open(src)
for i,page in enumerate(doc):
    pix=page.get_pixmap(matrix=fitz.Matrix(2,2), alpha=False)
    path=out/f'page-{i+1}.png'
    pix.save(path)
    print(path)
