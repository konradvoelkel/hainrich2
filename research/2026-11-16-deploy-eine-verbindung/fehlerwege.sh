#!/usr/bin/env bash
# Lässt site/deploy.sh und site/deploy-app.sh in einer Kopie gegen Attrappen von ssh und rsync laufen und prüft, was sie bei einem
# Fehler in jedem Schritt melden. Ohne Netz: Die Kopie hat keine deploy.local.env, das Ziel heißt niemand@deploy.invalid, und dieser
# Name löst nie auf, auch wenn eine Attrappe fehlte.
#
#   research/2026-11-16-deploy-eine-verbindung/fehlerwege.sh
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
t=$(mktemp -d)
trap 'rm -rf "$t"' EXIT

mkdir -p "$t/repo/site" "$t/repo/tools" "$t/bin" "$t/baum/eidl" "$t/korpus"
cp "$repo/site/deploy.sh" "$repo/site/deploy-app.sh" "$t/repo/site/"
echo "console.log('package.json')" > "$t/repo/tools/app-files.mjs"
echo '{}' > "$t/repo/package.json"
touch "$t/baum/eidl/index.html" "$t/baum/robots.txt" "$t/korpus/corpus.json" "$t/korpus/vectors.json"

# ssh: schreibt mit, was verlangt wird, und scheitert dort, wo SCHEITERT_BEI es sagt
cat > "$t/bin/ssh" <<'EOF'
#!/usr/bin/env bash
echo "ssh $*" >> "$PROTOKOLL"
case "$*" in
  *"-O exit"*) exit 0 ;;
  *"systemctl restart"*) [ "$SCHEITERT_BEI" != neustart ] || { echo 'ssh: connect to host deploy.invalid port 22: Connection refused' >&2; exit 255; }
                         [ "$SCHEITERT_BEI" != instabil ] || exit 1 ;;
  *"is-active"*) echo active ;;
  *" true") [ "$SCHEITERT_BEI" != verbindung ] || { echo 'ssh: connect to host deploy.invalid port 22: Connection refused' >&2; exit 255; } ;;
esac
EOF
# rsync: Das Zusammenstellen auf der eigenen Platte macht das echte rsync, alles mit Ziel auf dem Server nur die Attrappe
cat > "$t/bin/rsync" <<'EOF'
#!/usr/bin/env bash
case "$*" in *deploy.invalid:*) ;; *) exec /usr/bin/rsync "$@" ;; esac
echo "rsync $*" >> "$PROTOKOLL"
case "$*" in
  */app/) [ "$SCHEITERT_BEI" != code ] || { echo 'rsync error: error in rsync protocol data stream (code 12)' >&2; exit 12; } ;;
  */korpus/) [ "$SCHEITERT_BEI" != korpus ] || exit 12 ;;
  */www/) [ "$SCHEITERT_BEI" != www ] || exit 12 ;;
esac
echo '<f.st...... datei'
EOF
chmod +x "$t/bin/ssh" "$t/bin/rsync"

fehler=0
# lauf <skript> <echt|probe> <scheitert bei> <erwarteter Status> <erwartetes Stück der letzten Zeile>
lauf() {
  local skript=$1 art=$2 bei=$3 soll=$4 stueck=$5 status=0 letzte pfade urteil=ja probelauf=()
  [ "$art" != probe ] || probelauf=(DRY_RUN=1)
  : > "$t/protokoll"
  env -i PATH="$t/bin:/usr/bin:/bin" HOME="$t" PROTOKOLL="$t/protokoll" SCHEITERT_BEI="$bei" "${probelauf[@]}" \
    VPS_HOST=niemand@deploy.invalid HAINRICH2_SITE="$t/baum" KORPUS="$t/korpus" "$t/repo/site/$skript" > "$t/ausgabe" 2>&1 || status=$?
  letzte=$(tail -n 1 "$t/ausgabe")
  pfade=$({ grep -o 'ControlPath=[^ ]*' "$t/protokoll" || true; } | sort -u | wc -l)
  [ "$status" = "$soll" ] && [[ "$letzte" == *"$stueck"* ]] || urteil=NEIN
  # über alle Aufrufe eines Laufs derselbe Socket, die Verbindung am Ende geschlossen, im Probelauf kein Neustart
  if [ "$skript" = deploy-app.sh ]; then
    [ "$pfade" = 1 ] && grep -q -- '-O exit' "$t/protokoll" || urteil=NEIN
    [ "$art" != probe ] || ! grep -q 'systemctl restart' "$t/protokoll" || urteil=NEIN
  fi
  [ "$urteil" = ja ] || fehler=1
  printf '%-14s %-5s %-10s Status %-3s Aufrufe %s, wie erwartet: %s\n    %s\n' "$skript" "$art" "${bei:-nichts}" "$status" "$(wc -l < "$t/protokoll")" "$urteil" "$letzte"
}

lauf deploy-app.sh echt  ''         0   'neu gestartet, nach fünf Sekunden aktiv'
lauf deploy-app.sh echt  verbindung 255 'gescheitert bei „Verbindung“ (Status 255): nichts übertragen. Bei „Connection refused“'
lauf deploy-app.sh echt  code       12  'gescheitert bei „Code“ (Status 12): der Code kann halb übertragen sein'
lauf deploy-app.sh echt  korpus     12  'gescheitert bei „Korpus“ (Status 12): der Code ist übertragen, der Korpus vielleicht nicht'
lauf deploy-app.sh echt  neustart   255 'gescheitert bei „Neustart“ (Status 255): Code und Korpus sind übertragen, aber hainrich2-web ist nicht neu gestartet'
lauf deploy-app.sh echt  instabil   1   'gescheitert bei „Neustart“ (Status 1): Code und Korpus sind übertragen'
lauf deploy-app.sh probe ''         0   'hainrich2-web ist active, im Probelauf kein Neustart'
lauf deploy-app.sh probe verbindung 255 'gescheitert bei „Verbindung“ (Status 255): nichts übertragen'
lauf deploy-app.sh probe code       12  'gescheitert bei „Code“ (Status 12): Probelauf, auf dem Server ist nichts verändert'
lauf deploy.sh     echt  ''         0   '<f.st...... datei'
lauf deploy.sh     echt  www        12  'gescheitert (Status 12). Steht oben „Connection refused“, ist nichts übertragen'
lauf deploy.sh     probe www        12  'gescheitert (Status 12): Probelauf, auf dem Server ist nichts verändert'
[ "$fehler" = 0 ] && echo 'Alle Fehlerwege melden, was erwartet ist.' || { echo 'MINDESTENS EIN LAUF WEICHT AB.' >&2; exit 1; }
