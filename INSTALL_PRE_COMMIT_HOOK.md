# Install Pre-Commit Hook

## Quick Install

Run this command to install the pre-commit hook:

```bash
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

## What It Does

The pre-commit hook automatically checks for:

1. **Hardcoded Passwords** - Common demo/test passwords
2. **Secrets in Code** - API keys, tokens, secrets
3. **.env Files** - Prevents committing `.env` files

## Testing

Test the hook by trying to commit a file with a password:

```bash
# Create a test file
echo "const password = 'admin123';" > test.ts
git add test.ts
git commit -m "test"

# Should fail with security warning
```

## Manual Check

You can also run the hook manually:

```bash
bash scripts/pre-commit-hook.sh
```

## Bypassing (Not Recommended)

If you absolutely need to bypass the hook (e.g., for documentation):

```bash
git commit --no-verify -m "message"
```

**⚠️ Warning**: Only bypass for legitimate reasons. Never commit real secrets.

## Customization

Edit `scripts/pre-commit-hook.sh` to:
- Add more password patterns
- Add more secret patterns
- Change warning messages

## Troubleshooting

### Hook Not Running
- Check if file exists: `ls -la .git/hooks/pre-commit`
- Check permissions: `chmod +x .git/hooks/pre-commit`
- Verify it's executable: `file .git/hooks/pre-commit`

### False Positives
- If you need to use a password pattern in documentation, prefix with `SECURITY:` comment
- Example: `// SECURITY: This is an example password, not real`

