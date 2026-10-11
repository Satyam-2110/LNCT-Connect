#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetPath = path.resolve(__dirname, '../../frontend/src/types/database.ts');

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId || projectId === '[YOUR_PROJECT_ID]' || projectId.trim() === '') {
  console.error('[Error] SUPABASE_PROJECT_ID is not configured or contains placeholder [YOUR_PROJECT_ID].');
  console.error('Please set SUPABASE_PROJECT_ID in your environment or .env before generating database types:');
  console.error('  export SUPABASE_PROJECT_ID=your-project-ref');
  console.error('Database types file was preserved and not modified: ' + targetPath);
  process.exit(1);
}

try {
  console.log(`Generating Supabase TypeScript types for project: ${projectId}...`);
  const output = execSync(`supabase gen types typescript --project-id "${projectId}"`, {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'inherit']
  });

  if (!output || output.trim() === '') {
    throw new Error('Supabase CLI returned empty output.');
  }

  fs.writeFileSync(targetPath, output, 'utf-8');
  console.log(`Successfully updated database types: ${targetPath}`);
} catch (error) {
  console.error('[Error] Failed to generate types with Supabase CLI:', error.message);
  process.exit(1);
}
