# Backend Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file:**
   ```env
   PORT=3001
   OPENAI_API_KEY=sk-your-actual-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```

4. **Get your OpenAI API key:**
   - Go to https://platform.openai.com/account/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (it starts with `sk-` or `sk-proj-`)
   - Paste it into your `.env` file

5. **Start the server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Invalid API Key Error

If you see this error:
```
AuthenticationError: 401 Incorrect API key provided
```

**Solutions:**
1. **Check your `.env` file:**
   - Make sure `OPENAI_API_KEY` is set
   - The key should start with `sk-` or `sk-proj-`
   - No extra spaces or quotes around the key
   - The key should be at least 20 characters long

2. **Verify the key format:**
   ```env
   # ✅ Correct format:
   OPENAI_API_KEY=sk-proj-abc123def456...
   
   # ❌ Wrong formats:
   OPENAI_API_KEY="sk-proj-abc123..."  # Don't use quotes
   OPENAI_API_KEY= sk-proj-abc123...  # No spaces
   OPENAI_API_KEY=am_pruto_man         # Wrong format
   ```

3. **Get a new API key:**
   - Visit https://platform.openai.com/account/api-keys
   - Create a new secret key
   - Update your `.env` file
   - Restart the server

4. **Check API key status:**
   - Visit https://platform.openai.com/account/usage
   - Ensure your account has credits/quota
   - Check if the key is active

### API Quota Exceeded

If you see quota errors:
- Check your billing at https://platform.openai.com/account/billing
- Add payment method if needed
- Check usage limits

### Health Check

Check if the API key is configured correctly:
```bash
curl http://localhost:3001/api/health
```

This will show:
- Server status
- Whether API key is configured
- Whether API key format is valid
