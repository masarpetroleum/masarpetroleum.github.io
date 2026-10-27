# Masar Petroleum website

Astro rebuild of [masarpetroleum.om](https://www.masarpetroleum.om), deployed to GitHub Pages by `.github/workflows/pages.yml` on every push.

## Commands

| Command                 | Action                                         |
| :---------------------- | :--------------------------------------------- |
| `npm install`           | Install dependencies                           |
| `npm run dev`           | Dev server at `localhost:4321`                 |
| `npm run build`         | Build the static site to `./dist/`             |
| `npm run preview`       | Preview the build                              |
| `npm run new-article`   | Scaffold an article (also `new-event`, `new-job`, `new-member`) |

## Where things live

- `src/content/` — all page content as Markdown: `articles/`, `events/` (news & events), `careers/`, `team/`, and `pages/` (company background, operations). Bodies are HTML split into `<section class="entry-section">` blocks; `order` controls list order.
- `src/consts.ts` — contact details, navigation, homepage slider, value cards, and which items appear under "Recent News".
- `public/images`, `public/files`, `public/template` — every image from the original site, stored locally.
- `src/data/legacy.json` — maps old `content/?id=N` and `list/?refer=N` URLs to the new pages so existing links keep working.

The contact form opens the visitor's email app (the site is static). Search runs in the browser over `/search-index.json`.
