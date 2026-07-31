import sqlite3
conn = sqlite3.connect('barize_dev.db')
cursor = conn.cursor()

# Check existing lotes
cursor.execute('SELECT * FROM lotes')
lotes = cursor.fetchall()
print("Lotes:", lotes)

# Check insumos
cursor.execute('SELECT id, nome, categoria, unidade_medida, codigo_barras FROM insumos LIMIT 5')
insumos = cursor.fetchall()
print("Insumos:", insumos)

# Check produtos
cursor.execute('SELECT id, nome, categoria, codigo_barras FROM produtos LIMIT 5')
produtos = cursor.fetchall()
print("Produtos:", produtos)

# Check produto_lotes
cursor.execute('SELECT * FROM produto_lotes')
pl = cursor.fetchall()
print("Produto Lotes:", pl)

conn.close()