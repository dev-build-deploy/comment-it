/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import fs from "fs";
import readline from "readline";

import { getLanguage, getLanguageToken } from "./languages";
import { Comment, ExtractorOptions, LanguageTokens } from "./types";

/**
 * A comment token that was found in the line
 * @property type The type of token
 * @property pos The position of the token in the line
 */
type Token = {
  type: "singleline" | "multilineStart" | "multilineEnd";
  pos: number;
};

/**
 * What the scanner is inside of at a given position
 * - code: neither a comment nor a string; comment and string tokens are recognised here only
 * - multiline: inside a multiline comment; only its end token is recognised
 * - string: inside a string literal opened by `quote`; only the closing quote (and escapes) are recognised
 */
type ScanState = { kind: "code" } | { kind: "multiline" } | { kind: "string"; quote: string };

/** The escape character inside string literals; the character after it never closes the string */
const ESCAPE = "\\";

/**
 * Finds the longest token of the language that starts at the provided position, considering only
 * the tokens that can start a comment or a string (e.g. `////` wins over `//`, and `"""` over `"`).
 * @param languageTokens The tokens of the language
 * @param line The line to search in
 * @param pos The position in the line
 * @returns The matching token type and its text, or undefined when no token starts at the position
 */
function matchCodeToken(
  languageTokens: LanguageTokens,
  line: string,
  pos: number
): { type: "singleline" | "multilineStart" | "string"; text: string } | undefined {
  const candidates = [
    { type: "singleline" as const, text: languageTokens.singleline },
    { type: "multilineStart" as const, text: languageTokens.multilineStart },
    { type: "string" as const, text: languageTokens.singleQuote },
    { type: "string" as const, text: languageTokens.doubleQuote },
    { type: "string" as const, text: languageTokens.backtick },
  ];

  let best: { type: "singleline" | "multilineStart" | "string"; text: string } | undefined;
  for (const candidate of candidates) {
    if (!candidate.text || !line.startsWith(candidate.text, pos)) continue;
    if (best === undefined || candidate.text.length > best.text.length) {
      best = { type: candidate.type, text: candidate.text };
    }
  }
  return best;
}

/**
 * Scans a line for comment tokens, keeping track of whether each position is code, a comment or a string.
 * Comment tokens are only recognised in code (never inside a string), and quotes only in code (never inside
 * a comment). Strings opened by a single or double quote end with the line, so that an unbalanced quote
 * cannot hide the comments on the lines that follow; backtick strings can span multiple lines.
 * @param languageTokens The tokens of the language
 * @param line The line to scan
 * @param state The state at the start of the line
 * @returns The comment tokens in the line and the state at the start of the next line
 */
function scanLine(
  languageTokens: LanguageTokens,
  line: string,
  state: ScanState
): { tokens: Token[]; state: ScanState } {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < line.length) {
    if (state.kind === "multiline") {
      const end = languageTokens.multilineEnd ? line.indexOf(languageTokens.multilineEnd, pos) : -1;
      if (end === -1) break;
      tokens.push({ type: "multilineEnd", pos: end });
      state = { kind: "code" };
      pos = end + (languageTokens.multilineEnd?.length ?? 0);
      continue;
    }

    if (state.kind === "string") {
      if (line[pos] === ESCAPE) {
        pos += 2;
        continue;
      }
      if (line.startsWith(state.quote, pos)) state = { kind: "code" };
      pos++;
      continue;
    }

    const match = matchCodeToken(languageTokens, line, pos);
    if (match === undefined) {
      pos++;
    } else if (match.type === "singleline") {
      // The rest of the line is the comment
      tokens.push({ type: "singleline", pos });
      break;
    } else if (match.type === "multilineStart") {
      tokens.push({ type: "multilineStart", pos });
      state = { kind: "multiline" };
      pos += match.text.length;
    } else {
      state = { kind: "string", quote: match.text };
      pos += match.text.length;
    }
  }

  if (state.kind === "string" && state.quote !== languageTokens.backtick) {
    state = { kind: "code" };
  }

  return { tokens, state };
}

/**
 * Turns the text after a comment token into the comment value: without trailing whitespace and
 * without the single space that usually separates the token from the text
 * @param text The text after the comment token
 * @returns The comment value
 */
function commentValue(text: string): string {
  const value = text.trimEnd();
  return value.startsWith(" ") ? value.slice(1) : value;
}

/**
 * Remove prefixes from multiline comments in case all lines are starting with either
 * a valid prefix or the multiline start token
 * @param comment The comment to strip prefixes from
 * @returns The comment without prefixes
 */
