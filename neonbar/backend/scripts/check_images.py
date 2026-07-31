import sqlite3, os

db = sqlite3.connect("barize_dev.db")
db.row_factory = sqlite3.Row

prods = db.execute("SELECT id, nome, categoria, imagem, foto_url FROM produtos").fetchall()
print(f"Total produtos: {len(prods)}")
for p in prods:
    print(f'  #{p["id"]} {p["nome"]:30s} | imagem={str(p["imagem"] or "-"):10s} | foto_url={p["foto_url"] or "-"}')

uploads_dir = "app/uploads"
files = os.listdir(uploads_dir)
print(f"\nTotal imagens em uploads/: {len(files)}")

urls = db.execute("SELECT foto_url FROM produtos WHERE foto_url IS NOT NULL").fetchall()
existing = set(files)
for row in urls:
    fname = row["foto_url"].split("/")[-1] if row["foto_url"] else ""
    print(f'  foto_url={row["foto_url"]} -> exists_in_dir={fname in existing}')
