GREEN LION ENERGY · SUB-PREISPORTAL · VERSION MIT SPEICHER-BUTTON

Änderungen in dieser Version:
- Logo entfernt
- Änderungen werden nicht mehr automatisch dauerhaft gespeichert
- Neuer Button: "Speichern & aktualisieren"
- Nach erfolgreichem Speichern wird die Seite neu geladen
- Anzeige "Letzte Speicherung"
- Mobile Darstellung optimiert

GitHub Upload:
1. index.html ersetzen
2. functions/api/prices.js hochladen oder ersetzen
3. schema.sql hochladen

Cloudflare D1:
- Binding-Name muss exakt DB heißen
- Datenbank kann green-lion-prices heißen
- Wenn D1 korrekt verbunden ist, lädt /api/prices JSON

Test:
https://DEINE-SEITE.workers.dev/api/prices
oder
https://DEINE-SEITE.pages.dev/api/prices

