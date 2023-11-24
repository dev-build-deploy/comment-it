/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import fs from "fs";
import readline from "readline";

import { IComment, IExtractorOptions, ILanguageTokens } from "./interfaces";
import { getLanguageToken } from "./languages";

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
 * Remove prefixes from multiline comments in case all lines are starting with either
 * a valid prefix or the multiline start token
 * @param comment The comment to strip prefixes from
 * @returns The comment without prefixes
 */
function stripMultilinePrefixes(comment: IComment): IComment {
  if (comment.type !== "multiline" || comment.format.prefixes === undefined || comment.format.prefixes.length === 0) {
    return comment;
  }

  const prefixRegex = new RegExp(`^\\s*(${comment.format.prefixes.map(char => `\\${char}`).join("|")})\\s?`);

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
  let currentToken: Token | undefined = undefined;

  const language = getLanguageToken(filePath);

  let lineNumber = 1;

  const lineReader = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    for (const token of tokenize(language, line)) {
      const isMultilineEnd = token.type === "multilineEnd";
      const column = isMultilineEnd
        ? { start: 0, end: token.pos + (language[token.type]?.length ?? 0) }
        : { start: token.pos, end: line.length };

      const contents = {
        line: lineNumber,
        column: column,
        value: line
          .substring(
            column.start + (isMultilineEnd ? 0 : language[token.type]?.length ?? 0),
            isMultilineEnd ? column.end - (language[token.type]?.length ?? 0) : column.end
          )
          .trimEnd(),
        raw: line.substring(column.start, column.end),
      };

      // Remove initial space between the token and the comment
      if (contents.value.startsWith(" ")) {
        contents.value = contents.value.slice(1);
      }

      // Return a singleline comment block in case a different token has been found
      // or the new singleline comment is not on a sequential line
      if (
        options?.groupSingleline === true &&
        currentComment?.type === "singleline" &&
        (token.type !== "singleline" ||
          currentComment?.contents[currentComment.contents.length - 1].line !== lineNumber - 1 ||
          currentComment?.contents[currentComment.contents.length - 1].column.start !== column.start)
      ) {
        yield currentComment;
        currentComment = undefined;
        currentToken = undefined;
      }

      switch (token.type) {
        // We yield every singleline comment as either:
        // - a separate comment
        // - a comment block
        case "singleline":
          const entry: IComment = {
            type: "singleline",
            format: { start: language[token.type] },
            contents: [contents],
          };

          // Groups all sequential singleline comments into a comment block
          if (options?.groupSingleline === true) {
            if (currentToken) {
              currentComment?.contents.push(contents);
            } else {
              currentToken = token;
              currentComment = entry;
            }
            // Return individual comment lines
          } else if (!currentToken) {
            yield entry;
          }
          break;

        // Start recording all lines until the 'multilineEnd' token is found
        case "multilineStart":
          if (!currentToken) {
            currentToken = token;
            currentComment = {
              type: "multiline",
              format: { start: language[token.type], end: "" },
              contents: [contents],
            };
            if (language.multilinePrefixes) {
              currentComment.format.prefixes = language.multilinePrefixes;
            }
          }
          break;

        // Yield the multiline comment when the 'multilineEnd' token is found
        case "multilineEnd":
          if (currentToken && currentToken.type === "multilineStart" && currentComment) {
            const lastContent = currentComment.contents[currentComment.contents.length - 1];
            currentComment.format.end = language[token.type];
            if (lastContent.line === lineNumber) {
              lastContent.column.end = column.end;
              lastContent.value = lastContent.raw
                .substring((language[token.type]?.length ?? 0) + 1, token.pos - lastContent.column.start)
                .trimEnd();

              lastContent.raw = line.substring(
                lastContent.column.start,
                token.pos + (language[token.type]?.length ?? 0 + 1)
              );
            } else {
              currentComment.contents.push(contents);
            }
            yield stripMultilinePrefixes(currentComment);
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

    // We need to append the line to the current multiline comment if it exists
    if (
      currentComment?.type === "multiline" &&
      currentComment.contents.length > 0 &&
      currentComment.contents[currentComment.contents.length - 1].line !== lineNumber
    ) {
      currentComment?.contents.push({
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
  if (options?.groupSingleline === true && currentComment?.type === "singleline") {
    yield currentComment;
  }
}
