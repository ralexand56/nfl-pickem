#!/bin/zsh
# Dev server against the Neon "groups" branch (process env beats .env.local).
set -a; source ./.env.groups.local; set +a
export OWNER_EMAILS=ralexand56@gmail.com
case "$POSTGRES_URL" in *ep-nameless-mountain*) ;; *) echo "refusing: not the groups branch"; exit 1;; esac
exec npx next dev --turbopack -p 3001
