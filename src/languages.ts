/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import path from "path";

import { sync as globSync } from "glob";

import { ILanguage, ILanguageTokens } from "./interfaces";
import { languages } from "./languages/languages.json";

const LANGUAGES = replaceGlobPatternsInLanguages(languages as ILanguage[]);

/**
 * Converts any glob patterns in the filenames to actual filenames
 * @param languages The languages to replace the glob patterns in
 * @returns The languages with the glob patterns replaced with relative path filenames
 */
function replaceGlobPatternsInLanguages(languages: ILanguage[]): ILanguage[] {
  const results = JSON.parse(JSON.stringify(languages)) as ILanguage[];
  results.forEach(language => {
    if (language.filenames !== undefined) {
      const deglobbed: string[] = [];
      for (const filename of language.filenames) {
        if (filename.includes("*")) {
          deglobbed.push(...globSync(filename, { dot: true }));
        } else {
          deglobbed.push(filename);
        }
        language.filenames = deglobbed;
      }
    }
  });

  return results;
}

/**
 * Returns the languages that match the provided file
 * @param file The file to match against
 * @returns The languages that match the provided file
 *          split into filename and extension matches
 */
function getLanguageMatches(file: string): [ILanguage[], ILanguage[]] {
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
 * Retrieve the language configuration for the provided file.
 * NOTE: Filename matches have precedence over extension matches.
 * @param file The file to retrieve the language for
 * @returns The language configuration
 */
export function getLanguage(file: string): ILanguage {
  const [filenameMatches, extensionMatches] = getLanguageMatches(file);
  if (filenameMatches.length === 0 && extensionMatches.length === 0)
    throw new Error(`Language for file '${file}' not found`);

  return filenameMatches.length > 0 ? filenameMatches[0] : extensionMatches[0];
}

/**
 * Extends the list of supported languages with the provided language.
 * NOTE: Adding any new language including overlapping filenames or extensions,
 * will override any previously existing language (incl. defaults).
 *
 * @param language The language to add
 */
export function addLanguage(language: ILanguage): void {
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