function stripMultilinePrefixes(comment: Comment): Comment {
  if (comment.type !== "multiline" || comment.format.prefixes === undefined || comment.format.prefixes.length === 0) {
    return comment;
  }

  const escapedPrefixes = comment.format.prefixes.map(char => `\\${char}`).join("|");
  const prefixRegex = new RegExp(`^\\s*(${escapedPrefixes})\\s?`);

  const allPrefixed = comment.contents.every(
    line =>
      (comment.format.start && line.raw.startsWith(comment.format.start)) ||
      (comment.format.end && line.raw.startsWith(comment.format.end)) ||
      prefixRegex.exec(line.raw) !== null
  );

  if (allPrefixed) {
    comment.contents = comment.contents.map(entry => {
      return {
        ...entry,
        value: entry.value.replace(prefixRegex, ""),
      };
    });
  }

  return comment;
}

/**
 * Extracts all comments from the provided file and yields them as an async generator
 * @param filePath The path to the file to extract comments from
 * @returns An async generator that yields comments
 */
export async function* extractComments(filePath: string, options?: ExtractorOptions): AsyncGenerator<Comment> {
  const language = getLanguage(filePath);
  const languageTokens = getLanguageToken(language);

  let state: ScanState = { kind: "code" };
  let singlelineBlock: Comment | undefined;
  let multilineComment: Comment | undefined;
  let lineNumber = 1;

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    const scanned = scanLine(languageTokens, line, state);
    state = scanned.state;

    for (const token of scanned.tokens) {
      switch (token.type) {
        // We yield every singleline comment as either:
        // - a separate comment
        // - a comment block (sequential lines, starting at the same column)
        case "singleline": {
          // Ignore shebangs
          if (language.shebang && lineNumber === 1 && line.startsWith("#!", token.pos)) break;

          const startToken = languageTokens.singleline ?? "";
          const contents = {
            line: lineNumber,
            column: { start: token.pos, end: line.length },
            value: commentValue(line.substring(token.pos + startToken.length)),
            raw: line.substring(token.pos),
          };

          if (options?.groupSingleline !== true) {
            yield { type: "singleline", format: { start: startToken }, contents: [contents] };
            break;
          }

          const last = singlelineBlock?.contents[singlelineBlock.contents.length - 1];
          if (singlelineBlock && (last?.line !== lineNumber - 1 || last?.column.start !== token.pos)) {
            yield singlelineBlock;
            singlelineBlock = undefined;
          }

          if (singlelineBlock) {
            singlelineBlock.contents.push(contents);
          } else {
            singlelineBlock = { type: "singleline", format: { start: startToken }, contents: [contents] };
          }
          break;
        }

        // Start recording all lines until the 'multilineEnd' token is found
        case "multilineStart": {
          if (singlelineBlock) {
            yield singlelineBlock;
            singlelineBlock = undefined;
          }

          const startToken = languageTokens.multilineStart ?? "";
          multilineComment = {
            type: "multiline",
            format: { start: startToken, end: "" },
            contents: [
              {
                line: lineNumber,
                column: { start: token.pos, end: line.length },
                value: commentValue(line.substring(token.pos + startToken.length)),
                raw: line.substring(token.pos),
              },
            ],
          };
          if (languageTokens.multilinePrefixes) {
            multilineComment.format.prefixes = languageTokens.multilinePrefixes;
          }
          break;
        }

        // Yield the multiline comment when the 'multilineEnd' token is found
        case "multilineEnd": {
          if (!multilineComment) break;

          const endToken = languageTokens.multilineEnd ?? "";
          const end = token.pos + endToken.length;
          const lastContent = multilineComment.contents[multilineComment.contents.length - 1];
          multilineComment.format.end = endToken;

          if (lastContent.line === lineNumber) {
            const start = lastContent.column.start + (multilineComment.format.start?.length ?? 0);
            lastContent.column.end = end;
            lastContent.value = commentValue(line.substring(start, token.pos));
            lastContent.raw = line.substring(lastContent.column.start, end);
          } else {
            multilineComment.contents.push({
              line: lineNumber,
              column: { start: 0, end: end },
              value: commentValue(line.substring(0, token.pos)),
              raw: line.substring(0, end),
            });
          }

          yield stripMultilinePrefixes(multilineComment);
          multilineComment = undefined;
          break;
        }
      }
    }

    // A line without tokens inside a multiline comment is part of that comment
    if (multilineComment && multilineComment.contents[multilineComment.contents.length - 1].line !== lineNumber) {
      multilineComment.contents.push({
        line: lineNumber,
        column: { start: 0, end: line.length },
        value: line,
        raw: line,
      });
    }

    lineNumber++;

    // Break the sequence if the maxLines option is provided
    if (options?.maxLines && lineNumber > options.maxLines) {
      break;
    }
  }

  // Return any remaining singleline comment blocks
  if (singlelineBlock) {
    yield singlelineBlock;
  }
}
