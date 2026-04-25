# Build & deploy notes

The site is served as static files by GitHub Pages (`btsherry.github.io/silken-road`).
There is no server. There is, however, a small **local** build step: `.jsx` source
files are compiled to plain `.js` files in `dist/` before pushing.

GitHub Pages does **not** run the build. Whatever sits in the repo on `main` is
what visitors see. So if you edit JSX, you must rebuild and commit the output.

## Prerequisites

- Node 18 or newer (for `esbuild`).
- One-time install:
  ```sh
  cd .../silk-road-narrative/website/silken-road
  npm install
  ```
  This drops `node_modules/` (gitignored, ~10 MB, just `esbuild`).

## Workflow

Every time you change a `.jsx` file:

```sh
npm run build          # writes dist/*.js
git add dist/ <changed-files>
git commit -m "..."
git push
```

GitHub Pages picks it up and republishes within ~30 seconds.

For an edit-loop with auto-rebuild on save:

```sh
npm run watch
```

…then refresh the browser. Note: `watch` writes the same `dist/*.js` files,
so committing them at the end of a session still works the same way.

## What the build does

`build.mjs` reads each entry in `SOURCES` (`map.jsx`, `globe.jsx`,
`character-panel.jsx`, `app.jsx`, `main.jsx`), runs an esbuild JSX→JS
transform with `React.createElement` as the factory, minifies, inlines
a source map, and wraps each output in an IIFE so per-file
`const { useState } = React;` declarations don't collide at the global
scope.

The compiled files go to `dist/`, which `index.html` loads as plain
`<script>` tags in the same order they used to load as `text/babel`.

## Adding a new JSX file

1. Add the source file at the silken-road root (e.g. `panels.jsx`).
2. Add it to the `SOURCES` array in `build.mjs`.
3. Add a `<script src="dist/panels.js">` line to `index.html` in the
   right place in the load order (it must come before any file that
   depends on the globals it sets).
4. `npm run build`, commit, push.

## What's _not_ built

- `data.js` is plain JavaScript, not JSX. It's loaded as-is.
- `images/`, `lore/`, `styles.css`, `index.html` — all served directly.
- `uploads/` is **gitignored** — working source material only.

## Why no CI build action

Running esbuild on push via GitHub Actions would let you skip the local
rebuild step and edit JSX directly in the GitHub web UI. We chose not
to do that yet because it adds another moving part (Action config,
secrets, deploy permissions) for a site that only the table group
visits. If the audience grows, switching to a CI build is a small
follow-up — the build script is already CI-portable.

## Verifying after a push

GitHub Pages build status:

```sh
TOKEN=$(cat ~/Claude/hello/github-hello)
curl -sS -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/btsherry/silken-road/pages/builds/latest \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'], d['commit'])"
```

When the commit hash matches your latest push and status is `built`,
the new version is live.
