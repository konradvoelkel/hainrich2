#!/usr/bin/env bash
# Liefert den fertigen Baum aus site/build.mjs per rsync in den Docroot des Servers. Caddy, Name,
# Kopfzeilen und Zertifikat gehören dem Server-Repo (~/files/work/server, Rolle hainrich2), dieses
# Skript liefert nur Dateien. Es baut nicht selbst: Hochgeladen wird genau der Baum, gegen den
# `npm run smoke` gelaufen ist. Jeder echte Lauf braucht die Zustimmung des Eigentümers.
#
# Umgebung:
#   VPS_HOST        user@<server>, in der gitignorten site/deploy.local.env
#   VPS_WWW         /srv/hainrich2/www
#   HAINRICH2_SITE  der gebaute Baum; sonst $HAINRICH2_DATEN/site wie in site/serve.mjs, HAINRICH2_DATEN aus der gitignorten .env.local
#   DRY_RUN=1       zeigt, was rsync täte, lädt nichts hoch
set -euo pipefail
cd "$(dirname "$0")"
[ -f ./deploy.local.env ] && . ./deploy.local.env
[ -f ../.env.local ] && . ../.env.local
VPS_HOST=${VPS_HOST:?VPS_HOST=user@host in site/deploy.local.env setzen}
VPS_WWW=${VPS_WWW:-/srv/hainrich2/www}
out=${HAINRICH2_SITE:-${HAINRICH2_DATEN:?HAINRICH2_DATEN=<datenverzeichnis> in .env.local setzen}/site}

# --delete gegen einen leeren Baum leert den Docroot, und das Datenverzeichnis kann ein Volume sein, das gerade nicht eingehängt ist.
if [ ! -f "$out/eidl/index.html" ] || [ ! -f "$out/robots.txt" ]; then
  echo "deploy.sh: kein fertiger Baum unter $out, erst node site/build.mjs" >&2
  exit 1
fi

# Dieses Skript braucht nur eine Verbindung. Weist die Ratenbegrenzung für neue SSH-Verbindungen am Server sie ab, ist nichts übertragen; bricht rsync später ab, kann der Docroot
# halb neu sein, und ein zweiter Lauf bringt ihn in Ordnung.
ende() {
  local status=$?
  [ "$status" -ne 0 ] || return 0
  if [ -n "${DRY_RUN:-}" ]; then
    echo "deploy.sh: gescheitert (Status $status): Probelauf, auf dem Server ist nichts verändert." >&2
  else
    echo "deploy.sh: gescheitert (Status $status). Steht oben „Connection refused“, ist nichts übertragen, fast immer die Ratenbegrenzung für SSH am Server: eine Minute warten, nicht nachproben. Sonst kann der Docroot halb übertragen sein: noch einmal starten." >&2
  fi
}
trap ende EXIT

echo "deploy.sh: $out -> $VPS_HOST:$VPS_WWW${DRY_RUN:+ (Probelauf)}"
# Kanonische Zeile aus Playbook §3.10: --chmod ohne --no-perms, kein grep hinter rsync.
rsync -a --chmod=D755,F644 --delete --itemize-changes ${DRY_RUN:+--dry-run} "$out/" "$VPS_HOST:$VPS_WWW/"
