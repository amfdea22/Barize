import sqlite3
db = sqlite3.connect("barize_dev.db")
db.row_factory = sqlite3.Row

print("=== Lotes (insumos) ===")
rows = db.execute("SELECT id, insumo_id, codigo_lote, quantidade_atual, data_validade FROM lotes WHERE quantidade_atual > 0").fetchall()
for r in rows:
    print(f'  #{r["id"]} insumo_id={r["insumo_id"]} lote={r["codigo_lote"]} qtd={r["quantidade_atual"]} val={r["data_validade"]}')
print(f"Total: {len(rows)}")

print("\n=== ProdutoLotes ===")
rows = db.execute("SELECT id, produto_id, codigo_lote, quantidade, data_validade FROM produto_lotes WHERE quantidade > 0").fetchall()
for r in rows:
    print(f'  #{r["id"]} produto_id={r["produto_id"]} lote={r["codigo_lote"]} qtd={r["quantidade"]} val={r["data_validade"]}')
print(f"Total: {len(rows)}")
