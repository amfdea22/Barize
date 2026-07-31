# python

> **Categoria**: language
> **Tags**: python, type-hints, asyncio, pytest, ruff, packaging

Python moderno (3.12+): tooling (ruff, mypy, pytest), type hints, asyncio, packaging (pyproject.toml), testes e boas práticas.

## Quando Usar

Use ao escrever código Python, configurar tooling, criar testes com pytest, estruturar pacotes ou revisar código Python.

## Tooling Moderno

- **ruff**: linter + formatter (substituto de flake8/black/isort), execução 10x mais rápida
- **mypy**: type checker estático, `strict = true` no pyproject.toml
- **pytest**: test runner padrão, com plugins (pytest-cov, pytest-asyncio)
- **uv/rye**: gerenciadores de pacotes modernos (alternativas ao pip/poetry)
- `pyproject.toml` como config central (substitui setup.cfg, setup.py)

```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.mypy]
strict = true
ignore_missing_imports = true
```

## Type Hints & PEP 484

```python
from typing import assert_never, override

def process(items: list[str | None]) -> dict[str, int]:
    result: dict[str, int] = {}
    for item in items:
        if item is not None:
            result[item] = len(item)
    return result

# TypeAlias para simplificar
type JSON = str | int | float | bool | None | dict[str, "JSON"] | list["JSON"]

# Protocol (duck typing nominal)
class Drawable(Protocol):
    def draw(self) -> None: ...
```

- Preferir `|` (union type) sobre `Optional[x]` (Python 3.10+)
- `@override` para sobrescrita explícita de métodos
- `Self` para métodos que retornam `self`
- `TypeVar` com `bound` para generics restritos

## Async Patterns (asyncio)

```python
import asyncio
from asyncio import TaskGroup

async def fetch(url: str) -> bytes:
    async with httpx.AsyncClient() as client:
        return await client.get(url)

async def main() -> None:
    # TaskGroup (Python 3.11+) — gestão automática de tarefas
    async with TaskGroup() as tg:
        t1 = tg.create_task(fetch("https://a.com"))
        t2 = tg.create_task(fetch("https://b.com"))
    results = [t1.result(), t2.result()]
```

- Preferir `asyncio.TaskGroup` sobre `asyncio.gather()` (melhor handling de exceções)
- `anyio` para compatibilidade asyncio/trio
- Evitar `asyncio.run()` dentro de loops (recriar event loop é caro)
- Rate limiting: `asyncio.Semaphore(N)` para controlar concorrência

## Packaging (pyproject.toml)

```toml
[build-system]
requires = ["setuptools>=75"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["httpx>=0.28"]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff>=0.6", "mypy>=1.11"]
```

- `src/` layout: `src/meu_pacote/` (evita imports relativos confusos)
- `[project.scripts]` para entry points de CLI
- `[tool.setuptools.packages.find]` com `where = ["src"]`

## Testing (pytest)

```python
import pytest

@pytest.fixture
def db_session():
    session = create_session()
    yield session
    session.close()

class TestUserService:
    def test_create_user(self, db_session):
        user = create_user(db_session, name="Alice")
        assert user.name == "Alice"
        assert user.id is not None

    @pytest.mark.parametrize("name,expected", [
        ("", ValueError),
        ("a" * 256, ValueError),
        ("valid", None),
    ])
    def test_validation(self, name, expected):
        if expected:
            with pytest.raises(expected):
                validate_name(name)
        else:
            assert validate_name(name) == name
```

- Cobertura mínima: 80% (linhas), 70% (branches)
- `pytest-cov` + `pytest-asyncio` para testes async
- Prop testing com `hypothesis`

## Boas Práticas Python

- **PEP 8**: ruff enforced, line-length 100, 4 spaces
- **Composição sobre herança**: favorecer `@dataclass` e `Protocol`
- **Imutabilidade**: `@dataclass(frozen=True)`, evitar mutação de listas/dicts
- **Context managers**: `with` para recursos (arquivos, conexões, locks)
- **EAFP** (Easier to Ask Forgiveness than Permission): `try/except` > `if hasattr`
- ❌ Mutáveis como default args (`def f(x=[])` → `def f(x=None)`)
- ❌ `except Exception: pass` sem logging
