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

describe("Singleline comments", () => {
  const filePath = `test/files/singline.ts`;
  const testData = [
    {
      description: "Singleline comment",
      input: "// Singleline comment",
      output: [
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 21 },
              value: "Singleline comment",
              raw: "// Singleline comment",
            },
          ],
        },
      ],
    },
    {
      description: "Singleline comment with leading whitespace",
      input: "  // Singleline comment",
      output: [
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 1,
              column: { start: 2, end: 23 },
              value: "Singleline comment",
              raw: "// Singleline comment",
            },
          ],
        },
      ],
    },
    {
      description: "Single quote",
      input: "const test = '// Singleline comment'",
      output: [],
    },
    {
      description: "Double quote",
      input: 'const test = "// Singleline comment"',
      output: [],
    },
    {
      description: "Backtick",
      input: "const test = `// Singleline comment`",
      output: [],
    },
    {
      description: "Inside multiline comment",
      input: "/* // Singleline comment */",
      output: [],
    },
  ];

  it.each(testData)("$description", async ({ input, output }) => {
    // Create temporary test file in temporary directory
    fs.writeFileSync(filePath, input, "utf8");
    let index = 0;
    for await (const comment of extractComments(filePath)) {
      if (comment.type === "multiline") continue;
      expect(comment).toStrictEqual(output[index]);
      index++;
    }
  });

  afterEach(() => {
    fs.rmSync(filePath);
  });
});

describe("Multiline comments", () => {
  const filePath = `test/files/multiline.ts`;
  const testData = [
    {
      description: "Multiline on single line",
      input: "/* Multiline comment */",
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 23 },
              value: "Multiline comment",
              raw: "/* Multiline comment */",
            },
          ],
        },
      ],
    },
    {
      description: "Multiline on multiple lines",
      input: `/*
Multiline comment
*/`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 2 },
              value: "",
              raw: "/*",
            },
            {
              line: 2,
              column: { start: 0, end: 17 },
              value: "Multiline comment",
              raw: "Multiline comment",
            },
            {
              line: 3,
              column: { start: 0, end: 2 },
              value: "",
              raw: "*/",
            },
          ],
        },
      ],
    },
    {
      description: "Multiline on multiple lines with prefix",
      input: `/*
 * Multiline comment
*/`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 2 },
              value: "",
              raw: "/*",
            },
            {
              line: 2,
              column: { start: 0, end: 20 },
              value: "Multiline comment",
              raw: " * Multiline comment",
            },
            {
              line: 3,
              column: { start: 0, end: 2 },
              value: "",
              raw: "*/",
            },
          ],
        },
      ],
    },
    {
      description: "Multiline start and end on same line",
      input: `/* Multiline comment
spanning multiple lines */`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 20 },
              value: "Multiline comment",
              raw: "/* Multiline comment",
            },
            {
              line: 2,
              column: { start: 0, end: 26 },
              value: "spanning multiple lines",
              raw: "spanning multiple lines */",
            },
          ],
        },
      ],
    },
    {
      description: "Single quote",
      input: "const test = '/* Singleline comment */'",
      output: [],
    },
    {
      description: "Double quote",
      input: 'const test = "/* Singleline comment */"',
      output: [],
    },
    {
      description: "Backtick",
      input: "const test = `/* Singleline comment */`",
      output: [],
    },
    {
      description: "Inside multiline comment",
      input: "/* /* Multiline comment */ */",
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 26 },
              raw: "/* /* Multiline comment */",
              value: "/* Multiline comment",
            },
          ],
        },
      ],
    },
    {
      description: "Multiline followed by Singleline",
      input: `/* Multiline */ // Singleline`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 15 },
              value: "Multiline",
              raw: "/* Multiline */",
            },
          ],
        },
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 1,
              column: { start: 14, end: 26 },
              value: "Singleline",
              raw: "// Singleline",
            },
          ],
        },
      ],
    },
    {
      description: "Multiline followed by Multiline",
      input: `/* Multiline */ /*
Another one!
*/`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 15 },
              value: "Multiline",
              raw: "/* Multiline */",
            },
          ],
        },
        {
          type: "multiline",
          format: { start: "/*", end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 16, end: 18 },
              value: "",
              raw: "/*",
            },
            {
              line: 2,
              column: { start: 0, end: 12 },
              value: "Another one!",
              raw: "Another one!",
            },
            {
              line: 3,
              column: { start: 0, end: 2 },
              value: "",
              raw: "*/",
            },
          ],
        },
      ],
    },
    {
      description: "Multiline does not end",
      input: `/*
Singleline comment`,
      output: [],
    },
  ];

  it.each(testData)("$description", async ({ input, output }) => {
    // Create temporary test file in temporary directory
    fs.writeFileSync(filePath, input, "utf8");

    let index = 0;
    for await (const comment of extractComments(filePath)) {
      if (comment.type === "singleline") continue;
      expect(comment).toStrictEqual(output[index]);
      index++;
    }
  });

  afterEach(() => {
    fs.rmSync(filePath);
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
