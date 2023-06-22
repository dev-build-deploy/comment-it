/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
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
