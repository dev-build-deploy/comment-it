// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: MIT

/**
 * Loads a module
 * @param {string} url The URL to load
 */
export async function load(url) {
  const label = `/* not a comment: ${url} */`; // a comment
  console.log(label, "// neither", '/* nor this */');
  return import(url); /* the module */
}
