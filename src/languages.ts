/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import path from "path";

import { sync as globSync } from "glob";

import { languages } from "./languages/languages.json";
import { Language, LanguageTokens } from "./types";

const LANGUAGES = replaceGlobPatternsInLanguages(languages as Language[]);

/**
 * Replaces any glob patterns in the filenames with actual filenames
 * @param filenames The filenames to replace the glob patterns in
 * @returns The filenames with the glob patterns replaced with relative path filenames
 */
function replaceGlobPatternsInFilenames(filenames?: string[]): string[] | undefined {
  if (filenames === undefined) return undefined;
  return filenames.flatMap(filename => {
    if (filename.includes("*")) return globSync(filename, { dot: true });
    else return filename;
  });
}

/**
 * Converts any glob patterns in the filenames to actual filenames
 * @param languages The languages to replace the glob patterns in
 * @returns The languages with the glob patterns replaced with relative path filenames
 */
function replaceGlobPatternsInLanguages(languages: Language[]): Language[] {
  const results = JSON.parse(JSON.stringify(languages)) as Language[];
  results.forEach(language => {
    language.filenames = replaceGlobPatternsInFilenames(language.filenames);
  });

  return results;
}

/**
 * Returns the languages that match the provided file
 * @param file The file to match against
 * @returns The languages that match the provided file
 *          split into filename and extension matches
 */
function getLanguageMatches(file: string): [Language[], Language[]] {
  const extension = path.extname(file);
  const filenameMatches = LANGUAGES.filter(language =>
    language.filenames?.map(filename => path.resolve(filename)).includes(path.resolve(file))
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
export function getLanguageToken(file: string): LanguageTokens {
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
 * Retrieve the language configuration for the provided file.
 * NOTE: Filename matches have precedence over extension matches.
 * @param file The file to retrieve the language for
 * @returns The language configuration
 */
export function getLanguage(file: string): Language {
  const [filenameMatches, extensionMatches] = getLanguageMatches(file);
  if (filenameMatches.length === 0 && extensionMatches.length === 0)
    throw new Error(`Language for file '${file}' not found`);

  return filenameMatches.length > 0 ? filenameMatches[0] : extensionMatches[0];
}

/**
 * Extends the list of supported languages with the provided language.
 * NOTES:
 *   - Adding any new language including overlapping filenames or extensions,
 *   - Glob patterns will be applied upon adding the language
 * will override any previously existing language (incl. defaults).
 *
 * @param language The language to add
 */
export function addLanguage(language: Language): void {
  language.filenames = replaceGlobPatternsInFilenames(language.filenames);
  LANGUAGES.unshift(language);
}

/**
 * Determines if the provided file is supported by comment-it
 * @param file The file to check
 * @returns Whether the file is supported
 */
export function isSupported(file: string): boolean {
  try {
    getLanguage(file);
  } catch (error) {
    return false;
  }

  return true;
}
