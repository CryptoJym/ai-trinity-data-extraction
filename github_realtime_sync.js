// GitHub Real-time Sync Engine
// Uses GitHub MCP tools to sync repositories with database

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Repository categories
const REPO_CATEGORIES = {
  'background-check': [
    'Vuplicity', 'fcra-compliance-system', 'background-check-mcp',
    'mcp-background-check-agent', 'Vuplicity-Progress', 'Utlyze-optionB',
    'utah-bgc-mesh', 'Progress7bgc'
  ],
  'ai-automation': [
    'ai-trinity-data-extraction', 'ai-image-animation-pipeline',
    'heygen-mcp-adapter', 'tiktok-mcp-adapter', 'Agent-starter-kit',
    'Overseer', 'website-eater', 'heygenagent'
  ],
  'crypto-web3': [
    'fishrewards-nft', 'royal-rwa', 'blockchain-reward-hub',
    'Chrysalis', 'Fishproject', 'FISHREWARDS'
  ],
  'tools-utilities': [
    'RoyalCalcV2', 'FlashCardsofPOWER', 'loom-autopublisher',
    'TimingApp-MCP', 'RoyalCalc', 'FISH-CALC'
  ]
};

class GitHubSyncEngine {
  constructor() {
    this.username = 'CryptoJym';
    this.syncStats = {
      repos: 0,
      commits: 0,
      prs: 0,
      issues: 0,
      errors: []
    };
  }

  // Main sync function
  async syncAllRepositories() {
    console.log('🚀 Starting GitHub real-time sync...');
    
    const syncStatus = await this.createSyncStatus();
    
    try {
      // Get all repositories using search
      const repos = await this.fetchAllRepositories();
      console.log(`📊 Found ${repos.length} repositories`);
      
      // Process each repository
      for (const repo of repos) {
        await this.processRepository(repo);
      }
      
      // Update timeline
      await this.updateActivityTimeline();
      
      // Complete sync status
      await this.completeSyncStatus(syncStatus.id);
      
      console.log('✅ Sync completed successfully!');
      return this.syncStats;
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      await this.failSyncStatus(syncStatus.id, error);
      throw error;
    }
  }

  // Fetch all repositories
  async fetchAllRepositories() {
    const repos = [];
    let page = 1;
    
    // Using search_repositories from GitHub MCP
    while (true) {
      const result = await searchRepositories({
        query: `user:${this.username}`,
        page,
        perPage: 100
      });
      
      repos.push(...result.items);
      
      if (result.items.length < 100) break;
      page++;
    }
    
    return repos;
  }

  // Process individual repository
  async processRepository(repo) {
    console.log(`📝 Processing: ${repo.name}`);
    
    try {
      // Determine category
      const category = this.categorizeRepo(repo.name);
      
      // Prepare repository data
      const repoData = {
        repo_id: repo.id,
        node_id: repo.node_id,
        name: repo.name,
        full_name: repo.full_name,
        owner_login: repo.owner.login,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        category,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        watchers_count: repo.watchers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        language: repo.language,
        topics: repo.topics || [],
        has_issues: repo.has_issues,
        has_projects: repo.has_projects,
        has_wiki: repo.has_wiki,
        html_url: repo.html_url,
        git_url: repo.git_url,
        ssh_url: repo.ssh_url,
        clone_url: repo.clone_url,
        homepage: repo.homepage,
        default_branch: repo.default_branch,
        last_synced_at: new Date().toISOString()
      };
      
      // Upsert to database
      const { error } = await supabase
        .from('github_repositories')
        .upsert(repoData, { onConflict: 'repo_id' });
      
      if (error) throw error;
      
      this.syncStats.repos++;
      
      // Sync additional data for important repos
      if (this.isImportantRepo(repo.name, category)) {
        await this.syncRepoDetails(repo);
      }
      
    } catch (error) {
      console.error(`Failed to sync ${repo.name}:`, error);
      this.syncStats.errors.push({ repo: repo.name, error: error.message });
    }
  }

  // Sync detailed repository data
  async syncRepoDetails(repo) {
    // Sync recent commits
    await this.syncCommits(repo);
    
    // Sync pull requests
    await this.syncPullRequests(repo);
    
    // Sync issues
    await this.syncIssues(repo);
  }

  // Sync commits
  async syncCommits(repo) {
    try {
      const commits = await listCommits({
        owner: this.username,
        repo: repo.name,
        perPage: 50
      });
      
      for (const commit of commits) {
        const commitData = {
          repo_id: repo.id,
          sha: commit.sha,
          node_id: commit.node_id,
          message: commit.commit.message,
          author_name: commit.commit.author?.name,
          author_email: commit.commit.author?.email,
          author_date: commit.commit.author?.date,
          committer_name: commit.commit.committer?.name,
          committer_email: commit.commit.committer?.email,
          committer_date: commit.commit.committer?.date,
          tree_sha: commit.commit.tree?.sha,
          parent_shas: commit.parents?.map(p => p.sha) || [],
          html_url: commit.html_url,
          comments_url: commit.comments_url,
          verified: commit.commit.verification?.verified || false,
          verification_reason: commit.commit.verification?.reason
        };
        
        await supabase
          .from('github_commits')
          .upsert(commitData, { onConflict: 'sha' });
        
        this.syncStats.commits++;
      }
    } catch (error) {
      console.error(`Failed to sync commits for ${repo.name}:`, error);
    }
  }

