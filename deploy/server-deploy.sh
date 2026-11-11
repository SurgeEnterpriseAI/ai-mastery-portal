#!/bin/bash
# Deploy TensorPath to Surge's own server (7 Nov 2026, off Vercel).
# Usage (from the repo, Git Bash): bash deploy/server-deploy.sh
# Ships the committed HEAD (git archive), keeps the server's .env.production,
# builds the image on the server, then swaps the containers.
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${HOST:-surgeai-ts}
DIR=/srv/apps/tensorpath
SHA=$(git rev-parse --short=8 HEAD)
# Commit date of HEAD: the build reads REVISION_DATE (no .git on the server) for sitemap lastmod.
COMMIT_DATE=$(git log -1 --format=%cI HEAD)
echo "shipping $SHA to $HOST:$DIR"
git archive --format=tar HEAD | ssh "$HOST" "sudo mkdir -p $DIR && sudo chown \$(id -u):\$(id -g) $DIR && cd $DIR && find . -mindepth 1 -maxdepth 1 ! -name .env.production -exec rm -rf {} + && tar -xf - && echo $SHA > REVISION && echo $COMMIT_DATE > REVISION_DATE"
ssh "$HOST" "cd $DIR && test -f .env.production && docker compose -f docker-compose.prod.yml build app && docker compose -f docker-compose.prod.yml up -d && docker image prune -f >/dev/null"
for i in $(seq 1 30); do
  code=$(ssh "$HOST" "curl -s -o /dev/null -w '%{http_code}' -m 10 http://127.0.0.1:6570/" || true)
  [ "$code" = "200" ] && { echo "up: $SHA"; exit 0; }
  sleep 5
done
echo "not answering on 127.0.0.1:6570 after deploy"; exit 1
