"use client";

import { useTranslations } from "next-intl";

import { WEB_API_ROUTES } from "@/shared/config";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { ListRow } from "@/shared/ui/list-row";
import { Sheet, SheetDragHandle, SheetTitle, sheetDragStyle } from "@/shared/ui/sheet";

import { EXPORT_FORMATS } from "../model/export-format";
import { useExportSheet } from "../model/use-export-sheet";

// One row, and the formats behind it (ADR 0071, update 2026-11-07).
//
// It started as two rows side by side, one per format, and the owner
// rejected the shape rather than the look: a third format would mean a
// third row, and a profile screen that grows a line every time the
// export learns a trick. A panel holds a list; the screen holds one row.
//
// The same arrangement as the ministry status row above it — a row that
// opens a bottom sheet — so there is one way of choosing something on
// this screen rather than two.
//
// Adding a format is now one entry in EXPORT_FORMATS plus two dictionary
// keys. Nothing here is per-format: the rows are generated from the list
// the parser already validates against, so the panel cannot offer a
// format the route would refuse.

// Which dictionary keys name each format. A map rather than a built
// string: next-intl types `t` against the dictionary's shape, and a
// template literal is not a key it can check — the whole protection
// against a typo would be gone.
const FORMAT_LABELS = {
  csv: { title: "csv", text: "csvText" },
  xlsx: { title: "excel", text: "excelText" },
} as const;

export const ExportDataRow = () => {
  const t = useTranslations("screens.profile.export");
  const sheet = useExportSheet();

  return (
    <>
      {/* A native button, not a react-aria one: the tap target is a whole
          list row, and Button's variants are sized for a screen's
          actions (ADR 0013 allows a plain element where no react-aria
          primitive is involved). Copied in shape from the status row, on
          purpose. */}
      <button
        type="button"
        onClick={sheet.open}
        aria-haspopup="dialog"
        className="w-full text-left"
      >
        <ListRow
          divided={false}
          title={t("title")}
          text={t("text")}
          trailing={(
            <span className="flex shrink-0 items-center gap-2.5">
              <span className="text-body font-540 text-ink-muted">{t("action")}</span>
              <ChevronRightIcon size={20} className="shrink-0 text-ink-faint" />
            </span>
          )}
        />
      </button>

      <Sheet
        side="bottom"
        isOpen={sheet.isOpen}
        onOpenChange={sheet.onOpenChange}
        showCloseButton={false}
        className="mx-auto max-w-md gap-3 rounded-t-3xl px-5 pt-0 pb-5"
        style={sheetDragStyle(sheet.dragY)}
      >
        <SheetDragHandle {...sheet.dragHandlers} className="-mx-5" />

        {/* SheetTitle, not a bare heading: it renders react-aria's
            Heading with slot="title", which is what gives the dialog its
            accessible name. The classes are the project's own — the
            vendored default is shadcn-generic. */}
        <SheetTitle className="font-sans text-day-title font-600 tracking-screen-title text-ink">
          {t("sheetTitle")}
        </SheetTitle>

        <div className="-mx-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {EXPORT_FORMATS.map((format, index) => (
            <ListRow
              key={format}
              href={`${WEB_API_ROUTES.export}?format=${format}`}
              download
              // Closes the panel once a format is picked. It fires in
              // addition to the download, never instead of it — react-aria
              // leaves the navigation to the browser when no
              // RouterProvider is configured (shared/ui/list-row.tsx).
              onPress={sheet.close}
              title={t(FORMAT_LABELS[format].title)}
              text={t(FORMAT_LABELS[format].text)}
              divided={index < EXPORT_FORMATS.length - 1}
            />
          ))}
        </div>
      </Sheet>
    </>
  );
};
