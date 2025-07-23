# Vercel Environment Variables Setup

## Problem
The QBR Navigator is failing on Vercel with a 500 error because the OpenRouter API key environment variable is not configured.

## Solution
You need to add the `OPENROUTER_API_KEY` environment variable to your Vercel project settings.

### Steps:

1. **Go to your Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Find your `qbr-generator` project

2. **Navigate to Settings:**
   - Click on your project
   - Go to "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add the Environment Variable:**
   - Click "Add New" button
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** `[GET NEW API KEY FROM OPENROUTER - OLD KEY WAS COMPROMISED]`
   - **Environments:** Select all (Production, Preview, Development)
   - Click "Save"

4. **Redeploy:**
   - Go back to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger a redeploy

### Alternative: Using Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Set the environment variable
vercel env add OPENROUTER_API_KEY
# When prompted, paste: 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
# Select all environments (Production, Preview, Development)

# Redeploy
vercel --prod
```

### Verification:
After adding the environment variable and redeploying, the QBR generation should work properly. The improved error handling will now show detailed debug information if there are still issues.

## Current Status:
- ✅ Local development works (API key in .env.local)
- ❌ Vercel deployment fails (missing API key in environment)
- ✅ Enhanced error handling added for debugging