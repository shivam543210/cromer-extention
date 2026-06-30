import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

import nodemailer from 'nodemailer';
import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

function parseEmails(input) {
  const set = new Set();
  for (const line of input.split('\n')) {
    const matches = line.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi);
    if (matches) matches.forEach(m => set.add(m.toLowerCase()));
  }
  return [...set];
}

async function main() {
  console.log('\n=== Email Sender ===\n');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[-] ERROR: Set EMAIL_USER and EMAIL_PASS environment variables.');
    console.log('    Create a .env file in the project root with:');
    console.log('    EMAIL_USER=your-email@gmail.com');
    console.log('    EMAIL_PASS=your-app-password');
    rl.close();
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 1,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let raw = '';
  const csvPath = join(__dirname, '..', 'linkedin-extractor', 'jobs.csv');
  const jsonPath = join(__dirname, '..', 'linkedin-extractor', 'jobs.json');

  if (existsSync(csvPath)) {
    raw = readFileSync(csvPath, 'utf-8');
    console.log('[+] Loaded emails from jobs.csv');
  } else if (existsSync(jsonPath)) {
    const jobs = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    raw = jobs.map(j => j.emails?.join('\n') || '').join('\n');
    console.log('[+] Loaded emails from jobs.json');
  } else {
    console.log('Paste emails (one per line or comma-separated) and press Ctrl+Z then Enter:\n');
    let lines = [];
    for await (const line of rl) lines.push(line);
    raw = lines.join('\n');
  }

  const emails = parseEmails(raw);
  if (!emails.length) {
    console.log('[-] No valid emails found.');
    rl.close();
    return;
  }

  console.log(`\n[+] Found ${emails.length} email(s):`);
  emails.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

  const subject = await ask('\nSubject: ');
  console.log('Message body (end with Ctrl+Z then Enter on a new line):\n');
  let bodyLines = [];
  for await (const line of rl) bodyLines.push(line);
  const body = bodyLines.join('\n');

  const confirm = await ask(`\nSend to ${emails.length} recipient(s)? (y/n): `);
  if (confirm.toLowerCase() !== 'y') {
    console.log('[-] Cancelled.');
    rl.close();
    return;
  }

  let sent = 0, failed = 0;
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: body,
      });
      console.log(`[+] Sent to ${email}`);
      sent++;
    } catch (err) {
      console.log(`[-] Failed to send to ${email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${sent} sent, ${failed} failed ===`);
  rl.close();
}

main();
