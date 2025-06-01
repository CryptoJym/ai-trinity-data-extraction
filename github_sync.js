// GitHub Repository Sync Implementation
// This script syncs your GitHub repositories with your database

import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';

// Configuration
const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    username: 'CryptoJym'
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY
  },
  notion: {
    token: process.env.NOTION_TOKEN,
    databaseId: process.env.NOTION_PROJECTS_DB
  }
};

// Initialize clients
const octokit = new Octokit({ auth: config.github.token });
const supabase = createClient(config.supabase.url, config.supabase.key);

// Repository categories based on analysis
const REPO_CATEGORIES = {
  'Vuplicity': 'background-check',
  'fcra-compliance-system': 'background-check',
  'background-check-mcp': 'background-check',
  'mcp-background-check-agent': 'background-check',
  'Vuplicity-Progress': 'background-check',
  'Utlyze-optionB': 'background-check',
  'utah-bgc-mesh': 'background-check',
  'ai-trinity-data-extraction': 'ai-automation',
  'ai-image-animation-pipeline': 'ai-automation',
  'heygen-mcp-adapter': 'ai-automation',
  'tiktok-mcp-adapter': 'ai-automation',
  'Agent-starter-kit': 'ai-automation',
  'Overseer': 'ai-automation',
  'website-eater': 'ai-automation',
  'fishrewards-nft': 'crypto-web3',
  'royal-rwa': 'crypto-web3',
  'blockchain-reward-hub': 'crypto-web3',
  'Chrysalis': 'crypto-web3',
  'RoyalCalcV2': 'tools-utilities',
  'FlashCardsofPOWER': 'tools-utilities',
  'loom-autopublisher': 'tools-utilities',
  'TimingApp-MCP': 'tools-utilities'
};

// Main sync function
async function syncGitHubRepos() {
  console.log('🚀 Starting GitHub repository sync...');
  
  try {
    // 1. Fetch all repositories
    const repos = await fetchAllRepositories();
    console.log(`📊 Found ${repos.length} repositories`);
    
    // 2. Process each repository
    for (const repo of repos) {
      await processRepository(repo);
    }
    
    // 3. Generate analytics
    await generateAnalytics();
    
    console.log('✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Fetch all repositories with pagination
async function fetchAllRepositories() {
  const repos = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const { data } = await octokit.repos.listForUser({
      username: config.github.username,
      per_page: 100,
      page,
      type: 'all'
    });
    
    repos.push(...data);
    hasMore = data.length === 100;
    page++;
  }
  
  return repos;
}

// Process individual repository
async function processRepository(repo) {
  console.log(`📝 Processing: ${repo.name}`);
  
  // Determine category
  const category = REPO_CATEGORIES[repo.name] || 'other';
  
  // Prepare repository data
  const repoData = {
    repo_id: repo.id,
    repo_name: repo.name,
    description: repo.description,
    is_private: repo.private,
    category,
    language: repo.language,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    last_push: repo.pushed_at,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    open_issues: repo.open_issues_count,
    html_url: repo.html_url,
    default_branch: repo.default_branch
  };
  
  // Upsert to database
  const { error } = await supabase
    .from('github_projects')
    .upsert(repoData, { onConflict: 'repo_id' });
  
  if (error) {
    console.error(`Failed to sync ${repo.name}:`, error);
    return;
  }
  
  // Fetch additional details for important repos
  if (category === 'background-check' || category === 'ai-automation') {
    await fetchRepoDetails(repo);
  }
}

// Fetch detailed repository information
async function fetchRepoDetails(repo) {
  try {
    // Get recent commits
    const { data: commits } = await octokit.repos.listCommits({
      owner: config.github.username,
      repo: repo.name,
      per_page: 10
    });
    
    // Store commits
    for (const commit of commits) {
      await supabase.from('github_commits').upsert({
        repo_id: repo.id,
        commit_sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        timestamp: commit.commit.author.date
      }, { onConflict: 'commit_sha' });
    }
    
    // Get open issues
    const { data: issues } = await octokit.issues.listForRepo({
      owner: config.github.username,
      repo: repo.name,
      state: 'open',
      per_page: 20
    });
    
    // Store issues
    for (const issue of issues) {
      await supabase.from('github_issues').upsert({
        repo_id: repo.id,
        issue_number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels.map(l => l.name),
        assignees: issue.assignees.map(a => a.login),
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }, { onConflict: ['repo_id', 'issue_number'] });
    }
    
  } catch (error) {
    console.error(`Failed to fetch details for ${repo.name}:`, error);
  }
}

// Generate analytics and insights
async function generateAnalytics() {
  console.log('📊 Generating analytics...');
  
  // Category breakdown
  const { data: categoryStats } = await supabase
    .from('github_projects')
    .select('category')
    .select('category, count(*)')
    .group('category');
  
  // Activity metrics
  const { data: activityStats } = await supabase
    .from('github_commits')
    .select('repo_id, count(*)')
    .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .group('repo_id');
  
  // Save analytics
  await supabase.from('github_analytics').insert({
    generated_at: new Date().toISOString(),
    category_breakdown: categoryStats,
    recent_activity: activityStats,
    total_repos: categoryStats?.reduce((sum, cat) => sum + cat.count, 0) || 0
  });
}

// Create database tables (run once)
async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS github_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_id INTEGER UNIQUE NOT NULL,
      repo_name TEXT NOT NULL,
      description TEXT,
      is_private BOOLEAN,
      category TEXT,
      language TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      last_push TIMESTAMP,
      stars INTEGER,
      forks INTEGER,
      open_issues INTEGER,
      html_url TEXT,
      default_branch TEXT,
      notion_page_id TEXT,
      cloze_project_id TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS github_commits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_id INTEGER REFERENCES github_projects(repo_id),
      commit_sha TEXT UNIQUE,
      message TEXT,
      author TEXT,
      timestamp TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS github_issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_id INTEGER,
      issue_number INTEGER,
      title TEXT,
      state TEXT,
      labels JSONB,
      assignees JSONB,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      UNIQUE(repo_id, issue_number)
    )`,
    
    `CREATE TABLE IF NOT EXISTS github_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      generated_at TIMESTAMP,
      category_breakdown JSONB,
      recent_activity JSONB,
      total_repos INTEGER
    )`
  ];
  
  for (const sql of tables) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) console.error('Table creation error:', error);
  }
}

// Export functions
export { syncGitHubRepos, createTables, fetchAllRepositories };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncGitHubRepos();
}