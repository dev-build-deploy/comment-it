/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

/**
 * Comment including metadata
 * @typedef Comment
 * @member type The type of comment (`singleline` or `multiline`)
 * @member format The format used to extract the comment
 * @member format.start Initial prefix for extracting a comment
 * @member format.prefixes (OPTIONAL) prefixes for multiline comments
 * @member format.end Suffix indicating the end of a comment
 * @member contents[] Array containing the extracted data (line-by-line)
 */
export type Comment = {
  /** The type of comment (`singleline` or `multiline`) */
  type: "singleline" | "multiline";
  /** The format used to extract the comment */
  format: {
    /** Initial prefix for extracting a comment */
    start?: string;
    /** (OPTIONAL) prefixes for multiline comments */
    prefixes?: string[];
    /** Suffix indicating the end of a comment */
    end?: string;
  };
  /** Array containing the extracted data (line-by-line) */
  contents: CommentContent[];
};

/**
 * Comment content
 * @typedef CommentContent
 * @member line The line number of the extracted comment data
 * @member column The column range indicating the start and end of the comment on this line
 * @member column.start The column number indicating the start of the comment on this line
 * @member column.end The column number indicating the end of the comment on this line
 * @member value The extracted comment on this line
 * @member raw The raw data on this line
 */
export type CommentContent = {
  /** The line number of the extracted comment data */
  line: number;
  /** The column range indicating the start and end of the comment on this line */
  column: {
    /** The column number indicating the start of the comment on this line */
    start: number;
    /** The column number indicating the end of the comment on this line */
    end: number;
  };
  /** The extracted comment on this line */
  value: string;
  /** The raw data on this line */
  raw: string;
};

/**
 * Multiline comment block
 * @typedef MultiLineComment
 * @member start The start of the comment block
 * @member end The end of the comment block
 */
export type MultiLineComment = {
  start: string;
  prefixes?: string[];
  end: string;
};

/**
 * Language definition
 * @typedef Language
 * @member name The name of the language
 * @member extensions List of file extensions
 * @member filenames List of filenames
 * @member multiline Multiline comment
 * @member singleline Single line comment
 * @member singleQuote Whether single quotes are used for strings
 * @member doubleQuote Whether double quotes are used for strings
 * @member backtick Whether backticks are used for strings
 */
export type Language = {
  /** The name of the language */
  name: string;
  /** List of file extensions */
  extensions?: string[];
  /** List of filenames */
  filenames?: string[];
  /** Multiline comment */
  multiline?: MultiLineComment;
  /** Single line comment */
  singleline?: string;
  /** Whether single quotes are used for strings */
  singleQuote?: boolean;
  /** Whether double quotes are used for strings */
  doubleQuote?: boolean;
  /** Whether backticks are used for strings */
  backtick?: boolean;
};

/**
 * Language tokens
 * @typedef LanguageTokens
 * @member singleline The singleline comment token
 * @member multilineStart The multiline start token
 * @member multilineEnd The multiline end token
 * @member singleQuote The single quote token
 * @member doubleQuote The double quote token
 * @member backtick The backtick token
 * @internal
 */
export type LanguageTokens = {
  singleline?: string;
  multilineStart?: string;
  multilinePrefixes?: string[];
  multilineEnd?: string;
  singleQuote?: string;
  doubleQuote?: string;
  backtick?: string;
};

/**
 * Extractor options
 * @typedef ExtractorOptions
 * @member maxLines The maximum amount of lines to extract comments from
 */
export type ExtractorOptions = {
  /** The maximum amount of lines to extract comments from */
  maxLines?: number;
  /** Group multiple singleline comments into a comment block */
  groupSingleline?: boolean;
};
