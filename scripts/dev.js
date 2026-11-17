import { spawn } from 'node:child_process';
import process from 'node:process';

// Start the API and Vite in parallel without relying on the `concurrently` binary.
// Using npm.cmd on Windows keeps this script cross-platform for PowerShell users.
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const shell = process.platform === 'win32';
const tasks = [
  { name: 'backend', args: ['run', 'dev:server'] },
  { name: 'frontend', args: ['run', 'dev:client'] },
];

const children = [];
let stopping = false;

function stopChildren(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child && child.exitCode === null && !child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {
        // Ignore already-terminated processes during shutdown.
      }
    }
  }
  process.exitCode = exitCode;
}

for (const task of tasks) {
  const child = spawn(npmCommand, task.args, {
    stdio: 'inherit',
    shell,
    env: process.env,
  });
  children.push(child);

  child.on('error', (error) => {
    console.error(`[${task.name}] Could not start npm: ${error.message}`);
    stopChildren(1);
  });

  child.on('exit', (code, signal) => {
    if (!stopping) {
      if (signal) {
        console.log(`[${task.name}] stopped (${signal}).`);
      } else if (code !== 0) {
        console.error(`[${task.name}] exited with code ${code}.`);
      }
      stopChildren(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stopChildren(0));
process.on('SIGTERM', () => stopChildren(0));
