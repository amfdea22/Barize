"""Analyze products and images to suggest assignments."""
import sqlite3, os

db = sqlite3.connect("barize_dev.db")
db.row_factory = sqlite3.Row

print("=== Produtos ===")
prods = db.execute("SELECT id, nome, imagem, foto_url FROM produtos").fetchall()
import sys
for p in prods:
    emoji = p["imagem"] or "-"
    foto = p["foto_url"] or "-"
    line = f'  #{p["id"]} {p["nome"]:25s} | emoji={emoji} | foto_url={foto}'
    sys.stdout.buffer.write((line + "\n").encode("utf-8"))

uploads = "app/uploads"
files = sorted(os.listdir(uploads))
print(f"\n=== {len(files)} imagens em uploads/ ===")

# Try to get dimensions with PIL
try:
    from PIL import Image
    for f in files:
        path = os.path.join(uploads, f)
        with Image.open(path) as img:
            sz = f'{img.size[0]}x{img.size[1]}'
            kb = f'{os.path.getsize(path)/1024:.1f}KB'
            sys.stdout.buffer.write(f'  {f}: {sz} {img.mode} {kb}\n'.encode("utf-8"))
except ImportError:
    sys.stdout.buffer.write(b"(PIL not installed - showing basic info)\n")
    for f in files:
        path = os.path.join(uploads, f)
        kb = f'{os.path.getsize(path)/1024:.1f}KB'
        ext = os.path.splitext(f)[1].lower()
        sys.stdout.buffer.write(f'  {f}: {kb} ({ext})\n'.encode("utf-8"))
