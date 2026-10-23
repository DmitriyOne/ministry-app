import { getTranslations } from "next-intl/server";

import { Button } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { ListCard } from "@/shared/ui/list-card";
import { ListRow } from "@/shared/ui/list-row";
import { Skeleton } from "@/shared/ui/skeleton";

// What `/profile` shows while the server answers (app/(with-bottom-nav)/
// profile/loading.tsx re-exports it). It is not a waiting screen in the
// sense ADR 0055 rejected: nothing is hidden behind it, the navigation
// stays put because it lives in the layout, and what is drawn here is
// the screen itself with three unknowns greyed out.
//
// Only what the DATABASE has to answer gets a plate. Almost everything
// on this screen is dictionary text — the eyebrow, every row title, the
// chevrons, "Sign out" — and it depends on nobody, so it is drawn for
// real and never moves when the data lands.
//
// Two things are deliberately absent rather than reserved:
//
//  * the unread dot on "What's new". It is a signal, not a field: a grey
//    disc of the same size would announce news that may not exist, and
//    somebody would reach for a row that has nothing to show.
//  * the admin's "New user" button. Whether it exists depends on a role
//    nobody knows yet, and holding a gap for it would mean showing
//    everyone a hole for the sake of one person. It appears with the
//    data, pushing "Sign out" down a little, and that is the cheaper of
//    the two costs.
//
// The tones are named once here rather than at every call site: the
// plates on white cards take the colour the rows already use for their
// dividers, and the ones on the deep green header have to be lighter
// than it instead of darker.
const BONE = "bg-ink-a09";
const BONE_ON_HERO = "bg-white/15";

export const ProfileScreenSkeleton = async () => {
  const t = await getTranslations("screens.profile");

  // Resolved here rather than called inside the JSX: the lint rule that
  // forbids literal strings in markup only recognises `t` as a
  // dictionary lookup, and a second translator reads as a literal to it.
  // Naming the two strings is also plainer than a second `t` would be.
  const push = await getTranslations("notifications.push");
  const pushTitle = push("title");
  const pushDescription = push("description");

  return (
    // Deliberately the same classes as ProfileScreen's CenteredState: the
    // two are the same screen in two states, and any difference here
    // would show up as a jump at the moment the data arrives.
    <CenteredState fill className="items-stretch justify-start gap-0 px-0 pt-2 pb-0 text-left">
      <div className="mx-3 flex flex-col gap-3.5 rounded-4xl bg-hero px-5 pt-6 pb-5.5 text-hero-foreground">
        <Eyebrow as="span" className="text-positive-hero">{t("title")}</Eyebrow>

        {/* Initials, name and role: the three things only the database
            can say. Sized to what they replace — 72px circle, the
            30px name line, the badge's height — so nothing resizes
            underneath the person's finger. */}
        <Skeleton className={`size-18 rounded-full ${BONE_ON_HERO}`} />

        <div className="flex flex-col gap-2">
          <Skeleton className={`h-8 w-2/3 rounded-lg ${BONE_ON_HERO}`} />
          {/* Two plates for the two pills. The status plate is the wider
              one because its labels are longer, and both are sized to
              let the real pills GROW into them rather than shrink: a pill
              that gets smaller when the data lands reads as a glitch. */}
          <div className="flex gap-2">
            <Skeleton className={`h-8 w-18 rounded-sm ${BONE_ON_HERO}`} />
            <Skeleton className={`h-8 w-28 rounded-sm ${BONE_ON_HERO}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        {/* The two goal plates, built out of the real card's own spacing
            rather than a guessed height: 18 top, the label's line, 14
            between, the number's line, 20 bottom. The grounds are the
            quiet grey of the white cards, not the greens — a green plate
            with nothing on it would read as a card that failed to load
            rather than one still loading. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3.5 rounded-2xl bg-ink-a05 px-4.5 pt-4.5 pb-5">
            <Skeleton className={`h-4 w-2/3 rounded-sm ${BONE}`} />
            <Skeleton className={`h-11 w-3/5 rounded-lg ${BONE}`} />
          </div>
          <div className="flex flex-col gap-3.5 rounded-2xl bg-ink-a05 px-4.5 pt-4.5 pb-5">
            <Skeleton className={`h-4 w-2/3 rounded-sm ${BONE}`} />
            <Skeleton className={`h-11 w-3/4 rounded-lg ${BONE}`} />
          </div>
        </div>

        <ListCard>
          {/* The row the toggle will render. Its title and description
              come from the same dictionary keys the toggle itself uses,
              so the text does not change when it mounts — only the
              switch resolves. The one case this does not cover is a
              device where notifications were refused, whose description
              differs; the row is the right height either way. */}
          <ListRow
            title={pushTitle}
            text={pushDescription}
            trailing={<Skeleton className={`h-8 w-13 shrink-0 rounded-full ${BONE}`} />}
          />
        </ListCard>

        <nav aria-label={t("linksLabel")}>
          <ListCard>
            {/* Rows without `href`: the destinations are known, but a
                screen that is still loading should not be navigable from
                a half-drawn list. They become links a moment later. */}
            <ListRow
              title={t("whatsNew")}
              trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
            />
            <ListRow
              title={t("about")}
              trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
            />
            <ListRow
              title={t("privacy")}
              divided={false}
              trailing={<ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />}
            />
          </ListCard>
        </nav>

        {/* A real button, disabled, rather than a plate: it is the right
            height by construction, and "you cannot sign out yet" is the
            truth for the moment it is on screen. */}
        <Button variant="plain" size="role-lg" isDisabled>
          {t("signOut")}
        </Button>
      </div>
    </CenteredState>
  );
};
