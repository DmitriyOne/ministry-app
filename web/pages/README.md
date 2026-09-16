# Зачем эта пустая папка

Next.js App Router резервирует директорию `pages` (в корне пакета или в
`src/`) под legacy Pages Router. Если рядом с `app/` (наш App Router) нет
вообще никакой директории `pages`, Next при любом расположении обнаруживает
`web/src/pages/**` — FSD-слой "pages" в этом проекте — и либо падает с
ошибкой `pages and app directories should be under the same folder`, либо
начинает трактовать файлы внутри `src/pages` как страницы legacy Pages
Router (требуя от них `default export` и т.п.).

Если же пустая (кроме этого README) `web/pages/` присутствует рядом с
`web/app/` — Next.js считает, что Pages Router уже "определён" здесь (и он
пуст), и перестаёт сканировать `src/pages` вообще. `src/pages` в таком
случае остаётся свободным именем для FSD-слоя `pages`.

Подробности и рассмотренные альтернативы — `docs/decisions/0004-fsd-pages-layer-named-pages.md`.

**Не добавляйте сюда файлы.** Эта папка должна оставаться пустой (кроме
этого README) — как только в ней появится `page.tsx`/`layout.tsx` и т.п.,
она станет настоящим Pages Router.
