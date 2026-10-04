# ADR 0020: viewport-fit=cover, theme-color и apple-touch-icon

## Контекст

Аудит готовности v1 (после ADR 0016–0019) обнаружил, что `RootLayout`
не экспортировал `viewport` — Next.js в этом случае подставляет только
`width=device-width, initial-scale=1`, без `viewport-fit=cover`. На
установленном PWA (`display: standalone`) это означает, что контент,
доходящий до края экрана (`bg-hero` на весь экран у `/soon` и
`/install`, кнопки у самого низа), не учитывает вырез и home indicator
iPhone — верстка может залезать под них или, наоборот, не использовать
safe-area отступ и выглядеть криво на iPhone с Dynamic Island.

Также отсутствовали `theme-color` (цвет строки состояния) и
`apple-touch-icon`/`apple-mobile-web-app-*` meta — на iOS они всё ещё
влияют на внешний вид иконки на домашнем экране и статус-бара сильнее,
чем `manifest.webmanifest`.

## Решение

В `web/src/app/layout/root-layout.tsx` добавлен статический экспорт
`viewport: Viewport` (`viewportFit: "cover"`, `themeColor: "#1e4a40"`
— тот же цвет, что `--hero`/`theme_color` в манифесте) и в
`generateMetadata` — `appleWebApp: { capable: true, statusBarStyle:
"default" }` + `icons.apple`, переиспользующий уже существующий
`/icons/icon-192.png` как временную замену настоящему
`apple-touch-icon` (180×180, без альфа-канала по гайдлайну Apple) —
до появления реальных иконок продукта это не блокирует релиз, только
косметика значка при добавлении на домашний экран.

## Последствия

- Экраны с `bg-hero` на весь экран (`/soon`, `/install`) должны
  использовать safe-area-отступы (`env(safe-area-inset-*)`) там, где
  контент подходит к самому краю — сейчас `CenteredState` центрирует
  всё с `px-8 py-10`, чего обычно достаточно, но при появлении
  полноэкранных элементов (шапка, липкий футер) это стоит проверить
  отдельно.
- Когда появятся настоящие иконки продукта — заменить
  `icons.apple` на выделенный файл `apple-touch-icon.png` (180×180,
  непрозрачный) вместо переиспользования `icon-192.png`.
