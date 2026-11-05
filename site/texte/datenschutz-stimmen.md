## Abstimmen

Über Fragen abstimmen können alle, ohne Kurscode und ohne Konto. Wer nur liest, sendet dabei nichts, und im Browser entsteht nichts. Erst beim Klick auf einen Pfeil legt die Seite im `localStorage` Ihres Browsers für diese Frage eine Zufallszahl und Ihre Stimme ab. Das ist kein Cookie. Mit der Zufallszahl lässt sich die Stimme später ändern.

An den Server gehen die Frage, die Zufallszahl und die Stimme. Gespeichert werden nur die Frage, ein Hash der Zufallszahl und die Stimme, keine IP-Adresse. Weil jede Frage ihre eigene Zufallszahl bekommt, lassen sich Ihre Stimmen auf dem Server nicht einander zuordnen. Öffentlich steht nur die Summe. Außerdem zählt der Server je Tag, wie viele Stimmen eingehen, ohne Bezug zu einer Person. Die Stimmen liegen in der Datenbank des Forums und damit bis zu sechs Monate in deren Sicherungen.

Um massenhaftes Abstimmen zu bremsen, zählt der Server die Stimmen je IP-Adresse eine Stunde lang im Arbeitsspeicher; gespeichert wird das nicht. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO: das Interesse, Fragen danach zu sortieren, was andere nützlich finden.

