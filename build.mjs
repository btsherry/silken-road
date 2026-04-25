// Compile each .jsx source to dist/*.js using esbuild.
//
// Each output is wrapped in an IIFE so per-file `const { useState } = React;`
// declarations don't collide at global scope (the runtime previously relied on
// Babel-in-browser's preset-env transforming `const` → `var`). Cross-file
// communication still happens via window globals (window.App, window.SilkRoadMap, ...).
//
// Sources are loaded as classic <script> tags in index.html, in order, so
// these stay plain scripts — not ES modules.

import * as esbuild from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCES = [
  'map.jsx',
  'globe.jsx',
  'character-panel.jsx',
  'app.jsx',
  'main.jsx',
];

const OUT_DIR = 'dist';
const watch = process.argv.includes('--watch');

async function buildOne(file) {
  const src = await readFile(file, 'utf8');
  const result = await esbuild.transform(src, {
    loader: 'jsx',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'es2019',
    minify: true,
    sourcemap: 'inline',
    sourcefile: file,
  });
  const out = file.replace(/\.jsx$/, '.js');
  // Wrap in IIFE so each file has its own scope.
  const wrapped = `(function(){${result.code}})();\n`;
  await writeFile(`${OUT_DIR}/${out}`, wrapped);
  return { out, bytes: wrapped.length };
}

async function buildAll() {
  if (existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });
  const results = await Promise.all(SOURCES.map(buildOne));
  for (const { out, bytes } of results) {
    console.log(`  ${OUT_DIR}/${out.padEnd(22)} ${bytes.toLocaleString()} bytes`);
  }
}

await buildAll();

if (watch) {
  console.log('watching for changes...');
  const { watch: fsWatch } = await import('node:fs');
  let pending = false;
  for (const f of SOURCES) {
    fsWatch(f, async () => {
      if (pending) return;
      pending = true;
      setTimeout(async () => {
        pending = false;
        try {
          const r = await buildOne(f);
          console.log(`rebuilt ${OUT_DIR}/${r.out}`);
        } catch (e) {
          console.error(`build failed for ${f}:`, e.message);
        }
      }, 50);
    });
  }
}
