#!/usr/bin/env bash
# Holt den öffentlichen Stand der Beispielfragen vom Server: Antworten, wie die Moderation sie geprüft und bearbeitet hat, mit
# Kurztitel und Zitaten. `node site/build.mjs --stand <datei>` baut daraus die statischen Frageseiten; ohne das zeigt der Bau die
# Antworten aus Phase 1 und jede als ungeprüft, denn die Prüfung steht nur in public.db. Liest nur, ändert auf dem Server nichts.
#
# Umgebung:
#   VPS_HOST         user@<server>, in der gitignorten site/deploy.local.env
#   VPS_APP          /srv/hainrich2/app
#   VPS_DATA         /srv/hainrich2/data
#   HAINRICH2_STAND  wohin die Datei kommt; sonst $HAINRICH2_DATEN/work/stand-vom-host.json, HAINRICH2_DATEN aus der gitignorten .env.local
set -euo pipefail
cd "$(dirname "$0")"
[ -f ./deploy.local.env ] && . ./deploy.local.env
[ -f ../.env.local ] && . ../.env.local
VPS_HOST=${VPS_HOST:?VPS_HOST=user@host in site/deploy.local.env setzen}
VPS_APP=${VPS_APP:-/srv/hainrich2/app}
VPS_DATA=${VPS_DATA:-/srv/hainrich2/data}
ziel=${HAINRICH2_STAND:-${HAINRICH2_DATEN:?HAINRICH2_DATEN=<datenverzeichnis> in .env.local setzen}/work/stand-vom-host.json}

neu=$(mktemp "$ziel.XXXXXX")
trap 'rm -f "$neu"' EXIT
ssh "$VPS_HOST" "cd '$VPS_APP' && sudo -n -u hainrich2 /usr/bin/node --input-type=module - '$VPS_DATA/public.db'" < ../tools/stand-vom-host.mjs > "$neu"
# Eine halbe oder leere Antwort ersetzt den alten Stand nicht
node -e '
  const { stand, fragen } = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
  if (!Array.isArray(fragen) || !fragen.length) throw new Error("kein Stand: keine Beispielfragen in der Antwort");
  const antworten = fragen.flatMap(f => f.antworten);
  console.log(`stand-holen.sh: ${fragen.length} Beispielfragen vom ${stand.slice(0, 16).replace("T", " ")} UTC, ${antworten.filter(a => a.status === "geprüft").length} von ${antworten.length} Antworten geprüft, ${fragen.filter(f => f.kurztitel).length} mit Kurztitel`);
' "$neu"
chmod 644 "$neu"
mv "$neu" "$ziel"
trap - EXIT
echo "stand-holen.sh: $ziel"
