# .do/app.yaml Review & Recommendations

## ✅ Current Status

Your `.do/app.yaml` file is **mostly correct** but needs a few updates before deployment.

## 🔴 Critical Issues

### 1. **JWT_SECRET and SESSION_SECRET Placeholders**

**Current State:**
```yaml
- key: JWT_SECRET
  value: "CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32"
- key: SESSION_SECRET
  value: "CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32"
```

**Problem:** These are placeholder values. The app will fail or have security issues if not replaced.

**Solution:**
1. Generate secrets:
   ```bash
   openssl rand -base64 64  # For JWT_SECRET
   openssl rand -base64 64  # For SESSION_SECRET
   ```

2. **IMPORTANT:** When deploying via DigitalOcean dashboard:
   - Set these values in the dashboard (Settings → Environment Variables)
   - Mark them as **SECRET** type (click lock icon 🔒)
   - **DO NOT** put real secrets in the YAML file if committing to git

3. If using `doctl` CLI, you can set them directly:
   ```bash
   doctl apps update <app-id> --spec .do/app.yaml
   # Then update secrets via dashboard or CLI
   ```

## ⚠️ Recommendations

### 2. **App Name Mismatch**

**Current:**
```yaml
name: clinicconnect
```

**Repository:** `lacson1/bluequeehealthcare`

**Recommendation:** Update to match repository:
```yaml
name: bluequeehealthcare
```

### 3. **Formatting**

- Missing blank line before Ingress section (line 96)
- Minor formatting improvements in comments

### 4. **Optional: CORS Configuration**

If you plan to use a custom domain, consider adding:
```yaml
- key: ALLOWED_ORIGINS
  scope: RUN_TIME
  value: "https://your-domain.com,https://www.your-domain.com"
```

## ✅ What's Good

- ✅ GitHub repository correctly set: `lacson1/bluequeehealthcare`
- ✅ Dockerfile path correct: `Dockerfile.optimized`
- ✅ Port configured: `5001`
- ✅ Health check properly configured
- ✅ Database configuration present
- ✅ Alerts configured
- ✅ Autodeploy enabled

## 📝 Recommended Changes

I've created `.do/app.yaml.reviewed` with improvements:

1. ✅ App name updated to `bluequeehealthcare`
2. ✅ Better comments and warnings
3. ✅ Formatting improvements
4. ✅ Optional CORS configuration commented out
5. ✅ Clear instructions for secret management

## 🚀 Deployment Checklist

Before deploying:

- [ ] Generate `JWT_SECRET` (64+ characters)
- [ ] Generate `SESSION_SECRET` (64+ characters)
- [ ] Update app name to match repository (optional but recommended)
- [ ] Set secrets in DigitalOcean dashboard as SECRET type
- [ ] Verify GitHub repository is accessible
- [ ] Test deployment in staging first (if possible)

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Keep placeholder values in YAML
   - Set real values in DigitalOcean dashboard

2. **Use SECRET type for sensitive values**
   - JWT_SECRET
   - SESSION_SECRET
   - API keys (OpenAI, Anthropic, SendGrid)

3. **Rotate secrets periodically**
   - Change JWT_SECRET and SESSION_SECRET every 90 days
   - Update via DigitalOcean dashboard

## 📊 Current Configuration Summary

| Setting        | Value                        | Status              |
| -------------- | ---------------------------- | ------------------- |
| App Name       | `clinicconnect`              | ⚠️ Consider updating |
| Repository     | `lacson1/bluequeehealthcare` | ✅ Correct           |
| Branch         | `main`                       | ✅ Correct           |
| Port           | `5001`                       | ✅ Correct           |
| Database       | PostgreSQL 16 (dev)          | ✅ Correct           |
| JWT_SECRET     | Placeholder                  | 🔴 **MUST UPDATE**   |
| SESSION_SECRET | Placeholder                  | 🔴 **MUST UPDATE**   |

## 🎯 Next Steps

1. **Review** `.do/app.yaml.reviewed` for improvements
2. **Generate secrets** using the commands above
3. **Deploy via dashboard** (recommended) or CLI
4. **Set secrets** in DigitalOcean dashboard as SECRET type
5. **Monitor** first deployment closely

---

**Note:** The current `.do/app.yaml` will work, but you MUST set the secrets in the DigitalOcean dashboard before the app will function correctly in production.

