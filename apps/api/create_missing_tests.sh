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
  
  # Create __tests__ directory if it doesn't exist
  mkdir -p "${dir}/__tests__"
  
  # Create empty test file
  test_file="${dir}/__tests__/${name}.spec.ts"
  echo "import { Test, TestingModule } from '@nestjs/testing';

describe('${name}', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<${name}>(/* ${name} */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
" > "$test_file"
  
  echo "Created test file: $test_file"
done
