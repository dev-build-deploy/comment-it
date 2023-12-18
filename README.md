<!--
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# CommentIt - Comment Extraction Library

Extract comment blocks from your files.

## Features

* Simple to use
* Extracts single- and multiline- comment blocks
* Supports a range of [languages](./src/languages/languages.json) covering the top 25 languages used in GitHub (+ more)

<!-- Hee hee, hid a comment block in here -->

## Basic Usage

```typescript
import { extractComments } from "@dev-build-deploy/comment-it";

const file = "README.md";

// Check if the file is supported by CommentIt
if (isSupported(file)) {
  const config = {
    /** Only consider comments in the first ..n lines */
    maxLines: 20,
    /** Group sequential singleline comments into a comment block */
    groupSingleline: true,
  };

  // Retrieve each comment block using an iterator
  for await (const comment of extractComments(file), /* OPTIONAL */ config) {
    console.log(JSON.stringify(comment, null, 2));
  }
}
```

The above example will result in:

<!-- REUSE-IgnoreStart -->
```json
{
  "type": "multiline",
  "format": { "start": "<!--", "end": "-->"},
  "contents": [
    {
      "line":   1,
      "column": { "start": 0, "end":  4 },
      "raw":    "<!--",
      "value":  ""
    },
    {
      "line":   2,
      "column": { "start": 0, "end": 64 },
      "raw":    "SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>",
      "value":  "SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>"
    },
    {
      "line":   3,
      "column": { "start": 0, "end": 41 },
      "raw":    "SPDX-License-Identifier: MIT",
      "value":  "SPDX-License-Identifier: MIT"
    },
    {
      "line":  4,
      "column": { "start": 0, "end":  3 },
      "raw": "-->",
      "value": ""
    }
  ]
}

{
  "type": "multiline",
  "format": { "start": "<!--", "end": "-->" },
  "contents": [
    {
      "line": 16,
      "column": { "start": 0, "end": 45 },
      "raw": "<!-- Hee hee, hid a comment block in here -->",
      "value": "Hee hee, hid a comment block in here"
    }
  ]
}
```
<!-- REUSE-IgnoreEnd -->

## Custom Language(s)

You can use the `addLanguage()` function to add new languages to the validation set:

```typescript
import { addLanguage } from "@dev-build-deploy/comment-it";

addLanguage({
  name: "Pingu Language",
  filenames: [".pingu"],
  extensions: [".noot"],
  singleline: "{%NOOTNOOT%}",
});
```

The same function can also be used to override a (default) configuration. For example,
the following code snippet replaces the comment prefix from `;` to `#` for files with
the`.ini` file extension:

```typescript
import { addLanguage } from "@dev-build-deploy/comment-it";

addLanguage({
  name: "Custom ini",
  extensions: [".ini"],
  singleline: "#",
});
```

## Contributing

If you have suggestions for how comment-it could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [MIT](./LICENSES/MIT.txt) © 2023 Kevin de Jong \<monkaii@hotmail.com\>

[SemVer 2.0.0]: https://semver.org
