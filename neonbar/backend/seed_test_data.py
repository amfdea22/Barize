import sqlite3
from datetime import date, timedelta

conn = sqlite3.connect('barize_dev.db')
cursor = conn.cursor()

# Add some test lotes for insumos
cursor.execute('''
    INSERT INTO lotes (insumo_id, codigo_lote, data_fabricacao, data_validade, quantidade_inicial, quantidade_atual, custo_unitario, deleted_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'))
''', (1, 'LOTE-CACHACA-001', '2026-01-15', '2027-01-15', 1000, 500, 25.00))

cursor.execute('''
    INSERT INTO lotes (insumo_id, codigo_lote, data_fabricacao, data_validade, quantidade_inicial, quantidade_atual, custo_unitario, deleted_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'))
''', (4, 'LOTE-LIMAO-001', '2026-07-20', '2026-08-20', 100, 50, 2.00))

cursor.execute('''
    INSERT INTO lotes (insumo_id, codigo_lote, data_fabricacao, data_validade, quantidade_inicial, quantidade_atual, custo_unitario, deleted_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'))
''', (2, 'LOTE-VODKA-001', '2026-01-15', '2027-01-15', 1000, 800, 30.00))

# Add some produto lotes
cursor.execute('''
    INSERT INTO produto_lotes (produto_id, codigo_lote, data_fabricacao, data_validade, quantidade, deleted_at, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, datetime('now'))
''', (1, 'LOTE-CAIP-001', '2026-07-25', '2026-08-05', 50))

cursor.execute('''
    INSERT INTO produto_lotes (produto_id, codigo_lote, data_fabricacao, data_validade, quantidade, deleted_at, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, datetime('now'))
''', (4, 'LOTE-CERV-001', '2026-01-15', '2027-01-15', 200))

conn.commit()
print("Test data inserted")

# Verify
cursor.execute('SELECT * FROM lotes')
print("Lotes:", cursor.fetchall())
cursor.execute('SELECT * FROM produto_lotes')
print("Produto Lotes:", cursor.fetchall())
conn.close()