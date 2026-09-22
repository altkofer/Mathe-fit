# Mathe-Fit Metall

Statische HTML-Lernapp fuer berufsschulische Mathe-Grundlagen in Metallberufen.

## Kurzkonzept

- Zielgruppe: Berufsschuelerinnen und Berufsschueler, die Grundlagen aus Mathematik und technischen Formeln auffrischen.
- Aufbau: Rubriken wie Grundrechenarten, Einheiten, Prozentrechnung, Formeln umstellen, Pythagoras, Flaechen, Volumen, Bewegung und Kraefte.
- Differenzierung: Jede Rubrik hat 18 verschiedene Aufgabenformen je Stufe. Alle starten mit `Basis` (18 Aufgaben). `Training` und `Plus` sind freiwillig.
- Hilfe: Nach Fehlern stehen gestufte Tipps und ein Loesungsweg bereit.
- Betrieb: Kein Login, keine Datenbank, kein Build-Schritt. Fortschritt wird nur lokal im Browser gespeichert.
- Darstellung: Zeichnungen erscheinen nur bei passenden Aufgaben. Brueche und Formelindizes werden im Browser formatiert.

## Nutzung

Die Datei `index.html` im Browser oeffnen.

## GitHub Pages

1. Die Dateien aus diesem Ordner direkt in das Hauptverzeichnis eines GitHub-Repositories hochladen.
2. In GitHub unter `Settings > Pages` den Branch `main` und `/(root)` auswaehlen.
3. Als Startdatei wird automatisch `index.html` verwendet.

Bei einem bereits veroeffentlichten Repository `index.html`, `styles.css` und `app.js` ersetzen und `extra-tasks.js` neu hochladen. GitHub Pages veroeffentlicht die Aenderung danach erneut.

## Dateien

- `index.html`: App-Struktur
- `styles.css`: Smartphonefreundliches Layout
- `app.js`: Aufgaben, Pruefung, Tipps und lokaler Fortschritt
- `extra-tasks.js`: Zusaetzliche, unterschiedliche Aufgabenformen
