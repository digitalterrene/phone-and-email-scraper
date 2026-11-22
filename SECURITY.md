# Security Policy & Vulnerability Reporting

The security and privacy of our users and the systems interacting with **Phone and Email Scraper** are top priorities. We appreciate the responsible disclosure of security issues and commit to investigating valid reports promptly.

---

## 1. Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported | Status |
|---|---|---|
| `1.x` (`main`) | :white_check_mark: | Actively supported |
| `< 1.0.0` | :x: | Unsupported — please upgrade to latest `main` |

---

## 2. Reporting a Vulnerability

**DO NOT file public GitHub issues for security vulnerabilities.**

To report a vulnerability privately:
- Use **GitHub Private Vulnerability Reporting** (Security Advisories) on the repository:
  `https://github.com/digitalterrene/phone-and-email-scraper/security/advisories/new`

Please include the following information in your report:
- **Component**: Affected file or dependency (e.g., `scrape.js`, `scraper.js`, `puppeteer`, `csv-writer`).
- **Vulnerability Type**: e.g., SSRF, CSV Formula Injection, Command Injection, Chromium Sandbox Escape, Dependency CVE.
- **Proof of Concept**: Minimal reproduction steps or sample input that safely demonstrates the issue.
- **Impact Assessment**: Potential blast radius and exploitability.

---

## 3. Vulnerability Response SLA

| Severity | Initial Response | Assessment & Triage | Resolution Target |
|---|---|---|---|
| **Critical** | Within 12 hours | Within 24 hours | 48–72 hours |
| **High** | Within 24 hours | Within 48 hours | 7 business days |
| **Medium / Low** | Within 72 hours | Within 5 business days | Next release cycle |

---

## 4. Security & Privacy Considerations for Operators

Because this tool automates a headless browser against untrusted external websites and extracts contact information (PII):
- **Never commit scraped `data.csv` outputs** containing real personal emails or phone numbers to version control.
- **Keep `puppeteer` updated** to receive upstream Chromium security patches.
- **Never run Puppeteer with `--no-sandbox`** unless inside an already-hardened container/VM boundary.
- **Validate input URLs** to prevent Server-Side Request Forgery (SSRF) against private RFC 1918 or cloud metadata endpoints (`169.254.169.254`).

For the full threat model and ethical scraping guidance, see [`docs/architecture/security-and-compliance.md`](./docs/architecture/security-and-compliance.md).

---

## 5. Responsible Disclosure Guidelines

- Do not attempt to access, modify, or exfiltrate unauthorized data.
- Do not perform Denial of Service testing against third-party websites.
- Allow reasonable time for remediation before public disclosure.
