import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // "insignificant-slice" implements the FSD v2.1 "pages first"
    // recommendation — merging features/widgets back into pages while
    // they have exactly one consumer. The project deliberately went the
    // other way for install-sheet/install-carousel/join-waitlist (ADR
    // 0018): the form and installation panel logic is already split
    // into segments (model/ui) apart from the screen markup now, rather
    // than waiting for a second consumer. This is a deliberate departure
    // from the "pages first" heuristic for these specific slices, not a
    // blanket rejection of it — the rule is switched off globally
    // (steiger doesn't support disabling it per slice), relying on code
    // review to keep such slices from multiplying carelessly.
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
