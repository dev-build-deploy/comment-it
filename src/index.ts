/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

export { addLanguage, getLanguage, isSupported } from "./languages";
export { extractComments } from "./extractor";

export type { Comment, CommentContent, ExtractorOptions, Language, MultiLineComment } from "./types";
