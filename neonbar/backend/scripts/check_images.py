import sqlite3, os, sys

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
