#!/usr/bin/env bash
# Liefert den Code des Web-Prozesses nach /srv/hainrich2/app und startet ihn neu. Unit, Benutzer und Caddy gehören dem
# Server-Repo (~/files/work/server, Rolle hainrich2). Die Datenbank fasst dieses Skript nie an, sie lebt auf dem Server.
# Jeder echte Lauf braucht die Zustimmung des Eigentümers.
#
# Umgebung:
#   VPS_HOST   user@<server>, in der gitignorten site/deploy.local.env
#   VPS_APP    /srv/hainrich2/app
#   DRY_RUN=1  zeigt, was rsync täte, lädt nichts hoch und startet nichts neu
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f site/deploy.local.env ] && . site/deploy.local.env
VPS_HOST=${VPS_HOST:?VPS_HOST=user@host in site/deploy.local.env setzen}
VPS_APP=${VPS_APP:-/srv/hainrich2/app}

out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
node tools/app-files.mjs > "$out.liste"
rsync -a --relative --files-from="$out.liste" ./ "$out/"
rm -f "$out.liste"

echo "deploy-app.sh: $out -> $VPS_HOST:$VPS_APP${DRY_RUN:+ (Probelauf)}"
rsync -a --chmod=D755,F644 --delete --itemize-changes ${DRY_RUN:+--dry-run} "$out/" "$VPS_HOST:$VPS_APP/"
[ -n "${DRY_RUN:-}" ] || ssh "$VPS_HOST" sudo systemctl restart hainrich2-web
