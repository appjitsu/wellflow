#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Kill any existing Jest processes
console.log('🔄 Killing existing Jest processes...');
spawn('pkill', ['-f', 'jest'], { stdio: 'inherit' });

// Wait a moment for processes to die
setTimeout(() => {
  console.log('🧪 Running tests with detailed output...');

  const jest = spawn(
    'npx',
    ['jest', '--no-coverage', '--verbose', '--runInBand', '--detectOpenHandles', '--forceExit'],
    {
      cwd: path.join(__dirname, 'apps/api'),
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' },
    }
  );

  jest.on('close', (code) => {
    console.log(`\n✅ Jest process exited with code ${code}`);
    process.exit(code);
  });

  jest.on('error', (error) => {
    console.error('❌ Error running Jest:', error);
    process.exit(1);
  });

  // Kill the process after 60 seconds if it's still running
  setTimeout(() => {
    console.log('⏰ Timeout reached, killing Jest process...');
    jest.kill('SIGKILL');
    process.exit(1);
  }, 60000);
}, 2000);
