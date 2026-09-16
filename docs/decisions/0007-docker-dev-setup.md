# ADR 0007: Обновлённый dev-Docker-сетап — кэш-слои, non-root, `compose watch`, разделение URL Supabase

> **Статус: заменено ADR 0009.** Контейнерный запуск `web`
> (`ops/local/{Dockerfile,docker-compose.yml}`) удалён целиком — `pnpm
> dev` (Next.js нативно, Supabase через CLI/Docker) полностью покрывает
> локальную разработку, а контейнерный режим добавлял сложность (два URL
> Supabase, права `node_modules` под pnpm 12 и т.п.) без реальной пользы
> на этом этапе. См. ADR 0009. Оставлено как есть — история решений и
> найденных при этом багов (баг с `NEXT_PUBLIC_SUPABASE_URL`, конфликт
> `verifyDepsBeforeRun` с non-root) остаётся ценной, даже если сама
> реализация больше не используется.

> Дополняет ADR 0003 (общее решение "Next.js нативно на хосте + Supabase в
> Docker, docker-compose — опциональный путь"). Здесь — конкретная
> реализация `ops/local/{Dockerfile,docker-compose.yml}` второй итерации.

## Контекст

Первая версия `ops/local/Dockerfile` была нарочно простой: `node:22-slim`,
`COPY . .` целиком, затем `pnpm install` без кэширования слоёв, запуск от
root. Работало, но:
- Любое изменение кода в репозитории инвалидировало слой `pnpm install`
  (COPY . . шёл раньше install) — пересборка занимала ~17 секунд каждый
  раз, даже без изменения зависимостей.
- Без `docker compose watch` любое изменение `web/` требовало
  пересобирать образ и пересоздавать контейнер (`up --build`) даже для
  правки одной строки.
- Контейнер бежал от root — не страшно для локальной dev-песочницы, но не
  best practice.
- **Баг**: `NEXT_PUBLIC_SUPABASE_URL` переопределялся в compose на
  `http://host.docker.internal:54321`. Так как `NEXT_PUBLIC_*` вшивается в
  клиентский JS-бандл на этапе сборки/рендера, браузер (на хосте, не в
  контейнере) получал URL `host.docker.internal`, который снаружи Docker
  (на macOS/обычной сети) не резолвится — клиентские запросы к Supabase
  из браузера были бы битыми.

## Решение

### Dockerfile
- `node:24-slim` (актуальный LTS в момент правки).
- `corepack enable`, версия pnpm берётся из `package.json#packageManager`
  во время сборки (`corepack prepare --activate "$(node -p ...)"`) — не
  хардкодится в Dockerfile отдельной строкой, которая может разойтись с
  `package.json`.
- Слои в порядке возрастания частоты изменений: сначала только манифесты
  (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`,
  `web/package.json`, `backend/package.json`), затем `pnpm install
  --frozen-lockfile` с `--mount=type=cache` на pnpm store (кэш пакетов
  переживает пересборки, не потерянный слой), и только потом `COPY . .`
  с остальным кодом.
- Запуск от `USER node` (нерутовый пользователь, уже есть в официальном
  образе Node.js) — `COPY --chown=node:node . .` для слоя с исходниками,
  чтобы dev-сервер мог писать `.next/` и т.п.

### docker-compose.yml — hot reload
`develop.watch`: `action: sync` для `web/` (кроме `node_modules/` и
`.next/`) — правки файлов внутри контейнера подхватываются без пересборки
образа; `action: rebuild` при изменении `web/package.json` или
корневого `pnpm-lock.yaml` — новые зависимости требуют пересобрать образ.
`pnpm docker:local` → `docker compose -f ops/local/docker-compose.yml up
--build --watch` (актуальный флаг Compose v2.22+; альтернативная форма —
отдельная команда `docker compose watch`, для скрипта выбран `up
--build --watch` как один самодостаточный вызов).

### Баг с NEXT_PUBLIC_SUPABASE_URL — разделение адресов
- `NEXT_PUBLIC_SUPABASE_URL` **не переопределяется** в
  `docker-compose.yml` — берётся как есть из `envs/web.local.env`
  (`http://127.0.0.1:54321`), потому что именно это значение попадает в
  клиентский бандл и должно быть корректным с точки зрения браузера на
  хосте.
- Добавлена отдельная **серверная** опциональная переменная
  `SUPABASE_INTERNAL_URL` (см. `docs/decisions/0006-*.md`,
  `web/src/shared/config/env.ts`) — в `docker-compose.yml` она
  выставлена в `http://host.docker.internal:54321`. Без неё (например,
  при нативном `pnpm dev`) серверный код использует
  `NEXT_PUBLIC_SUPABASE_URL` как раньше — переменная опциональна именно
  для этого.
- Серверный Supabase-клиент (`shared/api/supabase/server.ts`) и
  health-запрос в `DayPage` берут URL через
  `getSupabaseServerUrl()` (= `SUPABASE_INTERNAL_URL` ??
  `NEXT_PUBLIC_SUPABASE_URL`), а не напрямую `env.NEXT_PUBLIC_SUPABASE_URL`.
  Браузерный клиент (`shared/api/supabase/client.ts`) — как и раньше,
  только `env.NEXT_PUBLIC_SUPABASE_URL`.

### Имя auth-cookie

Разделение URL (публичный/`SUPABASE_INTERNAL_URL`) вскрыло второй,
связанный баг: `@supabase/ssr` по умолчанию выводит имя cookie/`storageKey`
из хоста Supabase-URL — `` sb-${hostname.split('.')[0]}-auth-token ``.
Проверено реальным запуском `createBrowserClient`/`createServerClient` из
установленного `node_modules/@supabase/ssr`:

```
browser (127.0.0.1)           storageKey: sb-127-auth-token
server (host.docker.internal) storageKey: sb-host-auth-token
```

В режиме `pnpm docker:local` браузер (на хосте, `127.0.0.1`) и сервер
(внутри контейнера, `host.docker.internal`) получают **разные** имена
cookie для одной и той же сессии — сервер не видит то, что записал
браузер (см. также supabase/ssr#36). Баг не специфичен для Docker: он же
проявился бы при любом расхождении hostname между браузером и сервером
(например, `localhost` в одном месте и `127.0.0.1` в другом).

**Решение**: зафиксировать имя cookie явно и одинаково по обе стороны —
`SUPABASE_AUTH_COOKIE_NAME = "sb-ministry-auth-token"`
(`web/src/shared/api/supabase/constants.ts`), передаётся как
`cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME }` и в
`createBrowserClient` (`client.ts`), и в `createServerClient`
(`server.ts`). Тем же запуском подтверждено, что после фиксации имя
совпадает независимо от хоста:

```
browser (127.0.0.1)           storageKey: sb-ministry-auth-token
server (host.docker.internal) storageKey: sb-ministry-auth-token
server (127.0.0.1, native)    storageKey: sb-ministry-auth-token
Match (browser === server/docker): true
```

Дополнительное условие, без которого фиксации имени cookie недостаточно:
`site_url`/`additional_redirect_urls` в `backend/supabase/config.toml`
должны быть на том же origin (схема + хост + порт), что и браузер —
иначе cookie теряется уже на самом редиректе auth-провайдера, до того как
имя cookie вообще имеет значение. Проверено: `site_url` уже был
`http://127.0.0.1:3000`, но `additional_redirect_urls` — ошибочно
`https://127.0.0.1:3000` (не та схема, дефолт из `supabase init`);
выровнено на `http://127.0.0.1:3000`.

### Аддендум: `verifyDepsBeforeRun` (pnpm 12) ломал non-root запуск

После перехода на pnpm 12 (`docs/decisions/0008-*.md`) контейнер перестал
стартовать: `pnpm exec next dev` от имени `node` падал с
`ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR` / `Permission denied` при
попытке удалить файл в `node_modules`. Причина — новый дефолт
`verifyDepsBeforeRun: install` (pnpm ≥ 11): `pnpm exec`/`pnpm run`
самостоятельно перепроверяют и при необходимости переустанавливают
`node_modules` перед каждым запуском, а `node_modules` в образе был создан
слоем `RUN pnpm install`, выполнявшимся **до** `USER node` — то есть от
root. Пользователь `node` не мог писать в root-владеемые файлы.

Исправлено в корне, не отключением проверки: `pnpm install` в Dockerfile
теперь тоже выполняется от `node` (`USER node` — до, а не после install),
с `chown -R node:node "$PNPM_HOME" /workspace` перед этим и
`--mount=type=cache,...,uid=1000,gid=1000` на кэше pnpm-стора, чтобы и сам
кэш был доступен на запись тому же пользователю. `node_modules`
изначально создаётся владельцем `node` — `verifyDepsBeforeRun` больше
не на что жаловаться.

## Последствия

- Повторная сборка образа без изменения зависимостей — секунды, а не
  ~17 секунд (кэш `pnpm install` переиспользуется).
- Любой будущий middleware/proxy-клиент Supabase (сейчас в проекте его
  нет) обязан передавать тот же `cookieOptions: { name:
  SUPABASE_AUTH_COOKIE_NAME }` — иначе разъезжание имён вернётся.
- Если у auth-провайдера (или `site_url`) появится третий origin (прод,
  превью и т.п.) — для каждого нужен свой согласованный набор
  `site_url`/`additional_redirect_urls`, а имя cookie остаётся общим,
  фиксированным.
- Редактирование файла в `web/` во время `pnpm docker:local` подхватывается
  без `docker compose up --build` — проверено логом/curl до и после правки.
- Если понадобится задеплоить `web` в собственную (не Vercel)
  Docker-инфраструктуру — `ops/local/Dockerfile` всё ещё НЕ прод-образ
  (нет multi-stage, нет `output: standalone`); понадобится отдельный
  прод-Dockerfile.
- Любая новая server-only переменная, значение которой должно отличаться
  внутри контейнера от хоста, должна следовать тому же паттерну:
  публичная (`NEXT_PUBLIC_*`) переменная не трогается, добавляется
  отдельная опциональная server-only переменная с фолбэком на публичную.
