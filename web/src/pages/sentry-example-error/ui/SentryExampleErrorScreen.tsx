"use client";

import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { routes } from "@/shared/config";
import { BodyText } from "@/shared/ui/body-text";
import { Button, LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { showToast } from "@/shared/ui/sonner";
import { Title } from "@/shared/ui/title";

import { probeBackendFailure } from "../api/probe-backend-failure";
import { throwServerError } from "../api/throw-server-error";
import { SENTRY_PROBE_EMAIL, SENTRY_PROBE_PREFIX } from "../model/probe";

type ProbeProps = {
  title: string;
  hint: string;
  children: ReactNode;
  status?: string;
};

const Probe = ({ title, hint, children, status }: ProbeProps) => (
  <section className="flex w-full flex-col gap-2 text-left">
    <h2 className="text-list-row font-620">{title}</h2>
    <BodyText>{hint}</BodyText>
    {children}
    {status ? <BodyText role="status">{status}</BodyText> : null}
  </section>
);

// A render-phase throw, caught by app/error.tsx. Thrown during render, not
// in an effect, which react-hooks/set-state-in-effect would rule out anyway.
const RenderBomb = () => {
  throw new Error(`${SENTRY_PROBE_PREFIX} render error`);
};

// Debug screen for the owner: each button triggers one kind of failure so
// they can confirm it reaches Sentry (ADR 0041). Served outside production only.
export const SentryExampleErrorScreen = () => {
  const t = useTranslations("screens.sentryExampleError");
  const [sent, setSent] = useState(false);
  const [thrown, setThrown] = useState(false);
  const [scrubSent, setScrubSent] = useState(false);
  const [explode, setExplode] = useState(false);
  const [serverCalled, setServerCalled] = useState(false);
  const [backendProbed, setBackendProbed] = useState(false);

  if (explode) return <RenderBomb />;

  const sendExplicitly = () => {
    Sentry.withScope((scope) => {
      scope.setTag("debug_probe", "true");
      Sentry.captureException(new Error(`${SENTRY_PROBE_PREFIX} explicit captureException`));
    });
    setSent(true);
  };

  const throwInHandler = () => {
    setThrown(true);
    throw new Error(`${SENTRY_PROBE_PREFIX} unhandled error in a click handler`);
  };

  const sendWithEmail = () => {
    Sentry.withScope((scope) => {
      scope.setTag("debug_probe", "true");
      Sentry.captureException(
        new Error(`${SENTRY_PROBE_PREFIX} scrubbing check for ${SENTRY_PROBE_EMAIL}`),
      );
    });
    setScrubSent(true);
  };

  const callServerAction = async () => {
    setServerCalled(true);
    try {
      await throwServerError();
    } catch {
      // Expected: the failure is reported on the server side.
    }
  };

  // The toast path end to end: a server action reaches for a backend that
  // cannot answer and reports "unavailable", and the UI turns that into a
  // toast rather than a field error or a 500 (ADR 0046).
  const probeBackend = async () => {
    const result = await probeBackendFailure();

    setBackendProbed(true);
    showToast({
      message: result.status === "unavailable" ? t("toast.unavailable") : t("toast.reachable"),
      tone: result.status === "unavailable" ? "negative" : "positive",
    });
  };

  // All three tones at once, so the colours can be compared and the way the
  // region stacks them is visible.
  const showEveryTone = () => {
    showToast({ message: t("tones.neutral"), tone: "neutral" });
    showToast({ message: t("tones.positive"), tone: "positive" });
    showToast({ message: t("tones.negative"), tone: "negative" });
  };

  return (
    <CenteredState>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2 text-left">
          <Title>{t("title")}</Title>
          <BodyText>{t("intro", { prefix: SENTRY_PROBE_PREFIX })}</BodyText>
        </div>

        <Probe
          title={t("explicit.title")}
          hint={t("explicit.hint")}
          status={sent ? t("explicit.done") : undefined}
        >
          <Button variant="action" onPress={sendExplicitly}>
            {t("explicit.button")}
          </Button>
        </Probe>

        <Probe
          title={t("handler.title")}
          hint={t("handler.hint")}
          status={thrown ? t("handler.done") : undefined}
        >
          <Button variant="plain" onPress={throwInHandler}>
            {t("handler.button")}
          </Button>
        </Probe>

        <Probe
          title={t("scrub.title")}
          hint={t("scrub.hint", { email: SENTRY_PROBE_EMAIL })}
          status={scrubSent ? t("scrub.done") : undefined}
        >
          <Button variant="plain" onPress={sendWithEmail}>
            {t("scrub.button")}
          </Button>
        </Probe>

        <Probe title={t("render.title")} hint={t("render.hint")}>
          <Button variant="plain" onPress={() => setExplode(true)}>
            {t("render.button")}
          </Button>
        </Probe>

        <Probe
          title={t("toast.title")}
          hint={t("toast.hint")}
          status={backendProbed ? t("toast.done") : undefined}
        >
          <Button variant="plain" onPress={() => void probeBackend()}>
            {t("toast.button")}
          </Button>
        </Probe>

        <Probe title={t("tones.title")} hint={t("tones.hint")}>
          <Button variant="plain" onPress={showEveryTone}>
            {t("tones.button")}
          </Button>
        </Probe>

        <Probe
          title={t("action.title")}
          hint={t("action.hint")}
          status={serverCalled ? t("action.done") : undefined}
        >
          <Button variant="plain" onPress={callServerAction}>
            {t("action.button")}
          </Button>
        </Probe>

        <Probe title={t("serverRender.title")} hint={t("serverRender.hint")}>
          <LinkButton variant="plain" href={routes.sentryExampleErrorServer}>
            {t("serverRender.button")}
          </LinkButton>
        </Probe>
      </div>
    </CenteredState>
  );
};
