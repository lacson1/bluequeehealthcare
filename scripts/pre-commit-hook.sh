#!/bin/bash
#
# Pre-commit hook to prevent committing sensitive information
# Install: cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# This hook checks for common password patterns and secrets

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Patterns to detect (common demo/test passwords)
PASSWORD_PATTERNS=(
  "admin123"
  "doctor123"
  "super123"
  "password123"
  "nurse123"
  "receptionist123"
  "pharmacy123"
  "pharmacist123"
  "physio123"
  "lab123"
  "changeme"
  "password"
)

# Secret patterns (API keys, tokens, etc.)
SECRET_PATTERNS=(
  "JWT_SECRET=.*[^=]"
  "SESSION_SECRET=.*[^=]"
  "API_KEY=.*[^=]"
  "api[_-]?key.*=.*[^=]"
  "secret.*=.*[^=]"
  "token.*=.*[^=]"
  "password.*=.*[^=]"
)

# Files to check (staged files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "🔍 Checking for sensitive information..."

# Check for password patterns
FOUND_PASSWORDS=false
for file in $STAGED_FILES; do
  # Skip binary files
  if [[ "$file" == *.png ]] || [[ "$file" == *.jpg ]] || [[ "$file" == *.jpeg ]] || [[ "$file" == *.gif ]] || [[ "$file" == *.pdf ]]; then
    continue
  fi
  
  for pattern in "${PASSWORD_PATTERNS[@]}"; do
    if git diff --cached "$file" | grep -qi "$pattern"; then
      echo -e "${RED}❌ SECURITY WARNING:${NC} Found potential password pattern '$pattern' in $file"
      FOUND_PASSWORDS=true
    fi
  done
done

# Check for secrets in .env files (should not be committed)
if echo "$STAGED_FILES" | grep -q "\.env$"; then
  echo -e "${RED}❌ SECURITY WARNING:${NC} Attempting to commit .env file!"
  echo -e "${YELLOW}   .env files should never be committed to git.${NC}"
  echo -e "${YELLOW}   Use .env.example instead.${NC}"
  FOUND_PASSWORDS=true
fi

# Check for secrets in code (excluding .env.example and comments)
for file in $STAGED_FILES; do
  # Skip .env.example and binary files
  if [[ "$file" == *.env.example ]] || [[ "$file" == *.png ]] || [[ "$file" == *.jpg ]] || [[ "$file" == *.jpeg ]] || [[ "$file" == *.gif ]] || [[ "$file" == *.pdf ]]; then
    continue
  fi
  
  # Check for hardcoded secrets (but allow in comments with SECURITY prefix)
  for pattern in "${SECRET_PATTERNS[@]}"; do
    # Check if pattern exists and is not in a comment or string literal
    if git diff --cached "$file" | grep -E "$pattern" | grep -v "^\+\s*//" | grep -v "^\+\s*\*" | grep -v "SECURITY:" | grep -v "example" | grep -v "change-this"; then
      echo -e "${YELLOW}⚠️  WARNING:${NC} Found potential secret pattern in $file"
      echo -e "${YELLOW}   Pattern: $pattern${NC}"
      echo -e "${YELLOW}   Make sure this is not a real secret!${NC}"
    fi
  done
done

if [ "$FOUND_PASSWORDS" = true ]; then
  echo ""
  echo -e "${RED}🚫 Commit blocked due to security concerns.${NC}"
  echo -e "${YELLOW}Please review the warnings above and:${NC}"
  echo -e "  1. Remove hardcoded passwords from code"
  echo -e "  2. Use environment variables instead"
  echo -e "  3. Never commit .env files"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ No sensitive information detected.${NC}"
exit 0

