GREEN LION ENERGY · SUB-PREISPORTAL · CLOUDFLARE D1

Dateien hochladen:
1. Diesen Ordner in ein GitHub Repository hochladen.
2. In Cloudflare Pages: Create application > Pages > Connect to Git.
3. Repository auswählen.
4. Build command leer lassen.
5. Build output directory: / oder .
6. Deploy starten.

D1 Datenbank anlegen:
1. Cloudflare Dashboard > Workers & Pages > D1 SQL Database.
2. Create database.
3. Name z. B.: green_lion_subpreise
4. Datenbank öffnen > Console.
5. Inhalt aus schema.sql ausführen.

D1 an Pages binden:
1. Cloudflare Pages Projekt öffnen.
2. Settings > Functions > D1 database bindings.
3. Add binding.
4. Variable name: DB
5. D1 database: green_lion_subpreise auswählen.
6. Save.
7. Danach: Deployments > Retry deployment oder neuen Deploy starten.

Test:
https://DEINE-SEITE.pages.dev/api/prices

Wenn JSON erscheint, funktioniert die Live-Speicherung.
