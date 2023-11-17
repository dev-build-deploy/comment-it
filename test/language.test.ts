/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { ILanguage } from "../src";
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
    expect(isSupported(file as string)).toBe(expectations);
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
    expect(() => getLanguageToken("test.yml")).not.toThrow();
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
});
