/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { isSupported } from "../src/languages";

describe("Languages", () => {
  test("Check if file is supported", async () => {
    for (const [file, expectations] of [
      ["test.ts", true],
      ["test.md", true],
      ["test.js", true],
      [".gitignore", true],
      ["test.yml", true],
      ["test.yaml", true],
      ["not-supported.this", false]
    ]) {
      expect(isSupported(file as string)).toBe(expectations);
    }
  })
})