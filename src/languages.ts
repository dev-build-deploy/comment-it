/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import path from "path";

import { ILanguage, ILanguageTokens } from "./interfaces";
import { languages } from "./languages/languages.json";

const LANGUAGES = languages as ILanguage[];

/**
 * Returns the languages that match the provided file
 * @param file The file to match against
 * @returns The languages that match the provided file
 */
function getLanguageMatches(file: string): ILanguage[] {
  const extension = path.extname(file);
  const matches = LANGUAGES.filter(
    language =>
      (extension && language.extensions?.includes(extension)) || language.filenames?.includes(path.basename(file))
  );
  return matches;
}

/**
 * Determines the Language configuration for the provided file and returns the language tokens
 * @param file The file to determine the language for
 * @returns The language tokens
 * @internal
 */
export function getLanguageToken(file: string): ILanguageTokens {
  const language = getLanguage(file);

  return {
    singleline: language.singleline,
    multilineStart: language.multiline?.start,
    multilinePrefixes: language.multiline?.prefixes,
    multilineEnd: language.multiline?.end,
    singleQuote: language.singleQuote ? "'" : undefined,
    doubleQuote: language.doubleQuote ? '"' : undefined,
    backtick: language.backtick ? "`" : undefined,
  };
}

/**
 * Retrive the language configuration for the provided file
 * @param file The file to retrieve the language for
 * @returns The language configuration
 */
export function getLanguage(file: string): ILanguage {
  const matches = getLanguageMatches(file);
  if (matches.length === 0) throw new Error(`Language for file '${file}' not found`);
  if (matches.length > 1) throw new Error(`Multiple languages for file '${file}' found`);
  const language = matches[0];

  return language;
}

/**
 * Extends the list of supported languages with the provided language
 * @param language The language to add
 */
export function addLanguage(language: ILanguage): void {
  // Validate for duplication of extensions
  for (const extension of language.extensions ?? []) {
    if (!extension.startsWith(".")) {
      throw new Error(`Extension '${extension}' does not start with a period`);
    }
    isSupported(`test${extension}`);
  }

  // Validate for duplication of filenames
  for (const filename of language.filenames ?? []) {
    isSupported(filename);
  }

  LANGUAGES.push(language);
}

/**
 * Determines if the provided file is supported by comment-it
 * @param file The file to check
 * @returns Whether the file is supported
 */
export function isSupported(file: string): boolean {
  try {
    return getLanguage(file) !== undefined;
  } catch (error) {
    return false;
  }
}
