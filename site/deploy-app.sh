#!/usr/bin/env bash
# Liefert den Code von Web-Prozess und Worker nach /srv/hainrich2/app, den Korpus nach korpus/ und startet den Web-Prozess neu; der
# Worker ist eine Oneshot-Unit und nimmt den neuen Stand beim nächsten Lauf. Unit, Benutzer und Caddy gehören dem
# Server-Repo (~/files/work/server, Rolle hainrich2). Die Datenbank fasst dieses Skript nie an, sie lebt auf dem Server.
# Jeder echte Lauf braucht die Zustimmung des Eigentümers.
#
# Umgebung:
#   VPS_HOST   user@<server>, in der gitignorten site/deploy.local.env
#   VPS_APP    /srv/hainrich2/app
#   VPS_KORPUS /srv/hainrich2/korpus
#   KORPUS     corpus.json und vectors.json, Vorgabe ist das Arbeitsverzeichnis von Phase 1
#   DRY_RUN=1  zeigt, was rsync täte, lädt nichts hoch und startet nichts neu
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f site/deploy.local.env ] && . site/deploy.local.env
VPS_HOST=${VPS_HOST:?VPS_HOST=user@host in site/deploy.local.env setzen}
VPS_APP=${VPS_APP:-/srv/hainrich2/app}
VPS_KORPUS=${VPS_KORPUS:-/srv/hainrich2/korpus}
KORPUS=${KORPUS:-/media/konrad/xtraspace/hainrich2/work/phase1}

out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
node tools/app-files.mjs > "$out.liste"
# -r ausdrücklich: --files-from schaltet die Rekursion von -a ab, die Verzeichnisse blieben sonst leer.
rsync -ar --relative --files-from="$out.liste" ./ "$out/"
rm -f "$out.liste"

echo "deploy-app.sh: $out -> $VPS_HOST:$VPS_APP${DRY_RUN:+ (Probelauf)}"
rsync -a --chmod=D755,F644 --delete --itemize-changes ${DRY_RUN:+--dry-run} "$out/" "$VPS_HOST:$VPS_APP/"
rsync -a --chmod=D755,F644 --itemize-changes ${DRY_RUN:+--dry-run} "$KORPUS/corpus.json" "$KORPUS/vectors.json" "$VPS_HOST:$VPS_KORPUS/"
[ -n "${DRY_RUN:-}" ] || ssh "$VPS_HOST" sudo systemctl restart hainrich2-web
