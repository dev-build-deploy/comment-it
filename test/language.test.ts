/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { isSupported, addLanguage, getLanguageToken } from "../src/languages";

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
    addLanguage({
      name: "Overlapping Test",
      extensions: [".yml"],
      singleline: "//",
    });

    expect(isSupported("test.yml")).toBe(false);
    expect(() => getLanguageToken("test.yml")).toThrow();
  });
});
