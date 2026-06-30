# LinkedIn Hiring Extractor

A Chrome extension that scrapes hiring posts from LinkedIn's feed, extracts structured data, and manages leads in a built-in CRM dashboard with optional bulk email capabilities.

## Features

- **One-click extraction** — Scrape hiring posts from the current LinkedIn page
- **Structured data** — Extracts company, role, emails, phones, salary, location, experience, tags
- **CRM Dashboard** — Search, filter, sort, paginate, merge duplicates, add notes
- **Export** — Download leads as CSV or Excel
- **Webhook** — Send selected leads to n8n or other webhooks
- **Bulk email** — Send emails to extracted recipients via your own SMTP/email server

## Getting Started

### 1. Load the Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `linkedin-extractor` folder
4. The extension icon will appear in your toolbar

### 2. Extract Leads

1. Navigate to any LinkedIn feed page showing hiring posts
2. Click the extension icon and select **Extract Current Page**
3. The CRM dashboard opens with extracted data

### 3. Email Server Setup (Optional)

Run the local email server to send bulk emails:

```bash
cd mailer
npm install
```

Create a `.env` file in the project root:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-google-app-password
```

Start the server:

```bash
npm start
```

The server runs on `http://localhost:3456` by default.

### 4. Vercel Deployment (Optional)

Deploy the API as a serverless function:

```bash
# Add EMAIL_USER and EMAIL_PASS as environment variables in Vercel dashboard
vercel --prod
```

Set the email server URL in the CRM dashboard settings to your Vercel URL.

## Project Structure

```
├── api/send-emails.js        # Vercel serverless email function
├── linkedin-extractor/        # Chrome Extension
│   ├── manifest.json
│   ├── core/                  # Data processing pipeline
│   ├── popup/                 # Extension popup UI
│   ├── dashboard/             # CRM dashboard
│   └── utils/                 # Utilities
├── mailer/                    # Local Express email server
└── .env                       # Credentials (gitignored)
```

## Privacy

- All data stays in your browser's local storage
- No data is sent to third parties
- The `.env` file with credentials is gitignored
- Email recipient data is not tracked in git
