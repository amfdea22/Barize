import sqlite3

conn = sqlite3.connect(r"barize_dev.db")
c = conn.cursor()

cols = [r[1] for r in c.execute("PRAGMA table_info(produtos)").fetchall()]
if "ingredientes" not in cols:
    c.execute("ALTER TABLE produtos ADD COLUMN ingredientes TEXT")
    print("Column ingredientes added")

updates = [
    ("%Caipirinha%", "Vodka, lim\u00e3o, a\u00e7\u00facar, gelo"),
    ("%Gim%", "Gim, t\u00f4nica, lim\u00e3o, gelo"),
    ("%Bloody%", "Vodka, suco de tomate, molho ingl\u00eas, sal, pimenta"),
    ("%Whisky%", "Whisky, lim\u00e3o, a\u00e7\u00facar, gelo"),
    ("%Mojito%", "Rum, hortel\u00e3, lim\u00e3o, a\u00e7\u00facar, \u00e1gua com g\u00e1s"),
    ("%Margarita%", "Tequila, laranja, cointreau, gelo"),
    ("%Sex%", "Vodka, suco de cranberry, suco de laranja"),
    ("%Martini%", "Gim, vermute seco, azeitona, gelo"),
]
for pattern, ingredientes in updates:
    c.execute(
        "UPDATE produtos SET ingredientes = ? WHERE nome LIKE ? AND ingredientes IS NULL",
        (ingredientes, pattern),
    )

c.execute(
    "UPDATE produtos SET ingredientes = ? WHERE categoria = ? AND ingredientes IS NULL",
    ("Cerveja long neck gelada", "Cervejas"),
)
c.execute(
    "UPDATE produtos SET ingredientes = ? WHERE categoria = ? AND ingredientes IS NULL",
    ("Bebida gelada", "Bebidas"),
)
c.execute(
    "UPDATE produtos SET ingredientes = ? WHERE categoria = ? AND ingredientes IS NULL",
    ("Por\u00e7\u00e3o", "Por\u00e7\u00f5es"),
)
c.execute(
    "UPDATE produtos SET ingredientes = ? WHERE categoria = ? AND ingredientes IS NULL",
    ("Drink cl\u00e1ssico", "Drinks"),
)

conn.commit()

rows = c.execute(
    "SELECT nome, ingredientes FROM produtos WHERE ingredientes IS NOT NULL LIMIT 5"
).fetchall()
for r in rows:
    print(r)
remaining = c.execute(
    "SELECT COUNT(*) FROM produtos WHERE ingredientes IS NULL"
).fetchone()[0]
print(f"Produtos sem ingredientes: {remaining}")
conn.close()
