/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import fs from "fs";
import readline from "readline";
import { getLanguage } from "./languages";
import { IComment, IExtractorOptions, ILanguageTokens } from "./interfaces";

/**
 * A token that was found in the line
 * @property type The type of token
 * @property pos The position of the token in the line
 */
type Token = {
  type: keyof ILanguageTokens;
  pos: number;
};

/**
 * Tokenizes the provided line into comment related tokens
 * @param languageTokens List of tokens to tokenize the line with
 * @param line The line to tokenize
 * @returns A generator that yields tokens
 */
function* tokenize(languageTokens: ILanguageTokens, line: string): Generator<Token> {
  const charArr = Array.from(line);
  let pos = 0;
  while (pos !== charArr.length) {
    for (const [key, value] of Object.entries(languageTokens)) {
      if (value === undefined) continue;
      let match = true;
      for (let i = 0; i < value.length; i++) {
        match = value[i] === charArr[pos + i] && match;
      }

      if (match) {
        yield { type: key as keyof ILanguageTokens, pos: pos };
        pos += value.length - 1;
      }
    }

    pos++;
  }
}

/**
 * Extracts all comments from the provided file and yields them as an async generator
 * @param filePath The path to the file to extract comments from
 * @returns An async generator that yields comments
 */
export async function* extractComments(filePath: string, options?: IExtractorOptions): AsyncGenerator<IComment> {
  let currentComment: IComment | undefined;
  const language = getLanguage(filePath);
  let lineNumber = 1;
  let currentToken: Token | undefined = undefined;

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    for (const token of tokenize(language, line)) {
      switch (token.type) {
        // We yield every singleline comment as a separate comment
        case "singleline":
          if (!currentToken) {
            yield {
              type: "singleline",
              format: { start: language[token.type] },
              contents: [
                {
                  line: lineNumber,
                  column: { start: token.pos, end: line.length },
                  value: line.substring(token.pos, line.length),
                },
              ],
            };
          }
          break;

        // Start recording all lines until the 'multilineEnd' token is found
        case "multilineStart":
          if (!currentToken) {
            currentToken = token;
            currentComment = {
              type: "multiline",
              format: { start: language[token.type], end: "" },
              contents: [
                {
                  line: lineNumber,
                  column: { start: token.pos, end: line.length },
                  value: line.substring(token.pos, line.length),
                },
              ],
            };
          }
          break;

        // Yield the multiline comment when the 'multilineEnd' token is found
        case "multilineEnd":
          if (currentToken && currentToken.type === "multilineStart" && currentComment) {
            const lastContent = currentComment.contents[currentComment.contents.length - 1];
            currentComment.format.end = language[token.type];
            if (lastContent.line === lineNumber) {
              lastContent.column.end = token.pos + (language[token.type]?.length ?? 0);
              lastContent.value = line.substring(
                lastContent.column.start,
                token.pos + (language[token.type]?.length ?? 0)
              );
            } else {
              currentComment.contents.push({
                line: lineNumber,
                column: { start: 0, end: token.pos + (language[token.type]?.length ?? 0) },
                value: line.substring(0, token.pos + (language[token.type]?.length ?? 0)),
              });
            }
            yield currentComment;
            currentToken = undefined;
            currentComment = undefined;
          }
          break;

        // Ignore everything between quotes
        case "singleQuote":
        case "doubleQuote":
        case "backtick":
          if (currentToken && currentToken.type === token.type) {
            currentToken = undefined;
            currentComment = undefined;
          } else {
            currentToken = token;
            currentComment = undefined;
          }
          break;
      }
    }

    // We need to append the line to the current comment if it exists
    if (
      currentToken &&
      currentComment &&
      currentComment.contents.length > 0 &&
      currentComment.contents[currentComment.contents.length - 1].line !== lineNumber
    ) {
      currentComment?.contents.push({
        line: lineNumber,
        column: { start: 0, end: line.length },
        value: line,
      });
    }

    lineNumber++;

    // Break the sequence if the maxLines option is provided
    if (options?.maxLines && lineNumber > options.maxLines) {
      break;
    }
  }
}
