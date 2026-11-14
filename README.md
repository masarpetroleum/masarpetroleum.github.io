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

## Content admin (`/admin/`)

The site has a Git-based admin panel powered by [Sveltia CMS](https://sveltiacms.app). Every save is committed to this repository and the Pages workflow republishes the site within a minute or two.

- **Live:** open `https://masarpetroleum.github.io/admin/` → **Sign In Using Access Token**. The dialog links to GitHub with the right permissions pre-selected (fine-grained token: *Contents: Read and write* on this repository). The token stays in that browser only.
- **Locally:** run `npm run dev`, open `http://localhost:4321/admin/index.html` → **Work with Local Repository**, and pick this folder (Chrome or Edge). Changes are written to your files; commit them yourself.
- To let several non-technical editors use **Sign In with GitHub**, deploy [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) and add its URL as `backend.base_url` in `public/admin/config.yml`.

What can be edited: news & events (with photo galleries), articles, careers, team members, the Company background and Operations pages, the homepage hero slides / about band / value cards, the main menu, page titles and intros, contact details, footer, SEO and analytics.

Content tips: in the editor, a **horizontal rule** starts a new content box; **Tags** link pages under "Related topics"; **Show in Recent News** puts an item on the homepage. Uploaded images are converted to WebP and stored in `public/images/uploads/`.

## Languages

The site is in English (at the root, e.g. `/about/`) and Arabic (under `/ar/`, e.g. `/ar/about/`, right-to-left, set in Vazirmatn).

- Every content file `src/content/<section>/<name>.md` can have an Arabic translation beside it, `<name>.ar.md`, holding only the translated fields (title, subtitle, excerpt, tags, body…). Images, order and the rest come from the English file. An entry without a translation is shown in English on the Arabic site, with a short note.
- `src/data/<file>.ar.json` holds the Arabic texts of `src/data/<file>.json` in the same shape; anything left out falls back to English.
- Short interface texts (buttons, labels, messages) are in `src/i18n/index.ts`.
- All pages live in `src/pages/[...lang]/`, which builds each one once per language.
- In the admin panel, switch between English and العربية at the top of an entry.

## Where things live

- `src/content/` — page content as Markdown files: `articles/`, `events/` (news & events), `careers/`, `team/`, and `pages/` (company background, operations). Bodies are HTML; `<hr>` splits them into boxes (`src/lib/rehype-sections.mjs`); `order` controls list order.
- `src/data/*.json` — homepage, menu, page texts, contact/footer/SEO settings (typed in `src/consts.ts`).
- `public/admin/` — the CMS page and its `config.yml`.
- `public/images/` — every image from the original site (plus `site/` for logos and UI graphics, `files/` for article images, `uploads/` for CMS uploads), stored locally.
- Old `content/?id=N` and `list/?refer=N` URLs redirect to the new pages (via each entry's hidden `legacyId`).

The contact form posts to the Cloudflare Worker in `worker/` (and falls back to the visitor's email app if that fails). Search runs in the browser over `/search-index.json` (`/ar/search-index.json` for Arabic).
