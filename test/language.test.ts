/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { isSupported } from "../src/languages";

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
