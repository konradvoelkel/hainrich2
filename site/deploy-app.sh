#!/usr/bin/env bash
# Liefert den Code von Web-Prozess und Worker nach /srv/hainrich2/app, den Korpus nach korpus/ und startet den Web-Prozess neu; der
# Worker ist eine Oneshot-Unit und nimmt den neuen Stand beim nächsten Lauf. Unit, Benutzer und Caddy gehören dem
# Server-Repo (~/files/work/server, Rolle hainrich2). Die Datenbank fasst dieses Skript nie an, sie lebt auf dem Server.
# Jeder echte Lauf braucht die Zustimmung des Eigentümers.
#
# Alle Schritte laufen über eine einzige SSH-Verbindung. Der Server begrenzt neue SSH-Verbindungen je Zeit und wies am 2026-11-16 die
# dritte ab, den Neustart: Die neuen Dateien lagen da schon unter dem alten Prozess. So trifft die Bremse nur noch den Anfang, bevor
# etwas übertragen ist. Scheitert ein späterer Schritt, sagt die letzte Zeile, was schon auf dem Server liegt.
#
# Umgebung:
#   VPS_HOST   user@<server>, in der gitignorten site/deploy.local.env
#   VPS_APP    /srv/hainrich2/app
#   VPS_KORPUS /srv/hainrich2/korpus
#   KORPUS     corpus.json und vectors.json; Vorgabe ist $HAINRICH2_DATEN/work/korpus-aktuell wie bei site/build.mjs --korpus, HAINRICH2_DATEN aus der gitignorten .env.local
#   WARTEN     wie viele Sekunden der letzte Schritt nach dem Neustart auf die erste Antwort wartet, Vorgabe 60
#   DRY_RUN=1  zeigt, was rsync täte, lädt nichts hoch und startet nichts neu; der letzte Schritt liest dann nur den Zustand der Unit
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f site/deploy.local.env ] && . site/deploy.local.env
[ -f .env.local ] && . .env.local
VPS_HOST=${VPS_HOST:?VPS_HOST=user@host in site/deploy.local.env setzen}
VPS_APP=${VPS_APP:-/srv/hainrich2/app}
VPS_KORPUS=${VPS_KORPUS:-/srv/hainrich2/korpus}
WARTEN=${WARTEN:-60}
KORPUS=${KORPUS:-${HAINRICH2_DATEN:?HAINRICH2_DATEN=<datenverzeichnis> in .env.local setzen}/work/korpus-aktuell}

out=$(mktemp -d)
ctl=$(mktemp -d)
# Der erste Aufruf öffnet die Verbindung, alle weiteren nehmen sie über den Socket. `-O exit` am Ende schließt sie sofort.
SSH=(ssh -o ControlMaster=auto -o "ControlPath=$ctl/v" -o ControlPersist=30)
schritt='Zusammenstellen'
lage='nichts übertragen'
# was auf dem Server liegt, falls der nächste Schritt scheitert; im Probelauf ändert sich dort nichts
stand() { if [ -n "${DRY_RUN:-}" ]; then lage='Probelauf, auf dem Server ist nichts verändert'; else lage=$1; fi; }
ende() {
  local status=$?
  "${SSH[@]}" -O exit "$VPS_HOST" 2>/dev/null || true
  rm -rf "$out" "$out.liste" "$ctl"
  [ "$status" -eq 0 ] || echo "deploy-app.sh: gescheitert bei „$schritt“ (Status $status): $lage." >&2
}
trap ende EXIT

node tools/app-files.mjs > "$out.liste"
# -r ausdrücklich: --files-from schaltet die Rekursion von -a ab, die Verzeichnisse blieben sonst leer.
rsync -ar --relative --files-from="$out.liste" ./ "$out/"

schritt='Verbindung'
lage='nichts übertragen. Bei „Connection refused“ ist es fast immer die Ratenbegrenzung für SSH am Server: eine Minute warten, nicht nachproben'
"${SSH[@]}" "$VPS_HOST" true

echo "deploy-app.sh: $out -> $VPS_HOST:$VPS_APP${DRY_RUN:+ (Probelauf)}"
schritt='Code'
stand 'der Code kann halb übertragen sein, der Web-Prozess läuft mit dem alten weiter: noch einmal starten'
rsync -a -e "${SSH[*]}" --chmod=D755,F644 --delete --itemize-changes ${DRY_RUN:+--dry-run} "$out/" "$VPS_HOST:$VPS_APP/"
schritt='Korpus'
stand 'der Code ist übertragen, der Korpus vielleicht nicht, der Web-Prozess läuft mit dem alten Code weiter: noch einmal starten'
rsync -a -e "${SSH[*]}" --chmod=D755,F644 --itemize-changes ${DRY_RUN:+--dry-run} "$KORPUS/corpus.json" "$KORPUS/vectors.json" "$VPS_HOST:$VPS_KORPUS/"
schritt='Neustart'
stand "Code und Korpus sind übertragen, aber hainrich2-web ist nicht neu gestartet oder läuft nicht stabil: ssh $VPS_HOST sudo systemctl restart hainrich2-web"
if [ -n "${DRY_RUN:-}" ]; then
  echo "deploy-app.sh: hainrich2-web ist $("${SSH[@]}" "$VPS_HOST" systemctl is-active hainrich2-web || true), im Probelauf kein Neustart"
else
  # Die Unit ist vom Typ simple mit Restart=always: Ein Prozess, der beim Start stirbt, sieht zwischendurch aktiv aus. Die Zahl der
  # automatischen Neustarts verrät ihn.
  "${SSH[@]}" "$VPS_HOST" 'sudo systemctl restart hainrich2-web && sleep 5 && systemctl is-active --quiet hainrich2-web && [ "$(systemctl show -p NRestarts --value hainrich2-web)" = 0 ]'
  # Aktiv heißt nicht, dass er antwortet: Beim Start schreibt der Prozess erst alle Seiten neu und packt sie. Am 2026-11-17 kam die
  # erste Antwort elf Sekunden nach dem Neustart (gemessen im Server-Repo, seit die Unit eine CPUQuota von einem Kern hat); die Prüfung
  # oben war da schon grün. Erst die Anmeldeseite der Moderation zeigt, dass er Anfragen bedient. Sie kommt ohne Anmeldung mit 200.
  schritt='Antwort'
  url="$(sed -n 's/^SITE_ORIGIN=//p' site/site.env)$(sed -n 's/^SITE_BASE=//p' site/site.env)mod/"
  stand "hainrich2-web ist neu gestartet und aktiv, antwortet aber nach $WARTEN Sekunden nicht unter $url: ssh $VPS_HOST journalctl -u hainrich2-web -n 50"
  seit=$SECONDS
  until [ "$(curl -s -o /dev/null --max-time 5 -w '%{http_code}' "$url" || true)" = 200 ]; do
    [ $((SECONDS - seit)) -lt "$WARTEN" ] || exit 1
    sleep 1
  done
  echo "deploy-app.sh: hainrich2-web neu gestartet, aktiv ohne automatischen Neustart, antwortet (rund $((SECONDS - seit + 5)) Sekunden nach dem Neustart)"
fi
