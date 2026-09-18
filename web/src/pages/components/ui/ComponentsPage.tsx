import { ActionStack } from "@/shared/ui/action-stack";
import { AppMark } from "@/shared/ui/app-mark";
import { BodyText } from "@/shared/ui/body-text";
import { Button } from "@/shared/ui/button";
import { Caption } from "@/shared/ui/caption";
import { CenteredState } from "@/shared/ui/centered-state";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { FieldCard, FieldRow } from "@/shared/ui/field-card";
import { HeroCard } from "@/shared/ui/hero-card";
import { CalendarIcon } from "@/shared/ui/icons";
import { InlineError } from "@/shared/ui/inline-error";
import { ListCard, ListRow } from "@/shared/ui/list-card";
import { ScreenHeader } from "@/shared/ui/screen-header";
import { ScrollState } from "@/shared/ui/scroll-state";
import { SectionLabel } from "@/shared/ui/section-label";
import { StatusGlyph } from "@/shared/ui/status-glyph";
import { TextBlock } from "@/shared/ui/text-block";
import { Title } from "@/shared/ui/title";
import { TopAndBottomState } from "@/shared/ui/top-and-bottom-state";

import { CatalogSection, ComponentCard } from "./catalog-section";
import { PillFormDemo } from "./pill-form-demo";
import { UsageMatrix } from "./usage-matrix";
import { ValidationFormDemo } from "./validation-form-demo";

const TEXT_ROLES = [
  {
    label: "Eyebrow",
    spec: "11 / 600 · 0.14em",
    demo: <Eyebrow>О приложении</Eyebrow>,
    where: "О приложении, Coming soon",
  },
  {
    label: "Title (default)",
    spec: "32 / 640",
    demo: <Title as="h4">Учёт служения</Title>,
    where: "404, 500, Coming soon, Вход",
  },
  {
    label: "Title (compact)",
    spec: "30 / 620",
    demo: (
      <Title as="h4" size="compact">
        Доступно только с телефона
      </Title>
    ),
    where: "Desktop block",
  },
  {
    label: "BodyText",
    spec: "15 / 500 · 0.5",
    demo: <BodyText>Такого раздела нет или он был перемещён. Проверьте ссылку.</BodyText>,
    where: "все экраны",
  },
  {
    label: "SectionLabel",
    spec: "13 / 600 · 0.5",
    demo: <SectionLabel as="h4">Возможности</SectionLabel>,
    where: "О приложении",
  },
  {
    label: "Caption",
    spec: "12 / 520 · 0.38",
    demo: <Caption>Код ошибки: SRV-500 · 03.09.2026</Caption>,
    where: "500, Вход, Coming soon",
  },
  {
    label: "InlineError",
    spec: "13 / 540 · negative-hero",
    demo: <InlineError>Проверьте почту и пароль</InlineError>,
    where: "Вход",
  },
];

