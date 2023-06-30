<!--
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: GPL-3.0-or-later
-->

# CommentIt - Comment Extraction Library

Extract comment blocks from your files.

## Features

* Simple to use
* Extracts single- and multiline- comment blocks
* Supports a small selection of [languages](./src/languages/languages.json)

<!-- Hee hee, hid a comment block in here -->

## Basic Usage

```typescript
import { extractComments } from "@dev-build-deploy/comment-it";

const file = "README.md";

// Check if the file is supported by CommentIt
if (isSupported(file)) {
  // Retrieve each comment block using an iterator
  for await (const comment of extractComments(file), /* OPTIONAL */ { maxLines: 20 }) {
    console.log(JSON.stringify(comment, null, 2))
  }
}
```

This will result in [IComment](#comment-interface) objects, considering the above example:

<!-- REUSE-IgnoreStart -->
```json
{
  "type": "multiline",
  "format": { "start": "<!--", "end": "-->"},
  "contents": [
    { "line":  1, "column": { "start": 0, "end":  4 }, "value": "<!--" },
    { "line":  2, "column": { "start": 0, "end": 64 }, "value": "SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>" },
    { "line":  3, "column": { "start": 0, "end": 41 }, "value": "SPDX-License-Identifier: GPL-3.0-or-later" },
    { "line":  4, "column": { "start": 0, "end":  3 }, "value": "-->" }
  ]
}

{
  "type": "multiline",
  "format": { "start": "<!--", "end": "-->" },
  "contents": [
    { "line": 16, "column": { "start": 0, "end": 45 }, "value": "<!-- Hee hee, hid a comment block in here -->" }
  ]
}
```
<!-- REUSE-IgnoreEnd -->

## Comment Interface

```typescript
/**
 * Comment including metadata
 *
 * @interface IComment
 *
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
  contents: {
    line: number;
    column: {
      start: number;
      end: number
    };
    value: string
  }[];
  type: "singleline" | "multiline";
  format: {
    start?: string;
    end?: string;
  };
}
```

## Contributing

If you have suggestions for how comment-it could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [GPL-3.0-or-later AND CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>

[SemVer 2.0.0]: https://semver.org
