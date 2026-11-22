---
name: Bug Report
about: Report a reproducible bug in the scraper, DNS validator, or CSV writer
title: 'fix(<scope>): <short description>'
labels: 'bug, triage'
assignees: ''
---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔁 Steps to Reproduce
1. Configure `urls.js` with '...' (redact private/sensitive domains if needed)
2. Run `node scrape.js`
3. Observe error or unexpected output in `data.csv`

## 🎯 Expected Behavior
A clear and concise description of what you expected to happen.

## 📸 Terminal Logs / Output
Paste relevant console output (redact any sensitive PII or internal hostnames):

```text
Paste logs here
```

## 💻 Environment
- OS: [e.g., Windows 11, macOS 15, Ubuntu 24.04]
- Node.js Version: [e.g., 20.12.0]
- Puppeteer Version: [e.g., 23.10.4]
- Branch / Commit Hash: [e.g., `main` @ `0b8cebc`]

## 💡 Additional Context & Root Cause Hypotheses
Add any other context about the problem or suspect code locations (e.g., `scrape.js`, `scraper.js`).
