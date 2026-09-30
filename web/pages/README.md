# Why this empty folder exists

Next.js App Router reserves a `pages` directory (at the package root or
under `src/`) for the legacy Pages Router. If there's no `pages` directory
at all next to `app/` (our App Router), Next.js discovers `web/src/pages/**`
— the FSD "pages" layer in this project — at whatever location it lives,
and either fails with `pages and app directories should be under the same
folder`, or starts treating files inside `src/pages` as legacy Pages
Router pages (requiring a `default export` from them, and so on).

If, instead, an empty `web/pages/` (aside from this README) sits next to
`web/app/`, Next.js considers the Pages Router already "defined" here (and
empty), and stops scanning `src/pages` altogether. `src/pages` is then
free to be used as the FSD `pages` layer's name.

Details and alternatives considered — `docs/decisions/0004-fsd-pages-layer-named-pages.md`.

**Don't add files here.** This folder must stay empty (aside from this
README) — as soon as a `page.tsx`/`layout.tsx` etc. shows up in it, it
becomes a real Pages Router.
