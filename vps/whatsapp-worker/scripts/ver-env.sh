#!/bin/sh
# Muestra la estructura de .env sin exponer los valores.
# Uso: sh scripts/ver-env.sh
cd /root/whatsapp-worker || exit 1

awk '
{
  n = index($0, "=")
  if (n > 0) {
    printf "%3d: %-28s len=%d\n", NR, substr($0, 1, n - 1), length($0)
  } else if (length($0) > 0) {
    printf "%3d: [SIN =] %s\n", NR, substr($0, 1, 60)
  }
}
' .env

echo
echo "=== Líneas 20 a 34 (primeros 30 caracteres) ==="
awk 'NR>=20 && NR<=34 { printf "%3d| %s\n", NR, substr($0, 1, 30) }' .env