// Витрина внутренняя (не индексируется, не часть UX приложения) — живой
// каталог компонентов из shared/ui, см. ADR 0012/0013. Уровни заголовков:
// h1 — заголовок страницы, h2 — заголовки секций (SectionLabel), h3 — имя
// компонента (ComponentCard), h4 — заголовки внутри живых примеров.
export const ComponentsPage = () => (
  <main className="flex flex-1 justify-center bg-background px-6 py-10">
    <div className="flex w-full max-w-290 flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <Eyebrow>Учёт служения · разбор</Eyebrow>
        <Title>Компоненты экранов</Title>
        <BodyText className="max-w-155">
          Шесть экранов — 404, 500, Coming soon, Вход, Только с телефона, О
          приложении — собраны из 18 повторяющихся частей. Ниже: матрица
          использования и живой каталог с вариантами и параметрами.
        </BodyText>
      </header>

      <section className="flex flex-col gap-4.5 rounded-3xl bg-card p-7 shadow-card">
        <SectionLabel>Матрица использования</SectionLabel>
        <UsageMatrix />
      </section>

      <CatalogSection index={1} title="Каркас экрана">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ComponentCard
            name="CenteredState"
            tag="каркас"
            description="Экран одного состояния: всё по центру по обеим осям, колонка с gap 26, padding 40/32, выравнивание текста по центру. Слоты: glyph → текстовый блок → стек действий → сноска."
            params="background: warm | deep · glyph · title · text · actions[] · footnote?"
            screens="404, 500, Coming soon, Desktop block"
          >
            <CenteredState className="min-h-47.5 w-full gap-4 overflow-hidden rounded-md p-5">
              <StatusGlyph code="404" />
              <TextBlock
                align="center"
                titleAs="h4"
                title="Страница не найдена"
                text="Такого раздела нет или он был перемещён."
              />
              <ActionStack maxWidth="260">
                <Button variant="deep" size="role">
                  На главный экран
                </Button>
              </ActionStack>
            </CenteredState>
          </ComponentCard>

          <ComponentCard
            name="TopAndBottomState"
            tag="каркас"
            description="Экран ввода: шапка прижата к верху (padding-top 96), форма и кнопки — к низу, под большой палец. Фон — глубокий зелёный, карточка формы белая."
            params="mark · title · text · form · actions[] · footnote"
            screens="Вход"
          >
            <TopAndBottomState
              className="min-h-47.5 w-full rounded-md pt-6 pb-5"
              top={
                <>
                  <AppMark size={44} tone="translucent" />
                  <Title as="h4" size="compact" tone="hero">
                    Учёт служения
                  </Title>
                </>
              }
              bottom={
                <Button variant="action" size="role">
                  Войти
                </Button>
              }
            />
          </ComponentCard>

          <ComponentCard
            name="ScrollState"
            tag="каркас"
            description="Контентный экран: фиксированная шапка с кнопкой «назад», ниже прокручиваемая колонка карточек с gap 16 и padding 6/20/40."
            params="header{back, eyebrow} · sections[]"
            screens="О приложении"
          >
            <ScrollState eyebrow="О приложении" className="min-h-47.5 w-full rounded-md bg-background">
              <HeroCard
                titleAs="h4"
                title="Учёт служения"
                text="Часы, изучения Библии, цели по месяцу и служебному году."
              />
              <ListCard>
                <ListRow
                  titleAs="h5"
                  icon={<CalendarIcon />}
                  title="День"
                  text="Строка с иконкой — для разделов приложения."
                />
              </ListCard>
            </ScrollState>
          </ComponentCard>

          <ComponentCard
            name="ScreenHeader"
            tag="навигация"
            description="Круглая белая кнопка 38 px с шевроном и надзаголовок раздела рядом. Нажатие — scale(0.94)."
            params="eyebrow · onBack · backLabel"
            screens="О приложении"
          >
            <ScreenHeader eyebrow="О приложении" />
          </ComponentCard>
        </div>
      </CatalogSection>

      <CatalogSection index={2} title="Опознавательные знаки">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ComponentCard
            name="AppMark"
            tag="4 размера"
            description="Знак в скруглённом квадрате — один и тот же во всём приложении (группа людей). На светлом фоне плашка глубокая зелёная, на зелёном — белая с прозрачностью 0.12. Радиус растёт вместе с размером: 14 / 16 / 18 / 24. Декоративный по умолчанию (aria-hidden)."
            params="size: 44 | 52 | 56 | 88 · tone: solid | translucent · elevated? · label?"
            screens="Coming soon, Вход, Desktop block, О приложении"
          >
            <div className="flex w-full gap-3.5">
              <div className="flex flex-1 items-center justify-center gap-4 rounded-md bg-background p-5">
                <AppMark size={44} tone="solid" />
                <AppMark size={88} tone="solid" elevated />
              </div>
              <div className="flex flex-1 items-center justify-center gap-4 rounded-md bg-hero p-5">
                <AppMark size={52} tone="translucent" />
                <AppMark size={56} tone="translucent" />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard
            name="StatusGlyph"
            tag="2 тона"
            description="Круг 104 px с кодом состояния: нейтральный для 404, терракотовый для 500. Цифры табличные, 34/620."
            params="code · tone: neutral | alert"
            screens="404, 500"
          >
            <div className="flex items-center gap-6">
              <StatusGlyph code="404" tone="neutral" />
              <StatusGlyph code="500" tone="alert" />
            </div>
          </ComponentCard>
        </div>
      </CatalogSection>

      <CatalogSection index={3} title="Текст">
        <div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card">
          <div className="flex flex-col gap-1.25">
            <h3 className="text-list-row font-620 tracking-list-row">Текстовые роли</h3>
            <BodyText className="max-w-160">
              Пять текстовых роли плюс InlineError. Заголовок и абзац всегда идут парой в
              колонке — это единый блок TextBlock.
            </BodyText>
          </div>
          <div className="flex flex-col">
            {TEXT_ROLES.map((row, i, arr) => (
              <div key={row.label}>
                <div className="flex flex-wrap items-center gap-5 py-3.5">
                  <span className="w-32.5 shrink-0 text-caption font-600 text-ink-a45">
                    {row.label}
                  </span>
                  <span className="w-32.5 shrink-0 text-caption font-500 text-ink-a45 tabular-nums">
                    {row.spec}
                  </span>
                  <span className="min-w-0 flex-1">{row.demo}</span>
                  <span className="text-caption font-500 text-ink-a40">{row.where}</span>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-ink-a07" />}
              </div>
            ))}
          </div>
        </div>
      </CatalogSection>

      <CatalogSection index={4} title="Действия">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ComponentCard
            name="Button"
            tag="5 вариантов"
            description="Одна кнопка: высота 50, радиус 17, текст 16/580, нажатие scale(0.98). Меняется только заливка — она и задаёт роль."
            params="variant: deep | action | alert | plain | heroGhost · size: role | role-lg"
            screens="404, 500, Coming soon, Вход"
          >
            <div className="flex w-full flex-col gap-2.5">
              <Button variant="deep" size="role">
                На главный экран
              </Button>
              <Button variant="alert" size="role">
                Повторить попытку
              </Button>
              <Button variant="plain" size="role">
                Работать оффлайн
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard
            name="ActionStack"
            tag="раскладка"
            description="Колонка кнопок: gap 10, ширина 100% при max-width 260 на экранах-состояниях и во всю карточку на экране входа. Первая кнопка — основное действие."
            params="actions[] · maxWidth: 260 | full"
            screens="404, 500, Вход"
          >
            <ActionStack maxWidth="260">
              <Button variant="deep" size="role">
                На главный экран
              </Button>
              <Button variant="plain" size="role">
                Открыть профиль
              </Button>
            </ActionStack>
          </ComponentCard>
        </div>
      </CatalogSection>

      <CatalogSection index={5} title="Ввод">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ComponentCard
            name="FieldCard + FieldRow"
            tag="форма"
            description="Белая карточка (радиус 24, padding 8/18) со строками поля внутри: надпись капсом 10 px, значение 17/560, между строками линия 1 px. Справа опциональная иконка-действие 32 px."
            params="rows[{label, value, placeholder, secure, errors}]"
            screens="Вход"
          >
            <div className="w-full rounded-md bg-hero p-5">
              <FieldCard>
                <FieldRow label="Эл. почта" placeholder="имя@почта.ру" />
                <FieldRow label="Пароль" secure defaultValue="тайный-пароль" />
              </FieldCard>
            </div>
          </ComponentCard>

          <ComponentCard
            name="PillForm"
            tag="форма"
            description="Одно поле и кнопка в строку, капсульный радиус — осознанное исключение из унификации 17–26 (см. ADR 0012). Ниже — успешное состояние (role=status) и подпись-подсказка."
            params="value/onValueChange · submitted · successText · hint"
            screens="Coming soon"
          >
            <PillFormDemo />
          </ComponentCard>

          <div className="lg:col-span-2">
            <ComponentCard
              name="FieldCard + FieldError — живой пример"
              tag="react-hook-form + zod"
              description="Отправьте форму пустой: под каждым полем появится своя ошибка (shadcn FieldError, role=alert), рамка+кольцо станут красными, кнопка «Отправить» заблокируется; начните печатать — ошибка этого поля погаснет и кнопка разблокируется, когда ошибок не останется (reValidateMode: onChange)."
              params="Controller + zodResolver, схема и useForm — в слайсе витрины, не в shared/ui"
              screens="Вход (сценарий валидации)"
            >
              <ValidationFormDemo />
            </ComponentCard>
          </div>
        </div>
      </CatalogSection>

      <CatalogSection index={6} title="Контентные блоки">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ComponentCard
            name="HeroCard"
            tag="карточка"
            description="Тёмно-зелёная карточка радиусом 26 со знаком, названием 24/640 и описанием на белом с прозрачностью 0.6. Открывает контентный экран."
            params="title · text · titleAs (h2 по умолчанию)"
            screens="О приложении"
          >
            <div className="w-full">
              <HeroCard
                titleAs="h4"
                title="Учёт служения"
                text="Приложение для личного отчёта о служении: часы, изучения Библии, цели по месяцу и служебному году."
              />
            </div>
          </ComponentCard>

          <ComponentCard
            name="ListCard + ListRow"
            tag="2 вида строк"
            description="Список <ul>/<li> радиусом 22, padding 4/16. Строка: иконка-плитка 38 px (опционально, декоративная), заголовок 16/580 и описание 13/500. Разделитель у всех строк, кроме последней."
            params="rows[{icon?, title, text, titleAs}] (h3 по умолчанию)"
            screens="О приложении"
          >
            <div className="w-full">
              <ListCard>
                <ListRow
                  titleAs="h4"
                  icon={<CalendarIcon size={20} />}
                  title="День"
                  text="Строка с иконкой — для разделов приложения."
                />
                <ListRow
                  titleAs="h4"
                  title="Личные цели"
                  text="Строка без иконки — для описания возможностей."
                />
              </ListCard>
            </div>
          </ComponentCard>
        </div>
      </CatalogSection>
    </div>
  </main>
);
