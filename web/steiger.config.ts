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
  {
    // "excessive-slicing" counts slices and warns above twenty, on the
    // reasoning that a layer with more than that is usually a layer
    // nobody grouped. Switched off for `pages` only, and only there,
    // because this project's pages layer is not a list of routes: six of
    // its slices are screens with no address at all — the three device
    // shields, 404, 500, offline and service-unavailable, all rendered by
    // a gate or a Next.js convention rather than reached by a URL. The
    // count passed twenty when the network gate gained its second screen
    // (ADR 0055, update), and the rule's remedy — group them, or move
    // them into the layer that uses them — would mean either folders that
    // exist to satisfy a counter or screens living inside app/, which is
    // where this project deliberately does not keep them (ADR 0018).
    //
    // It stays on everywhere else: features and widgets growing past
    // twenty slices would be the signal the rule is for.
    files: ["./src/pages/**"],
    rules: {
      "fsd/excessive-slicing": "off",
    },
  },
]);
