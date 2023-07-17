/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as fs from "fs";
import { extractComments } from "../src/extractor";

describe("Languages", () => {
  test("Validate all language test files", async () => {
    for (const entry of fs.readdirSync("test/files")) {
      if (fs.statSync(`test/files/${entry}`).isDirectory()) continue;

      const fixture = JSON.parse(fs.readFileSync(`test/files/fixtures/${entry}.json`, "utf8"));
      let index = 0;

      for await (const comment of extractComments(`test/files/${entry}`)) {
        expect(comment).toStrictEqual(fixture[index]);
        index++;
      }
    }
  });
});

describe("Extractor options", () => {
  test("Maximum number of lines", async () => {
    const fixture = JSON.parse(fs.readFileSync(`test/files/fixtures/typescript.ts.json`, "utf8"));
    for (const [lines, expectatios] of [
      [5, 1],
      [10, 3],
      [9000, 11],
    ]) {
      let index = 0;
      for await (const comment of extractComments(`test/files/typescript.ts`, { maxLines: lines })) {
        expect(comment).toStrictEqual(fixture[index]);
        index++;
      }
      expect(index).toBe(expectatios);
    }
  });
});
