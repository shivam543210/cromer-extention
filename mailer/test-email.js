import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

import nodemailer from 'nodemailer';

async function testEmail() {
  console.log('=== Email Sending Test ===\n');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  const pass = process.env.EMAIL_PASS;
  console.log(`EMAIL_PASS: ${pass ? `SET (${pass.length} chars, spaces: ${pass.includes(' ') ? 'YES' : 'NO'})` : 'NOT SET'}`);
  console.log();

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[-] ERROR: EMAIL_USER or EMAIL_PASS not set.');
    process.exit(1);
  }

  console.log('Creating transporter with config:');
  console.log('  service: gmail');
  console.log('  pool: true');
  console.log('  maxConnections: 1');
  console.log();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 1,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log('1. Testing SMTP connection (transporter.verify())...');
  try {
    const success = await transporter.verify();
    console.log(`   ✓ Connection verified: ${success}\n`);
  } catch (err) {
    console.log(`   ✗ Connection verification FAILED:`);
    console.log(`     Error code: ${err.code}`);
    console.log(`     Error message: ${err.message}`);
    console.log(`     Error response: ${err.response}\n`);
  }

  console.log('2. Attempting to send a test email...');
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to self for testing
      subject: 'Test Email from mailer',
      text: 'This is a test email to verify the mailer is working correctly.',
    });
    console.log(`   ✓ Email sent successfully!`);
    console.log(`     Message ID: ${info.messageId}`);
    console.log(`     Response: ${info.response}`);
  } catch (err) {
    console.log(`   ✗ Email sending FAILED:`);
    console.log(`     Error code: ${err.code}`);
    console.log(`     Error message: ${err.message}`);
    console.log(`     Error response: ${err.response}`);
    console.log(`     Error command: ${err.command}`);
    if (err.responseCode) console.log(`     Response code: ${err.responseCode}`);
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

testEmail();
