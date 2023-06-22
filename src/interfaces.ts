/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
*/

/**
 * Comment including metadata
 * @interface IComment
 * @member type The type of comment (`singleline` or `multiline`)
 * @member format The format used to extract the comment
 * @member format.start Initial prefix for extracting a comment
 * @member format.end Suffix indicating the end of a comment
 * @member contents[] Array containing the extracted data (line-by-line)
 * @member contents[].line The line number of the comment
 * @member contents[].column The column range indicating the start and end of the comment on this line
 * @member contents[].column.start The column number indicating the start of the comment on this line
 * @member contents[].column.end The column number indicating the end of the comment on this line
 * @member contents[].value The extracted comment on this line
 */
export interface IComment {
  /** The type of comment (`singleline` or `multiline`) */
  type: "singleline" | "multiline";
  /** The format used to extract the comment */
  format: {
    /** Initial prefix for extracting a comment */
    start?: string;
    /** Suffix indicating the end of a comment */
    end?: string;
  };
  /** Array containing the extracted data (line-by-line) */
  contents: {
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
  }[];
}

/**
 * Multiline comment block
 * @interface IMultiLineComment
 * @member start The start of the comment block
 * @member end The end of the comment block
 */
interface IMultiLineComment {
  start: string;
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
 * @member quotes List of characters which can be used to quote strings
 * @internal
 */
export interface ILanguage {
  name: string;
  extensions?: string[];
  filenames?: string[];
  multiline?: IMultiLineComment;
  singleline?: string;
}

/**
 * Language tokens
 * @interface ILanguageTokens
 * @member singleline The singleline comment token
 * @member multilineStart The multiline start token
 * @member multilineEnd The multiline end token
 * @internal
 */
export interface ILanguageTokens {
  singleline: string | undefined;
  multilineStart: string | undefined;
  multilineEnd: string | undefined;
}
