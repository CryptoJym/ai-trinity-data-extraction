#!/bin/bash
# GitHub to Database Sync Script

echo "🚀 Starting GitHub repository sync..."

# Export required environment variables
# export GITHUB_TOKEN="your-github-token"
# export SUPABASE_URL="your-supabase-url"
# export SUPABASE_ANON_KEY="your-supabase-key"

# Install dependencies
npm install @supabase/supabase-js @octokit/rest

# Run sync
node github_sync.js

echo "✅ Sync completed!"
