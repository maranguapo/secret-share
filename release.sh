#!/bin/bash
set -e

VERSION=$1
OVERWRITE=$2

if [ -z "$VERSION" ]; then
  echo "Uso: ./release.sh 1.0.0 [--overwrite]"
  exit 1
fi

if [ "$OVERWRITE" != "--overwrite" ]; then
  echo "→ Atualizando versão no package.json..."
  npm version $VERSION --no-git-tag-version

  echo "→ Commitando..."
  git add package.json
  git commit -m "chore: release v${VERSION}"
  git tag "v${VERSION}"
fi

echo "→ Buildando e publicando imagem..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t maranguapo/secret-share:${VERSION} \
  -t maranguapo/secret-share:latest \
  --push \
  .

if [ "$OVERWRITE" != "--overwrite" ]; then
  echo "→ Publicando no GitHub..."
  git push origin main --tags
fi

echo "✓ v${VERSION} publicado!"