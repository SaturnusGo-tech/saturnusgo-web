#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Запускать ИЗ репозитория Pages: saturnusgo-web.github.io
# Скрипт:
#  1) собирает экспорт в ../saturnusgo-landing.work (BUILD_TARGET=export)
#  2) копирует в ../_deploy
#  3) синхронизирует в текущий репозиторий Pages и пушит в main
# ─────────────────────────────────────────────────────────────

LANDING_REPO="../saturnusgo-landing.work"
STAGE="../_deploy"
PAGES_REPO="$(pwd)"                  # текущий каталог — корень Pages
OUT_DIR="$LANDING_REPO/out"

echo "› Проверка путей…"
[ -d "$LANDING_REPO" ] || { echo "❌ Не найден $LANDING_REPO"; exit 1; }
[ -d "$PAGES_REPO/.git" ] || { echo "❌ Текущая папка не похожа на git-репозиторий Pages"; exit 1; }

echo "› Сборка статики (Next, output: export)…"
cd "$LANDING_REPO"

# Важно: если используешь переключатель в next.config.js,
# этот env заставит build идти в режиме export (и Next сам положит файлы в /out).
BUILD_TARGET=export npm run build

# Явная метка версии (чтобы Git видел новый файл)
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$OUT_DIR/version.txt"

# Быстрый sanity check
[ -d "$OUT_DIR" ] || { echo "❌ После сборки нет $OUT_DIR"; exit 1; }
[ -f "$OUT_DIR/index.html" ] || { echo "❌ В $OUT_DIR нет index.html — export не сгенерировался"; exit 1; }

echo "› Подготовка staging каталога…"
rm -rf "$STAGE" && mkdir -p "$STAGE"
rsync -a "$OUT_DIR"/ "$STAGE"/

echo "› Копируем служебные файлы Pages…"
cd "$PAGES_REPO"
[ -f CNAME ]    && cp CNAME    "$STAGE/"
[ -f 404.html ] && cp 404.html "$STAGE/"
touch "$STAGE/.nojekyll"

echo "› Синхронизация с origin/main…"
git fetch origin
git reset --hard origin/main

echo "› Публикуем артефакты в корень репозитория Pages…"
# Полное замещение (кроме .git)
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
rsync -a --delete "$STAGE"/ . --exclude ".git" --exclude "_deploy"

echo "› Проверяем diff…"
git status --porcelain

echo "› Коммит и пуш…"
git add -A
# Если .gitignore вдруг отрезает html/js/css — форсанём на всякий случай
git add -f .

# Если изменений реально нет — git commit упадёт. Поймаем и сообщим.
if git commit -m "deploy: $(date -u '+%Y-%m-%d %H:%M:%SZ')"; then
  git push origin main
  echo "✅ Pages обновлены."
else
  echo "ℹ️ Нет изменений для коммита — вероятно, контент идентичен предыдущему."
fi