  // Sync pull requests
  async syncPullRequests(repo) {
    try {
      const prs = await listPullRequests({
        owner: this.username,
        repo: repo.name,
        state: 'all',
        perPage: 30
      });
      
      for (const pr of prs) {
        const prData = {
          repo_id: repo.id,
          pr_number: pr.number,
          node_id: pr.node_id,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          locked: pr.locked,
          head_ref: pr.head?.ref,
          head_sha: pr.head?.sha,
          base_ref: pr.base?.ref,
          base_sha: pr.base?.sha,
          user_login: pr.user?.login,
          user_id: pr.user?.id,
          assignee_login: pr.assignee?.login,
          assignees: pr.assignees?.map(a => a.login) || [],
          requested_reviewers: pr.requested_reviewers?.map(r => r.login) || [],
          labels: pr.labels || [],
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          closed_at: pr.closed_at,
          merged_at: pr.merged_at,
          merged: pr.merged || false,
          merge_commit_sha: pr.merge_commit_sha,
          html_url: pr.html_url,
          diff_url: pr.diff_url,
          patch_url: pr.patch_url
        };
        
        await supabase
          .from('github_pull_requests')
          .upsert(prData, { onConflict: ['repo_id', 'pr_number'] });
        
        this.syncStats.prs++;
      }
    } catch (error) {
      console.error(`Failed to sync PRs for ${repo.name}:`, error);
    }
  }

  // Sync issues
  async syncIssues(repo) {
    try {
      const issues = await listIssues({
        owner: this.username,
        repo: repo.name,
        state: 'all',
        per_page: 30
      });
      
      for (const issue of issues) {
        // Skip if it's a PR (has pull_request key)
        if (issue.pull_request) continue;
        
        const issueData = {
          repo_id: repo.id,
          issue_number: issue.number,
          node_id: issue.node_id,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          locked: issue.locked,
          user_login: issue.user?.login,
          user_id: issue.user?.id,
          assignee_login: issue.assignee?.login,
          assignees: issue.assignees?.map(a => a.login) || [],
          labels: issue.labels || [],
          milestone: issue.milestone,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          closed_at: issue.closed_at,
          html_url: issue.html_url,
          comments_url: issue.comments_url,
          events_url: issue.events_url,
          comments: issue.comments
        };
        
        await supabase
          .from('github_issues')
          .upsert(issueData, { onConflict: ['repo_id', 'issue_number'] });
        
        this.syncStats.issues++;
      }
    } catch (error) {
      console.error(`Failed to sync issues for ${repo.name}:`, error);
    }
  }

  // Update activity timeline
  async updateActivityTimeline() {
    // Get recent activities from all tables and merge into timeline
    const activities = [];
    
    // Recent commits
    const { data: commits } = await supabase
      .from('github_commits')
      .select('*')
      .order('committer_date', { ascending: false })
      .limit(100);
    
    commits?.forEach(commit => {
      activities.push({
        repo_id: commit.repo_id,
        activity_type: 'commit',
        activity_id: commit.sha,
        title: commit.message?.split('\n')[0] || 'Commit',
        description: commit.message,
        author_login: commit.author_name,
        author_email: commit.author_email,
        occurred_at: commit.committer_date,
        html_url: commit.html_url
      });
    });
    
    // Recent PRs
    const { data: prs } = await supabase
      .from('github_pull_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    prs?.forEach(pr => {
      if (pr.merged_at) {
        activities.push({
          repo_id: pr.repo_id,
          activity_type: 'pr_merged',
          activity_id: pr.pr_number.toString(),
          title: `PR #${pr.pr_number}: ${pr.title}`,
          description: pr.body,
          author_login: pr.user_login,
          occurred_at: pr.merged_at,
          html_url: pr.html_url
        });
      }
    });
    
    // Insert activities
    if (activities.length > 0) {
      await supabase
        .from('github_activity_timeline')
        .insert(activities);
    }
  }

  // Helper functions
  categorizeRepo(repoName) {
    const lowerName = repoName.toLowerCase();
    
    for (const [category, patterns] of Object.entries(REPO_CATEGORIES)) {
      if (patterns.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
        return category;
      }
    }
    
    // Additional categorization logic
    if (lowerName.includes('fish')) return 'crypto-web3';
    if (lowerName.includes('mcp') || lowerName.includes('agent')) return 'ai-automation';
    if (lowerName.includes('birthday') || lowerName.includes('cat')) return 'personal';
    
    return 'other';
  }

  isImportantRepo(repoName, category) {
    const importantRepos = [
      'Vuplicity', 'fcra-compliance-system', 'background-check-mcp',
      'ai-trinity-data-extraction', 'Overseer', 'fishrewards-nft'
    ];
    
    return importantRepos.includes(repoName) || 
           category === 'background-check' || 
           category === 'ai-automation';
  }

  // Sync status management
  async createSyncStatus() {
    const { data } = await supabase
      .from('github_sync_status')
      .insert({
        sync_type: 'full',
        status: 'running'
      })
      .select()
      .single();
    
    return data;
  }

  async completeSyncStatus(syncId) {
    await supabase
      .from('github_sync_status')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        repos_synced: this.syncStats.repos,
        commits_synced: this.syncStats.commits,
        prs_synced: this.syncStats.prs,
        issues_synced: this.syncStats.issues,
        error_count: this.syncStats.errors.length,
        errors: this.syncStats.errors
      })
      .eq('id', syncId);
  }

  async failSyncStatus(syncId, error) {
    await supabase
      .from('github_sync_status')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_count: 1,
        errors: [{ message: error.message, stack: error.stack }]
      })
      .eq('id', syncId);
  }
}

// Export the sync engine
export default GitHubSyncEngine;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const engine = new GitHubSyncEngine();
  engine.syncAllRepositories()
    .then(stats => {
      console.log('📊 Sync Statistics:', stats);
    })
    .catch(error => {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    });
}