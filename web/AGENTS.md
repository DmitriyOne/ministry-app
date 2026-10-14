<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Этот каталог — только часть проекта

Блок выше пишет `next dev` (`upsertAgentRulesBlock` заменяет ровно то,
что между маркерами, — всё за их пределами переживает перегенерацию).
Ниже — наше.

Правила проекта лежат **в корне репозитория**, а не здесь:

- [`../CLAUDE.md`](../CLAUDE.md) — структура, FSD, дизайн-система, доступ,
  договорённости. Главный документ.
- [`../AGENTS.md`](../AGENTS.md) — короткий вход для агентов.
- [`../docs/decisions/`](../docs/decisions) — ADR.

Что важно знать до правки файлов именно в `web/`:

- Слои FSD — `app → pages → widgets → features → entities → shared`,
  импорты только «вниз», наружу слайс отдаёт то, что в его `index.ts`.
  Проверяет `steiger` (`pnpm lint`).
- `web/pages/` (пустая) — щит от Pages Router. Настоящий слой —
  `web/src/pages/`.
- Ни одной строки текста в разметке: всё через `next-intl`
  (`shared/config/i18n/messages/en-GB.json`).
- Цвета, размеры, радиусы и тени — только токенами из
  `app/styles/globals.css`.
- Классы объединяются через `@/shared/lib/cn`, не пакетом `cn` напрямую.
- Функции и компоненты — стрелочные; пропсы — `type`, не `interface`.

Команды запускаются **из корня репозитория** (`pnpm dev`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`), а не отсюда: env-файлы связывает корневой
`package.json`.
