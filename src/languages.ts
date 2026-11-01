/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import path from "path";

import micromatch from "micromatch";

import { languages } from "./languages/languages.json";
import { Language, LanguageTokens } from "./types";

const LANGUAGES = languages as Language[];

/**
 * Returns the languages that match the provided file
 * @param file The file to match against
 * @returns The languages that match the provided file
 *          split into filename and extension matches
 */
function getLanguageMatches(file: string): [Language[], Language[]] {
  const extension = path.extname(file);
  const filenameMatches = LANGUAGES.filter(
    language => language.filenames != undefined && micromatch.isMatch(file, language.filenames, { dot: true })
  );
  const extensionMatches = LANGUAGES.filter(language => language.extensions?.includes(extension));

  return [filenameMatches, extensionMatches];
}

/**
 * Determines the Language configuration for the provided file and returns the language tokens
 * @param file The file to determine the language for
 * @returns The language tokens
 * @internal
 */
export function getLanguageToken(language: Language): LanguageTokens {
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
 * Finds the language configuration for the provided file.
 * NOTE: Filename matches have precedence over extension matches.
 * @param file The file to find the language for
 * @returns The language configuration, or undefined when no language matches the file
 */
function findLanguage(file: string): Language | undefined {
  const [filenameMatches, extensionMatches] = getLanguageMatches(file);
  return filenameMatches.length > 0 ? filenameMatches[0] : extensionMatches[0];
}

/**
 * Retrieve the language configuration for the provided file.
 * NOTE: Filename matches have precedence over extension matches.
 * @param file The file to retrieve the language for
 * @returns The language configuration
 * @throws Error when no language matches the file (use `isSupported` to check this first)
 */
export function getLanguage(file: string): Language {
  const language = findLanguage(file);
  if (language === undefined) throw new Error(`Language for file '${file}' not found`);

  return language;
}

/**
 * Extends the list of supported languages with the provided language.
 * NOTES:
 *   - Adding any new language including overlapping filenames or extensions,
 * will override any previously existing language (incl. defaults).
 *
 * @param language The language to add
 */
export function addLanguage(language: Language): void {
  LANGUAGES.unshift(language);
}

/**
 * Determines if the provided file is supported by comment-it.
 * An unknown language is a normal outcome (callers usually read such a file as plain text), so it is
 * reported through the return value only: nothing is logged.
 * @param file The file to check
 * @returns Whether the file is supported
 */
export function isSupported(file: string): boolean {
  return findLanguage(file) !== undefined;
}
