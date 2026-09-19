import { getTranslations } from "next-intl/server";

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

// Витрина внутренняя (не индексируется, не часть UX приложения) — живой
// каталог компонентов из shared/ui, см. ADR 0012/0013/0014. Уровни
// заголовков: h1 — заголовок страницы, h2 — заголовки секций
// (SectionLabel), h3 — имя компонента (ComponentCard), h4 — заголовки
// внутри живых примеров.
export const ComponentsPage = async () => {
  const t = await getTranslations("showcase.components");

  const textRoles = [
    {
      label: "Eyebrow",
      spec: "11 / 600 · 0.14em",
      demo: <Eyebrow>{t("textRoles.eyebrow.demo")}</Eyebrow>,
      where: t("textRoles.eyebrow.where"),
    },
    {
      label: "Title (default)",
      spec: "32 / 640",
      demo: <Title as="h4">{t("textRoles.titleDefault.demo")}</Title>,
      where: t("textRoles.titleDefault.where"),
    },
    {
      label: "Title (compact)",
      spec: "30 / 620",
      demo: (
        <Title as="h4" size="compact">
          {t("textRoles.titleCompact.demo")}
        </Title>
      ),
      where: t("textRoles.titleCompact.where"),
    },
    {
      label: "BodyText",
      spec: "15 / 500 · 0.5",
      demo: <BodyText>{t("textRoles.bodyText.demo")}</BodyText>,
      where: t("textRoles.bodyText.where"),
    },
    {
      label: "SectionLabel",
      spec: "13 / 600 · 0.5",
      demo: <SectionLabel as="h4">{t("textRoles.sectionLabel.demo")}</SectionLabel>,
      where: t("textRoles.sectionLabel.where"),
    },
    {
      label: "Caption",
      spec: "12 / 520 · 0.38",
      demo: <Caption>{t("textRoles.caption.demo")}</Caption>,
      where: t("textRoles.caption.where"),
    },
    {
      label: "InlineError",
      spec: "13 / 540 · negative-hero",
      demo: <InlineError>{t("textRoles.inlineError.demo")}</InlineError>,
      where: t("textRoles.inlineError.where"),
    },
  ];

  return (
    <main className="flex flex-1 justify-center bg-background px-6 py-10">
      <div className="flex w-full max-w-290 flex-col gap-8">
        <header className="flex flex-col gap-1.5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Title>{t("title")}</Title>
          <BodyText className="max-w-155">{t("description")}</BodyText>
        </header>

        <section className="flex flex-col gap-4.5 rounded-3xl bg-card p-7 shadow-card">
          <SectionLabel>{t("matrixTitle")}</SectionLabel>
          <UsageMatrix />
        </section>

        <CatalogSection index={1} title={t("sections.frame")}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ComponentCard
              name="CenteredState"
              tag={t("cards.centeredState.tag")}
              description={t("cards.centeredState.description")}
              params={t("cards.centeredState.params")}
              screens={t("cards.centeredState.screens")}
            >
              <CenteredState className="min-h-47.5 w-full gap-4 overflow-hidden rounded-md p-5">
                <StatusGlyph code="404" />
                <TextBlock
                  align="center"
                  titleAs="h4"
                  title={t("cards.centeredState.demoTitle")}
                  text={t("cards.centeredState.demoText")}
                />
                <ActionStack maxWidth="260">
                  <Button variant="deep" size="role">
                    {t("cards.centeredState.demoAction")}
                  </Button>
                </ActionStack>
              </CenteredState>
            </ComponentCard>

            <ComponentCard
              name="TopAndBottomState"
              tag={t("cards.topAndBottomState.tag")}
              description={t("cards.topAndBottomState.description")}
              params={t("cards.topAndBottomState.params")}
              screens={t("cards.topAndBottomState.screens")}
            >
              <TopAndBottomState
                className="min-h-47.5 w-full rounded-md pt-6 pb-5"
                top={
                  <>
                    <AppMark size={44} tone="translucent" />
                    <Title as="h4" size="compact" tone="hero">
                      {t("cards.topAndBottomState.demoTitle")}
                    </Title>
                  </>
                }
                bottom={
                  <Button variant="action" size="role">
                    {t("cards.topAndBottomState.demoAction")}
                  </Button>
                }
              />
            </ComponentCard>

            <ComponentCard
              name="ScrollState"
              tag={t("cards.scrollState.tag")}
              description={t("cards.scrollState.description")}
              params={t("cards.scrollState.params")}
              screens={t("cards.scrollState.screens")}
            >
              <ScrollState
                eyebrow={t("cards.scrollState.eyebrow")}
                className="min-h-47.5 w-full rounded-md bg-background"
              >
                <HeroCard
                  titleAs="h4"
                  title={t("cards.scrollState.heroTitle")}
                  text={t("cards.scrollState.heroText")}
                />
                <ListCard>
                  <ListRow
                    titleAs="h5"
                    icon={<CalendarIcon />}
                    title={t("cards.scrollState.rowTitle")}
                    text={t("cards.scrollState.rowText")}
                  />
                </ListCard>
              </ScrollState>
            </ComponentCard>

            <ComponentCard
              name="ScreenHeader"
              tag={t("cards.screenHeader.tag")}
              description={t("cards.screenHeader.description")}
              params={t("cards.screenHeader.params")}
              screens={t("cards.screenHeader.screens")}
            >
              <ScreenHeader eyebrow={t("cards.screenHeader.eyebrow")} />
            </ComponentCard>
          </div>
        </CatalogSection>

        <CatalogSection index={2} title={t("sections.marks")}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ComponentCard
              name="AppMark"
              tag={t("cards.appMark.tag")}
              description={t("cards.appMark.description")}
              params={t("cards.appMark.params")}
              screens={t("cards.appMark.screens")}
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
              tag={t("cards.statusGlyph.tag")}
              description={t("cards.statusGlyph.description")}
              params={t("cards.statusGlyph.params")}
              screens={t("cards.statusGlyph.screens")}
            >
              <div className="flex items-center gap-6">
                <StatusGlyph code="404" tone="neutral" />
                <StatusGlyph code="500" tone="alert" />
              </div>
            </ComponentCard>
          </div>
        </CatalogSection>

        <CatalogSection index={3} title={t("sections.text")}>
          <div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card">
            <div className="flex flex-col gap-1.25">
              <h3 className="text-list-row font-620 tracking-list-row">
                {t("textRolesTitle")}
              </h3>
              <BodyText className="max-w-160">{t("textRolesDescription")}</BodyText>
            </div>
            <div className="flex flex-col">
              {textRoles.map((row, i, arr) => (
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

        <CatalogSection index={4} title={t("sections.actions")}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ComponentCard
              name="Button"
              tag={t("cards.button.tag")}
              description={t("cards.button.description")}
              params={t("cards.button.params")}
              screens={t("cards.button.screens")}
            >
              <div className="flex w-full flex-col gap-2.5">
                <Button variant="deep" size="role">
                  {t("cards.button.primaryAction")}
                </Button>
                <Button variant="alert" size="role">
                  {t("cards.button.retryAction")}
                </Button>
                <Button variant="plain" size="role">
                  {t("cards.button.offlineAction")}
                </Button>
              </div>
            </ComponentCard>

            <ComponentCard
              name="ActionStack"
              tag={t("cards.actionStack.tag")}
              description={t("cards.actionStack.description")}
              params={t("cards.actionStack.params")}
              screens={t("cards.actionStack.screens")}
            >
              <ActionStack maxWidth="260">
                <Button variant="deep" size="role">
                  {t("cards.actionStack.primaryAction")}
                </Button>
                <Button variant="plain" size="role">
                  {t("cards.actionStack.secondaryAction")}
                </Button>
              </ActionStack>
            </ComponentCard>
          </div>
        </CatalogSection>

        <CatalogSection index={5} title={t("sections.input")}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ComponentCard
              name="FieldCard + FieldRow"
              tag={t("cards.fieldCardRow.tag")}
              description={t("cards.fieldCardRow.description")}
              params={t("cards.fieldCardRow.params")}
              screens={t("cards.fieldCardRow.screens")}
            >
              <div className="w-full rounded-md bg-hero p-5">
                <FieldCard>
                  <FieldRow
                    label={t("cards.fieldCardRow.emailLabel")}
                    placeholder={t("cards.fieldCardRow.emailPlaceholder")}
                  />
                  <FieldRow
                    label={t("cards.fieldCardRow.passwordLabel")}
                    secure
                    defaultValue={t("cards.fieldCardRow.passwordDemoValue")}
                  />
                </FieldCard>
              </div>
            </ComponentCard>

            <ComponentCard
              name="PillForm"
              tag={t("cards.pillForm.tag")}
              description={t("cards.pillForm.description")}
              params={t("cards.pillForm.params")}
              screens={t("cards.pillForm.screens")}
            >
              <PillFormDemo />
            </ComponentCard>

            <div className="lg:col-span-2">
              <ComponentCard
                name={t("cards.validationDemo.name")}
                tag={t("cards.validationDemo.tag")}
                description={t("cards.validationDemo.description")}
                params={t("cards.validationDemo.params")}
                screens={t("cards.validationDemo.screens")}
              >
                <ValidationFormDemo />
              </ComponentCard>
            </div>
          </div>
        </CatalogSection>

        <CatalogSection index={6} title={t("sections.content")}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ComponentCard
              name="HeroCard"
              tag={t("cards.heroCard.tag")}
              description={t("cards.heroCard.description")}
              params={t("cards.heroCard.params")}
              screens={t("cards.heroCard.screens")}
            >
              <div className="w-full">
                <HeroCard
                  titleAs="h4"
                  title={t("cards.heroCard.demoTitle")}
                  text={t("cards.heroCard.demoText")}
                />
              </div>
            </ComponentCard>

            <ComponentCard
              name="ListCard + ListRow"
              tag={t("cards.listCardRow.tag")}
              description={t("cards.listCardRow.description")}
              params={t("cards.listCardRow.params")}
              screens={t("cards.listCardRow.screens")}
            >
              <div className="w-full">
                <ListCard>
                  <ListRow
                    titleAs="h4"
                    icon={<CalendarIcon size={20} />}
                    title={t("cards.listCardRow.dayTitle")}
                    text={t("cards.listCardRow.dayText")}
                  />
                  <ListRow
                    titleAs="h4"
                    title={t("cards.listCardRow.goalsTitle")}
                    text={t("cards.listCardRow.goalsText")}
                  />
                </ListCard>
              </div>
            </ComponentCard>
          </div>
        </CatalogSection>
      </div>
    </main>
  );
};
