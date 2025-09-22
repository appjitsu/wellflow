#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running simple compilation test...');

// First, let's try to compile the TypeScript files
const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
  cwd: path.join(__dirname, 'apps/api'),
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'test' },
});

let output = '';
let errorOutput = '';

tsc.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
});

tsc.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.error(text);
});

tsc.on('close', (code) => {
  console.log(`\n📋 TypeScript compilation result: ${code === 0 ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (code === 0) {
    console.log('🧪 Now running a simple Jest test...');

    // Run a simple test
    const jest = spawn(
      'npx',
      ['jest', '--testNamePattern=should return "Hello World!"', '--no-coverage', '--verbose'],
      {
        cwd: path.join(__dirname, 'apps/api'),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
      }
    );

    let jestOutput = '';
    let jestError = '';

    jest.stdout.on('data', (data) => {
      const text = data.toString();
      jestOutput += text;
      console.log(text);
    });

    jest.stderr.on('data', (data) => {
      const text = data.toString();
      jestError += text;
      console.error(text);
    });

    jest.on('close', (jestCode) => {
      console.log(`\n📋 Jest test result: ${jestCode === 0 ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (jestError) {
        console.log(`\n❌ Jest Error Output:\n${jestError}`);
      }
    });

    // Kill Jest after 15 seconds
    setTimeout(() => {
      console.log('⏰ Killing Jest process...');
      jest.kill('SIGKILL');
    }, 15000);
  }
});

tsc.on('error', (error) => {
  console.error('❌ Error running TypeScript:', error);
});

// Kill TypeScript check after 30 seconds
setTimeout(() => {
  console.log('⏰ Killing TypeScript process...');
  tsc.kill('SIGKILL');
}, 30000);
