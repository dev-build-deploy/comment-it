/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

/**
 * Comment including metadata
 * @interface IComment
 * @member type The type of comment (`singleline` or `multiline`)
 * @member format The format used to extract the comment
 * @member format.start Initial prefix for extracting a comment
 * @member format.prefixes (OPTIONAL) prefixes for multiline comments
 * @member format.end Suffix indicating the end of a comment
 * @member contents[] Array containing the extracted data (line-by-line)
 */
export interface IComment {
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
  contents: ICommentContent[];
}

/**
 * Comment content
 * @interface ICommentContent
 * @member line The line number of the extracted comment data
 * @member column The column range indicating the start and end of the comment on this line
 * @member column.start The column number indicating the start of the comment on this line
 * @member column.end The column number indicating the end of the comment on this line
 * @member value The extracted comment on this line
 * @member raw The raw data on this line
 */
export interface ICommentContent {
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
}

/**
 * Multiline comment block
 * @interface IMultiLineComment
 * @member start The start of the comment block
 * @member end The end of the comment block
 */
interface IMultiLineComment {
  start: string;
  prefixes?: string[];
  end: string;
}

/**
 * Language definition
 * @interface ILanguage
 * @member name The name of the language
 * @member extensions List of file extensions
 * @member filenames List of filenames
 * @member multiline Multiline comment
 * @member singleline Single line comment
 * @member singleQuote Whether single quotes are used for strings
 * @member doubleQuote Whether double quotes are used for strings
 * @member backtick Whether backticks are used for strings
 */
export interface ILanguage {
  /** The name of the language */
  name: string;
  /** List of file extensions */
  extensions?: string[];
  /** List of filenames */
  filenames?: string[];
  /** Multiline comment */
  multiline?: IMultiLineComment;
  /** Single line comment */
  singleline?: string;
  /** Whether single quotes are used for strings */
  singleQuote?: boolean;
  /** Whether double quotes are used for strings */
  doubleQuote?: boolean;
  /** Whether backticks are used for strings */
  backtick?: boolean;
}

/**
 * Language tokens
 * @interface ILanguageTokens
 * @member singleline The singleline comment token
 * @member multilineStart The multiline start token
 * @member multilineEnd The multiline end token
 * @member singleQuote The single quote token
 * @member doubleQuote The double quote token
 * @member backtick The backtick token
 * @internal
 */
export interface ILanguageTokens {
  singleline?: string;
  multilineStart?: string;
  multilinePrefixes?: string[];
  multilineEnd?: string;
  singleQuote?: string;
  doubleQuote?: string;
  backtick?: string;
}

/**
 * Extractor options
 * @interface IExtractorOptions
 * @member maxLines The maximum amount of lines to extract comments from
 */
export interface IExtractorOptions {
  /** The maximum amount of lines to extract comments from */
  maxLines?: number;
  /** Group multiple singleline comments into a comment block */
  groupSingleline?: boolean;
}
