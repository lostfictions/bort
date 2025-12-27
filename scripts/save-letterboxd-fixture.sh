#!/usr/bin/env bash
set -euxo pipefail
for i in {1..3}; do
  curl -o "../fixtures/vidrand/letterboxd-response-$i.html" "https://letterboxd.com/filipe_furtado/list/2020-discoveries-the-b-list/page/$i/"
done