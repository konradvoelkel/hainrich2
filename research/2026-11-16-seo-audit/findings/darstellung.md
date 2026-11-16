# Darstellung (Visual), Stand 2026-11-16

Bilder: /media/konrad/xtraspace/hainrich2/work/seo-audit-2026-11-16/bilder/visual/ (Namen `<seite>-<phone|tablet|desktop>-<viewport|voll>.png`). Messwerte: `messung.json` im selben Ordner. 28 Seitenaufrufe, ein Browser, nichts abgeschickt.

## Was gut ist
- Kein Seitenüberlauf (scrollWidth = Viewportbreite) auf allen 8 Seiten bei 360, 768, 1366.
- Textgröße Telefon: Fließtext 17 px, Zitate 17 px, Formeln 20,6 px, Kleingedrucktes 14,4 px, Badges 12,8 px. Eingabefelder 17 px (kein iOS-Zoom).
- Zeilenlänge Desktop: Spalte 704 px, rund 75 Zeichen. Gut.
- Kontrast hell (alle gemessen): Text 15,4; leise 6,9; Link 5,5; Banner 7,2; Badges 6,1 bis 13,8; Knopf und Bot-Etikett 5,5 bis 5,7. Nichts unter 4,5.
- Dunkelmodus vorhanden (`prefers-color-scheme: dark`), lesbar: Text 14,8; leise 7,9; Link 7,9; Banner 8,0; Knopf 7,9. Bild: s09-phone-dunkel-viewport.png, s09-phone-dunkel-formel.png.
- Breite Formeln scrollen im eigenen Kasten (`.katex-display`, overflow-x: auto), werden nicht abgeschnitten.
- Primäre Handlung sichtbar: Start: Suchfeld y=367 und „Frage stellen“ y=560 (start-phone-viewport.png). Unterforum und Kapitel: Knopf y=204 bzw. 275. Frageformular: Feld und „Weiter“ im ersten Bildschirm (neu-phone-viewport.png).
- 404-Seite sauber, mit Weg zurück („Zum Forum“) (e404-phone-viewport.png).

## Oberhalb der Falz, Telefon 360x800
| Seite | Banner+Kopf | Anteil | Inhalt beginnt |
|---|---|---|---|
| Start | 34+70 px | 13 % | H1 bei y=107 |
| Unterforum, Kapitel, Frage, ueber, neu, 404 | 34+120 px | 19 % | H1 bei y=161 bis 305 |
Banner allein: 34 px (4 %). Das ist vertretbar. Der Kopf wird auf Unterseiten durch den Untertitel zweizeilig (120 px).
Frageseite s09: H1 bei y=305 bis 409, Antwort beginnt y=467, rund 270 px Antworttext sichtbar (s09-phone-viewport.png). s12: H1 bis y=435, Antwort ab y=493. Es sind also Brotkrumen, Fragekarte (rund 230 px) und H1 vor der Antwort, aber der Antwortanfang ist ohne Scrollen zu sehen.

## Befunde
1. Mittel: Zitate dominieren die Frageseiten am Telefon. s09: 7 Zitatblöcke, zusammen 5047 von 7392 px Hauptspalte (68 %); größter Block 1116 px. s12: 3245 von 5464 px (59 %). Alles offen, kein `<details>`. Bilder: s09-phone-zitate.png, s09-phone-voll.png. Das Zitat steckt in Karte plus Einrückung und hat nur rund 250 px Textbreite. Fix: Zitate einklappen (details mit erstem Satz) oder nur 1 bis 2 Zeilen zeigen. Prüfen: Seitenhöhe s09 bei 360 px (heute 7760 px).
2. Mittel: Breite Formeln sind angeschnitten ohne sichtbaren Hinweis, dass man scrollen kann. Kastenbreite 262 px, Inhalt bis 563 px (Zitat auf s09: 331, 433, 487; s12: 563). Bild: s09-phone-formel-breit.png. Das Telefon blendet Scrollleisten aus. Fix: Randverlauf rechts (mask oder Schatten) oder `tabindex=0` plus `scrollbar-width: thin`; hilft auch Tastaturnutzern. Prüfen: Bild, Tab-Taste.
3. Niedrig: Tippflächen. Telefon: Fußnotenlinks `[1]` 18x19 px, `#1` 17x22 px, Brotkrume „Forum“ 47x20 px, Startseiten-Kategorielinks 97 bis 193 x 21 px, Fußzeilenlinks 23 px hoch, Pfeile ▲▼ 37x30 (s09) und 41x33 (Liste). Unter 24x24: Fußnoten, `#`-Nummern, Brotkrume (Höhe), Kategorielinks. Unter 44: fast alles außer Suchfeld (49), Eingabe (47), Knöpfe (45). Fix: `padding-block` auf `.nummer`, `.marke-zitat`, `.pfad a`, `.fuss nav a` (min 24 px, besser 44). Pfeile sind mit 30 px mäßig, mit Abstand 0 nebeneinander in der Liste (Fehlklick-Gefahr beim Abstimmen). Prüfen: messung.json neu erzeugen.
4. Niedrig: Suchtreffer zeigen Auszüge mit „…“ an Stelle von Formeln („Aus … soll ein Ausdruck der Form … werden“). Bild: start-desktop-suche-viewport.png. Schlecht lesbar. Fix: Formel im Auszug durch kurzen Text oder Zeichen ersetzen oder Auszug vor Formeln wählen.
5. Niedrig: Statuszeile „Stichwortsuche bereit, das Sprachmodell lädt noch …“ blieb sichtbar, während die Treffer schon da waren (start-phone-suche-viewport.png). Kein Fehler, aber unklar, wann es endet.
6. Info: Treffer am Telefon gut lesbar, Links 77 bis 105 px hoch (mehrzeilig), Seite 360 px breit, kein Überlauf (start-phone-suche-voll.png).
7. Info: Desktop 1366: Spalte nur 736 px, links und rechts Muster. Gewollt, nichts kaputt (s09-desktop-viewport.png).
8. Info: Tablet entspricht Desktop-Spalte (768 px, 736 Inhalt); s09 hat eine Formel mit 939 px Inhalt in 542 px Kasten.
9. Info: Layout-Fehler wie Überlappung, abgeschnittener Text oder kaputte Bilder: in keinem der 24 Standardbilder gesehen. Schriftwechsel (Bricolage für Überschriften) ohne Sprung.

## Nicht geprüft
Echte Geräte (iOS, Firefox, WebKit), Landscape, 200 % Zoom, Tastaturfokus im Bild, Bildschirmlesertest, Druckansicht, hoher Kontrast, Moderationsseiten, Abstimmen (nicht angeklickt), `/eidl/api/`. Kontrast des Banners nur über die Grundfarbe berechnet, nicht über das Streifenmuster; Textmarker-Verlauf in H1 nicht gemessen.
