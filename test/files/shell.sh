#!/usr/bin/bash
# SPDX-FileCopyrightText: 2025 Kevin de Jong <monkaii@hotmail.com>
# SPDX-License-Identifier: CC0-1.0

echo "Meow! I'm a talking cat!"
for i in {1..5}
do
  # It's not a real cat, so it can't purr for long
  echo "Purr... ($i)"
  sleep 1
done
echo "Goodbye from the cat!"
