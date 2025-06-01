#!/usr/bin/env node

// GitHub Repository Data Extractor
// Extracts and analyzes your GitHub repositories

const fs = require('fs');
const https = require('https');

// Configuration
const USERNAME = 'CryptoJym';
const OUTPUT_DIR = './github_data';

// Repository categories
const CATEGORIES = {
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
    'Chrysalis', 'Fishproject', 'FISHREWARDS', 'fishy-reward-gauge',
    'fishy-fortune-dashboard', 'fishmonger-dashboard'
  ],
  'tools-utilities': [
    'RoyalCalcV2', 'FlashCardsofPOWER', 'loom-autopublisher',
    'TimingApp-MCP', 'RoyalCalc', 'FISH-CALC'
  ],
  'web-projects': [
    'voucher-hub', 'wallet-display-hub', 'loyalty-login',
    'nft-aggregator-dashboard', 'onchain-rewards-aggregator',
    'royal-webdeck', 'JamesBrady'
  ]
};

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fetch repositories from GitHub API
function fetchRepositories(page = 1) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${USERNAME}/repos?per_page=100&page=${page}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js GitHub Sync',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Categorize repository
function categorizeRepo(repoName) {
  for (const [category, repos] of Object.entries(CATEGORIES)) {
    if (repos.includes(repoName)) {
      return category;
    }
  }
  
  // Auto-categorize based on name patterns
  if (repoName.toLowerCase().includes('fish')) return 'crypto-web3';
  if (repoName.toLowerCase().includes('mcp')) return 'ai-automation';
  if (repoName.toLowerCase().includes('birthday') || 
      repoName.toLowerCase().includes('cats')) return 'personal';
  
  return 'other';
}

// Main function
async function main() {
  console.log('🔍 Fetching GitHub repositories...');
  
  try {
    // Fetch all repositories
    const allRepos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const repos = await fetchRepositories(page);
      allRepos.push(...repos);
      hasMore = repos.length === 100;
      page++;
    }
    
    console.log(`📊 Found ${allRepos.length} repositories`);
    
    // Process and categorize repositories
    const categorizedRepos = {};
    const repoAnalytics = {
      total: allRepos.length,
      public: 0,
      private: 0,
      byCategory: {},
      byLanguage: {},
      recentlyUpdated: [],
      mostStarred: []
    };
    
    allRepos.forEach(repo => {
      const category = categorizeRepo(repo.name);
      
      if (!categorizedRepos[category]) {
        categorizedRepos[category] = [];
      }
      
      categorizedRepos[category].push({
        name: repo.name,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        created: repo.created_at,
        updated: repo.updated_at,
        pushed: repo.pushed_at,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        url: repo.html_url
      });
      
      // Update analytics
      if (repo.private) {
        repoAnalytics.private++;
      } else {
        repoAnalytics.public++;
      }
      
      repoAnalytics.byCategory[category] = (repoAnalytics.byCategory[category] || 0) + 1;
      
      if (repo.language) {
        repoAnalytics.byLanguage[repo.language] = (repoAnalytics.byLanguage[repo.language] || 0) + 1;
      }
    });
    
    // Sort repos by update time
    const sortedByUpdate = [...allRepos].sort((a, b) => 
      new Date(b.pushed_at) - new Date(a.pushed_at)
    );
    
    repoAnalytics.recentlyUpdated = sortedByUpdate.slice(0, 10).map(r => ({
      name: r.name,
      updated: r.pushed_at,
      category: categorizeRepo(r.name)
    }));
    
    // Sort by stars
    const sortedByStars = [...allRepos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    repoAnalytics.mostStarred = sortedByStars.slice(0, 5).map(r => ({
      name: r.name,
      stars: r.stargazers_count
    }));
    
    // Save categorized data
    fs.writeFileSync(
      `${OUTPUT_DIR}/repositories_by_category.json`,
      JSON.stringify(categorizedRepos, null, 2)
    );
    
    // Save analytics
    fs.writeFileSync(
      `${OUTPUT_DIR}/repository_analytics.json`,
      JSON.stringify(repoAnalytics, null, 2)
    );
    
    // Generate markdown report
    let report = `# GitHub Repository Analysis\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Repositories**: ${repoAnalytics.total}\n`;
    report += `- **Public**: ${repoAnalytics.public}\n`;
    report += `- **Private**: ${repoAnalytics.private}\n\n`;
    
    report += `## By Category\n\n`;
    for (const [category, count] of Object.entries(repoAnalytics.byCategory)) {
      report += `- **${category}**: ${count} repos\n`;
    }
    
    report += `\n## Recently Updated\n\n`;
    repoAnalytics.recentlyUpdated.forEach(repo => {
      report += `- **${repo.name}** (${repo.category}) - ${repo.updated}\n`;
    });
    
    report += `\n## Top Languages\n\n`;
    const topLanguages = Object.entries(repoAnalytics.byLanguage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    topLanguages.forEach(([lang, count]) => {
      report += `- **${lang}**: ${count} repos\n`;
    });
    
    report += `\n## Key Projects\n\n`;
    report += `### Background Check Platform (Utilyze/Vuplicity)\n`;
    if (categorizedRepos['background-check']) {
      categorizedRepos['background-check'].forEach(repo => {
        report += `- **${repo.name}**${repo.private ? ' (private)' : ''}: ${repo.description || 'No description'}\n`;
      });
    }
    
    report += `\n### AI & Automation\n`;
    if (categorizedRepos['ai-automation']) {
      categorizedRepos['ai-automation'].forEach(repo => {
        report += `- **${repo.name}**${repo.private ? ' (private)' : ''}: ${repo.description || 'No description'}\n`;
      });
    }
    
    fs.writeFileSync(`${OUTPUT_DIR}/repository_report.md`, report);
    
    // Generate sync commands
    const syncScript = `#!/bin/bash
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
`;
    
    fs.writeFileSync(`${OUTPUT_DIR}/sync_repos.sh`, syncScript);
    fs.chmodSync(`${OUTPUT_DIR}/sync_repos.sh`, '755');
    
    console.log('✅ Analysis complete! Check the github_data directory for:');
    console.log('   - repositories_by_category.json');
    console.log('   - repository_analytics.json');
    console.log('   - repository_report.md');
    console.log('   - sync_repos.sh');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
main();