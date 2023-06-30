/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

import { ILanguage, ILanguageTokens } from "./interfaces";
import { languages } from "./languages/languages.json";
import path from "path";

/**
 * Returns the languages that match the provided file
 * @param file The file to match against
 * @returns The languages that match the provided file
 */
function getLanguageMatches(file: string): ILanguage[] {
  const extension = path.extname(file);
  const matches = (languages as ILanguage[]).filter(
    language => language.extensions?.includes(extension) || language.filenames?.includes(path.basename(file))
  );
  return matches
}

/**
 * Determines the Language configuration for the provided file and returns the language tokens
 * @param file The file to determine the language for
 * @returns The language tokens
 * @internal
 */
export function getLanguage(file: string): ILanguageTokens {
  const matches = getLanguageMatches(file)
  if (matches.length === 0) throw new Error(`Language for file '${file}' not found`);
  if (matches.length > 1) throw new Error(`Multiple languages for file '${file}' found`);
  const language = matches[0];

  return {
    singleline: language.singleline,
    multilineStart: language.multiline?.start,
    multilineEnd: language.multiline?.end,
  };
}

/**
 * Determines if the provided file is supported by comment-it
 * @param file The file to check
 * @returns Whether the file is supported
 */
export function isSupported(file: string): boolean {
  return getLanguageMatches(file).length === 1;
}
