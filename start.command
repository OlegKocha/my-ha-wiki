#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if command -v node >/dev/null 2>&1 && node --version >/dev/null 2>&1; then
  ha_node="$(command -v node)"
else
  ha_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$ha_node" ]]; then
  echo 'Для запуска нужен Node.js 20 или новее.'
  exit 1
fi
"$ha_node" build.mjs || exit 1
exec "$ha_node" serve.mjs
