/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as fs from "fs";

import { extractComments } from "../src/extractor";
import { languages } from "../src/languages/languages.json";
import { Language } from "../src/types";

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
      options: {},
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
      options: {},
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
      options: {},
      output: [],
    },
    {
      description: "Double quote",
      input: 'const test = "// Singleline comment"',
      options: {},
      output: [],
    },
    {
      description: "Backtick",
      input: "const test = `// Singleline comment`",
      options: {},
      output: [],
    },
    {
      description: "Inside multiline comment",
      input: "/* // Singleline comment */",
      options: {},
      output: [],
    },
    {
      description: "Multiline within a singleline comment",
      input: "// /* Multiline comment */",
      options: {},
      output: [
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 26 },
              value: "/* Multiline comment */",
              raw: "// /* Multiline comment */",
            },
          ],
        },
      ],
    },
    {
      description: "Group multiple singleline comments into a block",
      input: `// Singleline comment 1
// Singleline comment 2

// Singleline comment 3
  // Singleline comment 4`,
      options: { groupSingleline: true },
      output: [
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 23 },
              value: "Singleline comment 1",
              raw: "// Singleline comment 1",
            },
            {
              line: 2,
              column: { start: 0, end: 23 },
              value: "Singleline comment 2",
              raw: "// Singleline comment 2",
            },
          ],
        },
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 4,
              column: { start: 0, end: 23 },
              value: "Singleline comment 3",
              raw: "// Singleline comment 3",
            },
          ],
        },
        {
          type: "singleline",
          format: { start: "//" },
          contents: [
            {
              line: 5,
              column: { start: 2, end: 25 },
              value: "Singleline comment 4",
              raw: "// Singleline comment 4",
            },
          ],
        },
      ],
    },
  ];

  it.each(testData)("$description", async ({ input, options, output }) => {
    // Create temporary test file in temporary directory
    fs.writeFileSync(filePath, input, "utf8");
    let index = 0;
    for await (const comment of extractComments(filePath, options)) {
      if (comment.type === "multiline") continue;
      expect(comment).toStrictEqual(output[index]);
      index++;
    }

    expect(index).toBe(output.length);
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
      description: "Multiline on multiple lines with prefix, undetermined whitespacing",
      input: `/*
    * Multiline comment
*/`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", prefixes: ["*"], end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 2 },
              value: "",
              raw: "/*",
            },
            {
              line: 2,
              column: { start: 0, end: 23 },
              value: "Multiline comment",
              raw: "    * Multiline comment",
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
      description: "Multiline on multiple lines without prefix, but with list",
      input: `/*
Multiline comment which consists of a list:
* Item 1
* Item 2
*/`,
      output: [
        {
          type: "multiline",
          format: { start: "/*", prefixes: ["*"], end: "*/" },
          contents: [
            {
              line: 1,
              column: { start: 0, end: 2 },
              value: "",
              raw: "/*",
            },
            {
              line: 2,
              column: { start: 0, end: 43 },
              value: "Multiline comment which consists of a list:",
              raw: "Multiline comment which consists of a list:",
            },
            {
              line: 3,
              column: { start: 0, end: 8 },
              value: "* Item 1",
              raw: "* Item 1",
            },
            {
              line: 4,
              column: { start: 0, end: 8 },
              value: "* Item 2",
              raw: "* Item 2",
            },
            {
              line: 5,
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
              column: { start: 16, end: 29 },
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
          format: { start: "/*", prefixes: ["*"], end: "*/" },
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
      expect(comment).toStrictEqual(output[index]);
      index++;
    }

    expect(index).toBe(output.length);
  });

  afterEach(() => {
    fs.rmSync(filePath);
  });
});

// The example SPDX headers below are test data, not the license of this file.
// REUSE-IgnoreStart
describe("Strings and comments do not leak into each other", () => {
  /**
   * Extracts the comment values of the provided input, written to a file with the provided extension
   * @param extension The file extension (determines the language)
   * @param input The file contents
   * @returns One list of values per comment
   */
  async function values(extension: string, input: string): Promise<string[][]> {
    const filePath = `test/files/leak-test${extension}`;
    fs.writeFileSync(filePath, input, "utf8");
    try {
      const result: string[][] = [];
      for await (const comment of extractComments(filePath)) {
        result.push(comment.contents.map(entry => entry.value));
      }
      return result;
    } finally {
      fs.rmSync(filePath);
    }
  }

  const languagesWithSingleline = (languages as Language[]).filter(
    language => language.singleline !== undefined && language.extensions !== undefined
  );

  it.each(languagesWithSingleline.map(language => [language.name, language]))(
    "%s: an apostrophe in a singleline comment does not start a string",
    async (_name, language) => {
      const token = language.singleline as string;
      const input = `${token} the file's header\n${token} SPDX-License-Identifier: MIT\n`;
      expect(await values(language.extensions?.[0] as string, input)).toStrictEqual([
        ["the file's header"],
        ["SPDX-License-Identifier: MIT"],
      ]);
    }
  );

  it.each(
    languagesWithSingleline.filter(language => language.doubleQuote === true).map(language => [language.name, language])
  )("%s: a singleline token inside a string is not a comment", async (_name, language) => {
    const token = language.singleline as string;
    const input = `${token} it's here\nvalue = "a ${token} b" ${token} real\n`;
    expect(await values(language.extensions?.[0] as string, input)).toStrictEqual([["it's here"], ["real"]]);
  });

  test("JavaScript: a URL in a string after an apostrophe in a comment", async () => {
    const input = "// the file's header\nconst url = 'http://example.com'; // real\n";
    expect(await values(".js", input)).toStrictEqual([["the file's header"], ["real"]]);
  });

  test("TypeScript: a multiline token inside a string after an apostrophe in a comment", async () => {
    const input = "// don't\nconst glob = '/* not a comment */'; /* real */\n";
    expect(await values(".ts", input)).toStrictEqual([["don't"], ["real"]]);
  });

  test("C: an escaped quote does not end a string", async () => {
    const input = 'const char *s = "a\\" // not a comment"; // real\n';
    expect(await values(".c", input)).toStrictEqual([["real"]]);
  });

  test("C: an escaped backslash ends with the string", async () => {
    const input = 'const char *s = "C:\\\\"; // real\n';
    expect(await values(".c", input)).toStrictEqual([["real"]]);
  });

  test("C: an apostrophe in a multiline comment does not start a string", async () => {
    const input = '/* the file\'s header */\nconst char *s = "/* not */"; // real\n';
    expect(await values(".c", input)).toStrictEqual([["the file's header"], ["real"]]);
  });

  test("C: a multiline comment without spaces keeps its contents", async () => {
    expect(await values(".c", "/*SPDX-License-Identifier: MIT*/\n")).toStrictEqual([["SPDX-License-Identifier: MIT"]]);
  });

  test("C: an unterminated string does not swallow the next lines", async () => {
    const input = "char c = '\"'; x = 'a\n// SPDX-License-Identifier: MIT\n";
    expect(await values(".c", input)).toStrictEqual([["SPDX-License-Identifier: MIT"]]);
  });

  test("Go: a backtick string spans multiple lines", async () => {
    const input = "s := `first\n// not a comment\n` // real\n";
    expect(await values(".go", input)).toStrictEqual([["real"]]);
  });

  test("Python: a docstring is followed by a comment", async () => {
    const input = '"""Module docstring."""\n# SPDX-License-Identifier: MIT\ns = "# not a comment"\n';
    expect(await values(".py", input)).toStrictEqual([["Module docstring."], ["SPDX-License-Identifier: MIT"]]);
  });

  test("Python: a multiline docstring", async () => {
    const input = '"""\nSPDX-License-Identifier: MIT\n"""\n# it\'s done\n';
    expect(await values(".py", input)).toStrictEqual([["", "SPDX-License-Identifier: MIT", ""], ["it's done"]]);
  });

  test("Shell: an apostrophe in a comment after a shebang", async () => {
    const input = '#!/bin/sh\n# it\'s a script\n# SPDX-License-Identifier: MIT\necho "# no"\n';
    expect(await values(".sh", input)).toStrictEqual([["it's a script"], ["SPDX-License-Identifier: MIT"]]);
  });

  test("Lua: a multiline comment is not read as a singleline comment", async () => {
    const input = "--[[ it's\nSPDX-License-Identifier: MIT ]]\n-- real\n";
    expect(await values(".lua", input)).toStrictEqual([["it's", "SPDX-License-Identifier: MIT"], ["real"]]);
  });

  test("Asciidoc: a comment block is not read as a singleline comment", async () => {
    const input = "////\nSPDX-License-Identifier: MIT\n////\n// real\n";
    expect(await values(".adoc", input)).toStrictEqual([["", "SPDX-License-Identifier: MIT", ""], ["real"]]);
  });
});

// REUSE-IgnoreEnd

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
