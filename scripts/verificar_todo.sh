#!/usr/bin/env bash
# LA PUERTA DE CIERRE (23-ago): nada se declara «100 %» sin que ESTE script termine en verde.
# Corre TODAS las verificaciones contra un server (por defecto producción :3111) y deja un informe.
# Uso: scripts/verificar_todo.sh [base_url] [cdp_port] [cuadrante]
#   base_url  → PETRA_BASE (defecto http://localhost:3111)
#   cdp_port  → ventana real en el HDMI para FPS/ojo (defecto 9333, panel 1)
# Exit 0 solo si TODO pasa. Informe en /tmp/petra-verificacion/<fecha>.md
set -u
cd "$(dirname "$0")/.." || exit 2
BASE="${1:-http://localhost:3111}"; CDP="${2:-9333}"; CUAD="${3:-1}"
export PETRA_BASE="$BASE" PETRA_CDP="$CDP" PETRA_CUADRANTE="$CUAD"
OUT=/tmp/petra-verificacion; mkdir -p "$OUT"; INF="$OUT/$(date +%F_%H%M).md"
FALLOS=0; paso() { # nombre, comando…  — pega la salida al informe y cuenta fallos
  local n="$1"; shift; echo "== $n" | tee -a "$INF"
  if "$@" >>"$INF" 2>&1; then echo "   ✓ $n" | tee -a "$INF"; else echo "   ✗ $n (exit $?)" | tee -a "$INF"; FALLOS=$((FALLOS+1)); fi
}
echo "# Verificación total · $(date '+%F %H:%M') · $BASE" > "$INF"
curl -sf -o /dev/null "$BASE/" || { echo "server $BASE no responde" | tee -a "$INF"; exit 2; }

paso "tsc"                pnpm exec tsc --noEmit
paso "clásica desktop"    python3 scripts/test_clasica.py
paso "clásica móvil"      python3 scripts/test_clasica.py movil
paso "i18n clásica+3D"    python3 scripts/i18n_check.py
paso "auditoría web"      python3 scripts/audit_web.py
paso "3D geo2"            python3 scripts/bateria.py geo2
paso "3D compra"          python3 scripts/bateria.py compra
# ventana REAL en el HDMI (FPS de verdad, no swiftshader)
python3 scripts/hp.py abrir / >/dev/null 2>&1
paso "3D shots+FPS (HDMI)" python3 scripts/bateria.py shots
if [ -f scripts/ojo.py ]; then
  for r in / /salon /te /te-premium /nosotros /contacto /carrito; do
    paso "OJO $r" python3 scripts/ojo.py "$r"
    [ -f scripts/cruzar_ojos.py ] && paso "cruce ojos $r" python3 scripts/cruzar_ojos.py "$r"
  done
fi
[ -f scripts/interaccion.py ] && paso "interacción 3D" python3 scripts/interaccion.py desktop
python3 scripts/hp.py cerrar >/dev/null 2>&1

echo | tee -a "$INF"
if [ "$FALLOS" -eq 0 ]; then echo "✓✓ TODO EN VERDE — informe: $INF" | tee -a "$INF"; exit 0
else echo "✗ $FALLOS bloques con fallos — informe: $INF" | tee -a "$INF"; exit 1; fi
