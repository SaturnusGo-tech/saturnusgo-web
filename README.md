# 1) Сборка статики (экспорт делает next build при output:'export')
cd ../saturnusgo-landing.work
npm run build

# 2) Кладём явную метку версии, чтобы на GitHub был виден новый файл
date -u +"%Y-%m-%dT%H:%M:%SZ" > out/version.txt

# 3) Готовим пакет для публикации
rm -rf ../_deploy && mkdir -p ../_deploy
rsync -a out/ ../_deploy/

# 4) Сохраняем служебные файлы Pages
cd ../saturnusgo-web.github.io
[ -f CNAME ] && cp CNAME ../_deploy/
[ -f 404.html ] && cp 404.html ../_deploy/
touch ../_deploy/.nojekyll

# 5) Синхронизируем локальную ветку с удалённой main (убираем старые тяжёлые коммиты)
git fetch origin
git reset --hard origin/main

# 6) Публикуем артефакты в корень репозитория
rsync -a --delete ../_deploy/ . --exclude ".git" --exclude "_deploy"

# 7) Проверяем, что Git действительно видит изменения
git status --porcelain

# 8) Коммитим и пушим
git add -A
git commit -m "deploy: $(date -u '+%Y-%m-%d %H:%M:%SZ')"
git push origin main
# saturnusgo-web
# saturnusgo-landing
