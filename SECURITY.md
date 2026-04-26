# Security Guidelines

## Overview

This document outlines security best practices for the PlayMoreTCG application, particularly around credential management and secret protection.

## Environment Variables

### Configuration Files

- **`.env`**: Template file with placeholder values (committed to version control)
- **`.env.local`**: Local configuration with actual credentials (NOT committed, gitignored)
- **Other `.env.*.local`**: Branch/environment-specific configurations (gitignored)

### Application Secrets

The application uses SQLite for persistence and HTTP-only cookies for session state. Keep server-only secrets in `.env.local` or your deployment secret manager:

```env
SESSION_SECRET=replace_with_a_long_random_secret
SQLITE_DATABASE_PATH=playmore.db
```

## Security Practices

### ✅ What Should Be Committed

- `.env` - Template with placeholder values
- Source code without hardcoded secrets
- Configuration files (`.gitignore`, `tsconfig.json`, etc.)
- Documentation (this `SECURITY.md` file)

### ❌ What Must NOT Be Committed

- `.env.local` - Actual deployment secrets
- SQLite database files containing production/customer data
- API secrets, tokens, or passwords
- `*.local` files
- `.env` files (unless they only contain placeholders)

### Git Protection

The `.gitignore` file includes the following patterns to prevent credential leaks:

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.local
```

### Development Workflow

1. Copy the template:
   ```bash
   cp .env .env.local
   ```

2. Edit `.env.local` with your actual deployment secrets
3. Verify the file is not committed using `git status`
4. The application will load credentials from `.env.local` automatically

### Production Deployment

⚠️ **IMPORTANT**: When deploying to production, NEVER use environment variables. Instead:

1. Configure your hosting provider with `SESSION_SECRET` and database path/storage
2. Keep SQLite database files on persistent, private storage
3. Serve the app over HTTPS so secure cookies can be used in production

## Credential Protection Checklist

- [x] `.env` file uses placeholder values (committed)
- [x] Real credentials stored in `.env.local` (gitignored)
- [x] No hardcoded secrets in source code
- [x] `.gitignore` properly configured
- [x] Security documentation created
- [ ] Team members informed of security practices

## Common Security Mistakes

❌ **Don't**:
- Commit `.env.local` or any file with real credentials
- Hardcode secrets in plain text files
- Push sensitive data to public repositories

✅ **Do**:
- Use `.env` for templates and `.env.local` for actual credentials
- Review git history before committing sensitive changes
- Rotate credentials if they are exposed
- Keep authentication and database access server-side through Next API routes

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
- [OWASP Secret Scanning](https://owasp.org/www-project-secret-skanning/)

## Support

If you believe credentials have been exposed:

1. Immediately rotate affected secrets
2. Update your `.env.local` file
3. Rotate any affected tokens if applicable
4. Review git history for any committed secrets