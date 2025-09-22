#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Running single test file for debugging...');

const jest = spawn(
  'npx',
  ['jest', 'src/app.controller.spec.ts', '--no-coverage', '--verbose', '--runInBand'],
  {
    cwd: path.join(__dirname, 'apps/api'),
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'test' },
  }
);

let output = '';
let errorOutput = '';

jest.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
});

jest.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.error(text);
});

jest.on('close', (code) => {
  console.log(`\n📋 Full Output:\n${output}`);
  if (errorOutput) {
    console.log(`\n❌ Error Output:\n${errorOutput}`);
  }
  console.log(`\n✅ Process exited with code ${code}`);
});

jest.on('error', (error) => {
  console.error('❌ Error running Jest:', error);
});

// Kill after 30 seconds
setTimeout(() => {
  console.log('⏰ Timeout, killing process...');
  jest.kill('SIGKILL');
}, 30000);
