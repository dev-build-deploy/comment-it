/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { isSupported, addLanguage, getLanguageToken, getLanguage } from "../src/languages";
import { languages } from "../src/languages/languages.json";

describe("Languages", () => {
  const testData = [
    {
      description: "Typescript file",
      file: "test.ts",
      isSupported: true,
    },
    {
      description: "Markdown file",
      file: "test.md",
      isSupported: true,
    },
    {
      description: "Javascript file",
      file: "test.js",
      isSupported: true,
    },
    {
      description: "File without extension (.gitignore)",
      file: ".gitignore",
      isSupported: true,
    },
    {
      description: "YAML file",
      file: "test.yml",
      isSupported: true,
    },
    {
      description: "Unsupported file",
      file: "not-supported.this",
      isSupported: false,
    },
  ];

  it.each(testData)("$description", ({ file, isSupported: expectations }) => {
    expect(isSupported(file)).toBe(expectations);
  });
});

describe("Check for duplication in languages", () => {
  test("Check for filename duplications", () => {
    const filenames = new Set<string>();
    const duplicates = new Set<string>();
    for (const language of languages) {
      for (const filename of language.filenames ?? []) {
        if (filenames.has(filename)) duplicates.add(filename);
        else filenames.add(filename);
      }
    }

    expect(duplicates).toEqual(new Set<string>());
  });

  test("Check for extension duplications", () => {
    const extensions = new Set<string>();
    const duplicates = new Set<string>();
    for (const language of languages) {
      for (const extension of language.extensions ?? []) {
        if (extensions.has(extension)) duplicates.add(extension);
        else extensions.add(extension);
      }
    }

    expect(duplicates).toEqual(new Set<string>());
  });
});

describe("Add custom language", () => {
  test("Add new language", () => {
    addLanguage({
      name: "Test",
      extensions: [".test"],
      singleline: "//",
    });

    expect(isSupported("test.test")).toBe(true);
    expect(() => getLanguageToken(getLanguage("test.yml"))).not.toThrow();
  });

  test("Add overlapping language", () => {
    const newLanguage = {
      name: "Overlapping Test",
      extensions: [".yml"],
      singleline: "{%",
    };

    addLanguage(newLanguage);

    expect(isSupported("test.yml")).toBe(true);
    expect(getLanguage("test.yml")).toBe(newLanguage);
  });

  test("Filename matches have precedence over extension matches", () => {
    addLanguage({ name: "Overlapping Test", filenames: ["test.test", "second.test"], singleline: "%%" });
    addLanguage({ name: "Test", extensions: [".test"], singleline: "//" });
    addLanguage({ name: "Overlapping Test", filenames: ["third.test"], singleline: ";" });

    expect(isSupported("test.test")).toBe(true);
    expect(getLanguage("test.test").singleline).toBe("%%");

    expect(isSupported("second.test")).toBe(true);
    expect(getLanguage("second.test").singleline).toBe("%%");

    expect(isSupported("third.test")).toBe(true);
    expect(getLanguage("third.test").singleline).toBe(";");

    expect(isSupported("extension.test")).toBe(true);
    expect(getLanguage("extension.test").singleline).toBe("//");
  });

  test("Filename matches have precedence over extension matches (globs)", () => {
    addLanguage({
      name: "Custom Language 1",
      filenames: ["path/to/test.xml"],
      extensions: [],
      multiline: { start: "<!--", end: "-->", prefixes: ["~"] },
    });
    addLanguage({
      name: "Custom Language 1",
      filenames: ["another/path/to/test.xml"],
      extensions: [],
      multiline: { start: "<!--", end: "-->" },
    });

    expect(isSupported("path/to/test.xml")).toBe(true);
    expect(getLanguage("path/to/test.xml").multiline).toStrictEqual({ start: "<!--", end: "-->", prefixes: ["~"] });
  });

  test("Filename matches with wildcards (glob)", () => {
    addLanguage({
      name: "Custom Language 1",
      filenames: ["**/test*.oml"],
      extensions: [],
      multiline: { start: "<!--", end: "-->", prefixes: ["~"] },
    });
    addLanguage({
      name: "Custom Language 2",
      filenames: ["prod*.oml"],
      extensions: [],
      multiline: { start: "<!--", end: "-->" },
    });

    expect(isSupported("path/to/test-file.oml")).toBe(true);
    expect(isSupported("test.oml")).toBe(true);

    expect(isSupported("path/to/prod-file.oml")).toBe(false);
    expect(isSupported("prod-file.oml")).toBe(true);

    expect(getLanguage("path/to/test-file.oml").name).toEqual("Custom Language 1");
    expect(getLanguage("prod-file.oml").name).toEqual("Custom Language 2");
  });
});
