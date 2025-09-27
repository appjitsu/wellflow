#!/bin/bash

# Find all implementation files
find src -name "*.ts" -not -name "*.spec.ts" -not -name "*.test.ts" -not -path "*/__tests__/*" | while read -r file; do
  # Get the base name without extension
  base="${file%.ts}"
  dir="$(dirname "$file")"
  name="$(basename "$base")"
  
  # Check if test file exists in same directory
  if [ -f "${base}.spec.ts" ] || [ -f "${base}.test.ts" ]; then
    continue
  fi
  
  # Check if test file exists in __tests__ subdirectory
  if [ -f "${dir}/__tests__/${name}.spec.ts" ] || [ -f "${dir}/__tests__/${name}.test.ts" ]; then
    continue
  fi
  
  # If not found, print the missing test
  echo "Missing test for: $file"
done
