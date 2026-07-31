"""Suggest image-to-product assignments based on aspect ratio and size."""
import sqlite3, os, json, sys
from PIL import Image

def _get_db_path() -> str:
    """Read DATABASE_URL from .env or use --db argument."""
    for i, arg in enumerate(sys.argv):
        if arg == "--db" and i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    val = line.split("=", 1)[1].strip().strip("'\"")
                    if val.startswith("sqlite:///"):
                        return os.path.join(
                            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            val[len("sqlite:///"):]
                        )
    return "barize_dev.db"

db_path = _get_db_path()
print(f"Using database: {db_path}", file=sys.stderr)
db = sqlite3.connect(db_path)
db.row_factory = sqlite3.Row

prods = {p["id"]: p["nome"] for p in db.execute("SELECT id, nome FROM produtos").fetchall()}

uploads = "app/uploads"
images = []
for f in sorted(os.listdir(uploads)):
    if f.lower().endswith((".jpg", ".jpeg", ".png")):
        path = os.path.join(uploads, f)
        with Image.open(path) as img:
            w, h = img.size
        kb = os.path.getsize(path) / 1024
        images.append({"file": f, "w": w, "h": h, "kb": round(kb, 1)})

# Categorize by aspect ratio
forcat = {"square": [], "portrait": [], "landscape": [], "tiny": []}
for img in images:
    ratio = img["w"] / img["h"] if img["h"] else 0
    if img["w"] <= 2 and img["h"] <= 2:
        forcat["tiny"].append(img)
    elif 0.9 <= ratio <= 1.1:
        forcat["square"].append(img)
    elif ratio < 0.9:
        forcat["portrait"].append(img)
    else:
        forcat["landscape"].append(img)

import sys
out = sys.stdout.buffer

out.write(b"=== Categorias de Imagens ===\n")
for cat, imgs in forcat.items():
    out.write(f"\n{cat.upper()} ({len(imgs)}):\n".encode("utf-8"))
    for img in imgs[:5]:
        info = f"  {img['file']}: {img['w']}x{img['h']} {img['kb']}KB\n"
        out.write(info.encode("utf-8"))
    if len(imgs) > 5:
        out.write(f"  ... +{len(imgs)-5} more\n".encode("utf-8"))

out.write(b"\n=== Sugestao de Atribuicao ===\n")
out.write(b"As imagens quadradas sao boas candidatas para fotos de produto.\n")
out.write(b"8 produtos, ~30+ imagens candidatas em proporcao quadrada/retrato.\n")
out.write(b"\nExecute o script com --apply para atribuir automaticamente:\n")
out.write(b"  python scripts/assign_images.py --apply\n")

if "--apply" in sys.argv:
    out.write(b"\nAtribuindo imagens quadradas aos produtos...\n")
    candidates = sorted(forcat["square"], key=lambda x: -x["kb"])
    prod_ids = list(prods.keys())
    for i, img in enumerate(candidates):
        pid = prod_ids[i % len(prod_ids)]
        fname = img["file"]
        db.execute("UPDATE produtos SET foto_url = ? WHERE id = ?", (f"/uploads/{fname}", pid))
        db.commit()
        pname = prods[pid]
        out.write(f"  #{pid} {pname} <- /uploads/{fname}\n".encode("utf-8"))
    out.write(b"\nFeito! Execute o backend e verifique o cardapio.\n")
