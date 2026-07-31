# Context Map

> Tracks analyzed and modified files.

## Analyzed Files

| File | Last Analysis | Agent | Summary |
|---|---|---|---|
| `neonbar/backend/app/main.py` | 2026-07-28 | architect | Entrypoint FastAPI. Adicionado monkey-patch do event loop policy. |
| `neonbar/backend/app/config.py` | 2026-07-28 | architect | Settings com pydantic-settings. Carrega .env corretamente. |
| `neonbar/backend/app/database.py` | 2026-07-28 | architect | SQLAlchemy sync, init_db, get_db. 26 tabelas. |
| `neonbar/backend/app/routers/pdv.py` | 2026-07-28 | architect | limit/offset adicionados ao listar_produtos_pdv. |
| `neonbar/backend/app/routers/estoque.py` | 2026-07-28 | architect | limit/offset adicionados ao listar_insumos. |
| `neonbar/backend/requirements.txt` | 2026-07-28 | architect | Sem asyncpg/aiosqlite. Sem waitress/gunicorn. |

## Modified Files

| File | Last Modified | Agent | Change |
|---|---|---|---|
| `neonbar/backend/app/main.py` | 2026-07-28 | build | Adicionado WindowsSelectorEventLoopPolicy para Python ≥3.12 no Windows |
