# ADR 0008: pnpm 12.4.1, `allowBuilds` вместо `onlyBuiltDependencies`, `strictDepBuilds`

> Дополняет ADR 0002 (выбор pnpm вместо npm) — здесь конкретная версия и
> настройки, актуальные на момент правки.

## Контекст

Репозиторий был на pnpm 10.15.0 с настройками сборки зависимостей
(`onlyBuiltDependencies`) в поле `"pnpm"` корневого `package.json`. По
документации pnpm (`context7 /pnpm/pnpm.io`):
- В pnpm 11 поле `pnpm` в `package.json` **больше не читается вообще** —
  все настройки (включая `overrides`, ограничения на build-скрипты и т.п.)
  переехали в `pnpm-workspace.yaml`.
- В pnpm 11 `onlyBuiltDependencies`/`neverBuiltDependencies`/
  `ignoredBuiltDependencies` заменены единой картой `allowBuilds:
  { <pkg>: true | false }`.
- В pnpm 11+ по умолчанию включены: `strictDepBuilds: true` (неразрешённый
  build-скрипт — ошибка установки, а не тихое предупреждение),
  `minimumReleaseAge: 1440` (пакеты моложе суток по умолчанию не
  разрешаются к установке — защита от supply-chain атак через
  только что опубликованные вредоносные версии), `blockExoticSubdeps: true`,
  `verifyDepsBeforeRun: install`.
- На момент правки `npm view pnpm dist-tags` показывает `"latest":
  "12.4.1"` — то есть pnpm 12, а не 11.x, уже официальный `latest`-тег на
  npm (вопреки формулировке из блога о релизе 12.0, где на момент публикации
  той заметки `npm`-тег `latest` ещё указывал на 11.x — с тех пор это
  изменилось).

## Варианты

1. **Остаться на pnpm 10.x** — не читает `allowBuilds`/новые дефолты
  вообще, но: (а) прямо противоречит прямому указанию перейти на
  актуальную версию; (б) не имеет `strictDepBuilds`/`minimumReleaseAge` —
  то есть репозиторий не получает эти supply-chain-защиты.
2. **pnpm 11.x (`latest-11`, на момент правки 11.27.0)** — уже поддерживает
  `allowBuilds`/`strictDepBuilds`/`minimumReleaseAge`, более консервативный
  выбор, если 12.x окажется недостаточно обкатанной.
3. **pnpm 12.4.1 (текущий `latest` на npm)** — проверены официальные
  breaking changes 12.0 (git-зависимости как identity, ошибка на
  нераспознанных настройках в `pnpm-workspace.yaml`, детерминизм лок-файлов
  циклических графов, `packageImportMethod: auto` сначала хардлинк на
  Linux, `engineStrict` по рёбрам графа, а не по поддереву, глобальные
  команды отказываются работать под `sudo`) — ни один из этих пунктов не
  затрагивает данный проект (нет git-протокольных зависимостей, нет
  циклических peer-графов, `sudo` не используется, `engineStrict` не
  включён). 12.0 вышла 2026-08-26, к моменту правки (2026-09-14) — три
  недели и несколько патч-релизов (12.1–12.4.1), то есть не "день релиза".

## Решение

Выбран вариант 3 — **pnpm 12.4.1**, установлен через `corepack use
pnpm@12.4.1` (записал в `package.json#packageManager` с integrity-хешем).
Причины: это уже официальный `latest` на npm, ни один breaking change 12.0
не затрагивает проект, а флаг "если что-то ломает — бери 11.x" не
сработал — ничего не сломалось.

`pnpm-workspace.yaml`:
```yaml
allowBuilds:
  esbuild: true       # @serwist/turbopack + наш devDependency
  "@swc/core": true   # транзитивная зависимость @serwist/turbopack
  unrs-resolver: false # есть пребилженный бинарник, постинсталл не нужен
strictDepBuilds: true  # явно, хотя это и так дефолт с v11
```
Поле `"pnpm"` удалено из корневого `package.json`.

`unrs-resolver` (транзитивная зависимость `eslint-import-resolver-typescript`
из `eslint-config-next`) — проверено через `pnpm --filter web why
unrs-resolver --recursive`; её build-скрипт не разрешён (`false`), так как
пакет ставит нативный бинарник через `optionalDependencies`, а `pnpm lint`
и без выполнения её postinstall-скрипта работает штатно — постинсталл ей
не нужен, поэтому не выдаём ей разрешение "про запас".

### `minimumReleaseAge` на практике

При первом `pnpm install` под pnpm 12 пересборка лок-файла реально
упёрлась в `minimumReleaseAge` дважды:
- `lucide-react@1.46.0` (опубликован в день правки) — заблокирован
  установкой (`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`).
- `zod@4.6.5` (опубликован накануне, ~21–22 часа до момента установки) —
  формально прошёл, но pnpm сам дописал `minimumReleaseAgeExclude:
  [zod@4.6.5]` в `pnpm-workspace.yaml` (новая автоматическая функция —
  "оптимистичное" исключение вместо жёсткого отказа), пограничный случай
  по времени.

Оба раза выбрано **не** полагаться на `minimumReleaseAgeExclude` (и тем
более не отключать `minimumReleaseAge` глобально), а закрепить в
`web/package.json` точную, уже созревшую (> суток) версию:
`lucide-react@1.45.0`, `zod@4.6.3`. Это соответствует духу самой защиты
(не устанавливать то, что могло быть скомпрометировано в первые часы после
публикации) и не оставляет в `pnpm-workspace.yaml` растущий список
исключений при каждом обновлении зависимостей.

## Последствия

- `pnpm --version` из корня — `12.4.1`, совпадает с
  `package.json#packageManager`.
- `pnpm install` проходит без интерактивных вопросов и без ошибок.
- При добавлении новой прямой зависимости с build-скриптом — сначала
  проверять `pnpm --filter web why <pkg> --recursive` (действительно ли
  она нужна и зачем), только затем добавлять в `allowBuilds`; не добавлять
  вслепую по одному только предупреждению об игнорировании скрипта.
- При добавлении зависимости, опубликованной < 24 часов назад — либо
  подождать, либо явно зафиксировать более старую созревшую версию (как
  сделано здесь), а не добавлять её в `minimumReleaseAgeExclude` без
  особой причины.
- `ops/local/Dockerfile` уже берёт версию pnpm из
  `package.json#packageManager` (`corepack prepare --activate "$(node -p
  ...)"`) — новую версию подхватывает без изменений в самом Dockerfile;
  проверено пересборкой образа (см. отчёт).
