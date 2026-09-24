#!/bin/sh
# SOLO LECTURA: lista todos los grupos de cesar-comercial (JID + nombre).

URL=http://127.0.0.1:8080
INST=cesar-comercial

KEY=$(docker inspect agenda-cultural-bot --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
  | grep -E '^EVOLUTION_APIKEY=' | cut -d= -f2-)

curl -s -H "apikey: $KEY" "$URL/group/fetchAllGroups/$INST?getParticipants=false" \
  | tr '}' '\n' \
  | sed -n 's/.*"id":"\([^"]*@g\.us\)".*"subject":"\([^"]*\)".*/\1  |  \2/p'
