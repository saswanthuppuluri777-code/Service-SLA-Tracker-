import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=======================================================');
console.log(' Starting SLA Tracker Full-Stack Application...');
console.log(' Problem ID: HACK-P368');
console.log('=======================================================');

const serverProc = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'server'),
  shell: true,
  stdio: 'inherit',
});

const clientProc = spawn('npm', ['run', 'dev', '--', '--host'], {
  cwd: path.join(rootDir, 'client'),
  shell: true,
  stdio: 'inherit',
});

const cleanup = () => {
  console.log('\nShutting down SLA Tracker services...');
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
