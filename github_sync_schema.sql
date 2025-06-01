-- GitHub Repository Sync Database Schema for Supabase
-- Complete schema for syncing GitHub data with Notion and Cloze

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main repositories table
CREATE TABLE github_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id BIGINT UNIQUE NOT NULL,
    node_id TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    owner_login TEXT NOT NULL,
    description TEXT,
    private BOOLEAN DEFAULT false,
    fork BOOLEAN DEFAULT false,
    
    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    priority TEXT CHECK (priority IN ('high', 'medium', 'low', 'archive')),
    
    -- Metrics
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    pushed_at TIMESTAMP WITH TIME ZONE,
    size INTEGER DEFAULT 0,
    stargazers_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    
    -- Language and tech stack
    language TEXT,
    topics TEXT[] DEFAULT '{}',
    has_issues BOOLEAN DEFAULT true,
    has_projects BOOLEAN DEFAULT true,
    has_wiki BOOLEAN DEFAULT true,
    
    -- URLs
    html_url TEXT NOT NULL,
    git_url TEXT,
    ssh_url TEXT,
    clone_url TEXT,
    homepage TEXT,
    
    -- Branch info
    default_branch TEXT DEFAULT 'main',
    
    -- Integration links
    notion_page_id TEXT,
    cloze_project_id TEXT,
    
    -- Sync metadata
    sync_enabled BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_frequency TEXT DEFAULT 'realtime', -- 'realtime', 'hourly', 'daily', 'manual'
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    created_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commits table
CREATE TABLE github_commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id BIGINT REFERENCES github_repositories(repo_id) ON DELETE CASCADE,
    sha TEXT UNIQUE NOT NULL,
    node_id TEXT NOT NULL,
    
    -- Commit details
    message TEXT NOT NULL,
    author_name TEXT,
    author_email TEXT,
    author_date TIMESTAMP WITH TIME ZONE,
    committer_name TEXT,
    committer_email TEXT,
    committer_date TIMESTAMP WITH TIME ZONE,
    
    -- Tree and parent info
    tree_sha TEXT,
    parent_shas TEXT[] DEFAULT '{}',
    
    -- URLs
    html_url TEXT,
    comments_url TEXT,
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verification_reason TEXT,
    
    -- Stats (populated from separate API call if needed)
    additions INTEGER,
    deletions INTEGER,
    files_changed INTEGER,
    
    -- Integration tracking
    notion_synced BOOLEAN DEFAULT false,
    cloze_synced BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pull Requests table
CREATE TABLE github_pull_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id BIGINT REFERENCES github_repositories(repo_id) ON DELETE CASCADE,
    pr_number INTEGER NOT NULL,
    node_id TEXT NOT NULL,
    
    -- PR details
    title TEXT NOT NULL,
    body TEXT,
    state TEXT CHECK (state IN ('open', 'closed')),
    locked BOOLEAN DEFAULT false,
    
    -- Branches
    head_ref TEXT,
    head_sha TEXT,
    base_ref TEXT,
    base_sha TEXT,
    
    -- User info
    user_login TEXT,
    user_id BIGINT,
    assignee_login TEXT,
    assignees TEXT[] DEFAULT '{}',
    requested_reviewers TEXT[] DEFAULT '{}',
    
    -- Labels
    labels JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    merged_at TIMESTAMP WITH TIME ZONE,
    
    -- Merge info
    merged BOOLEAN DEFAULT false,
    mergeable BOOLEAN,
    merge_commit_sha TEXT,
    merged_by_login TEXT,
    
    -- Stats
    commits INTEGER DEFAULT 0,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    changed_files INTEGER DEFAULT 0,
    
    -- Review status
    review_comments INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    
    -- URLs
    html_url TEXT,
    diff_url TEXT,
    patch_url TEXT,
    
    -- Integration
    notion_task_id TEXT,
    cloze_activity_id TEXT,
    
    UNIQUE(repo_id, pr_number)
);

-- Issues table
CREATE TABLE github_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id BIGINT REFERENCES github_repositories(repo_id) ON DELETE CASCADE,
    issue_number INTEGER NOT NULL,
    node_id TEXT NOT NULL,
    
    -- Issue details
    title TEXT NOT NULL,
    body TEXT,
    state TEXT CHECK (state IN ('open', 'closed')),
    locked BOOLEAN DEFAULT false,
    
    -- User info
    user_login TEXT,
    user_id BIGINT,
    assignee_login TEXT,
    assignees TEXT[] DEFAULT '{}',
    
    -- Labels and milestone
    labels JSONB DEFAULT '[]',
    milestone JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- URLs
    html_url TEXT,
    comments_url TEXT,
    events_url TEXT,
    
    -- Stats
    comments INTEGER DEFAULT 0,
    
    -- Type (issue or PR)
    is_pull_request BOOLEAN DEFAULT false,
    
    -- Integration
    notion_task_id TEXT,
    cloze_task_id TEXT,
    
    UNIQUE(repo_id, issue_number)
);

-- Repository categories mapping
CREATE TABLE repository_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#808080',
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- Auto-categorization rules
    name_patterns TEXT[] DEFAULT '{}',
    language_patterns TEXT[] DEFAULT '{}',
    topic_patterns TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO repository_categories (category_name, description, color, icon, display_order, name_patterns) VALUES
('background-check', 'Background Check Platform (Vuplicity/Utilyze)', '#1E40AF', '🔍', 1, 
 ARRAY['vuplicity', 'fcra', 'background-check', 'bgc', 'utilyze', 'utlyze']),
('ai-automation', 'AI & Automation Projects', '#7C3AED', '🤖', 2, 
 ARRAY['ai-', 'mcp', 'agent', 'automation', 'overseer']),
('crypto-web3', 'Cryptocurrency & Web3 Projects', '#F59E0B', '🐟', 3, 
 ARRAY['fish', 'crypto', 'nft', 'blockchain', 'royal', 'chrysalis']),
('tools-utilities', 'Tools & Utility Applications', '#10B981', '🛠️', 4, 
 ARRAY['calc', 'tool', 'utility', 'flashcard', 'timer']),
('web-projects', 'Web Applications & Sites', '#3B82F6', '🌐', 5, 
 ARRAY['web', 'site', 'dashboard', 'hub']),
('personal', 'Personal & Fun Projects', '#EC4899', '🎮', 6, 
 ARRAY['birthday', 'cats', 'game', 'personal']);

-- Activity timeline table (unified view of all activities)
CREATE TABLE github_activity_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id BIGINT REFERENCES github_repositories(repo_id) ON DELETE CASCADE,
    activity_type TEXT CHECK (activity_type IN ('commit', 'pr_opened', 'pr_merged', 'pr_closed', 
                                                'issue_opened', 'issue_closed', 'release', 'branch_created')),
    activity_id TEXT NOT NULL, -- SHA for commits, number for PRs/issues
    
    -- Common fields
    title TEXT NOT NULL,
    description TEXT,
    author_login TEXT,
    author_email TEXT,
    
    -- Timestamps
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- URLs
    html_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync status table
CREATE TABLE github_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type TEXT CHECK (sync_type IN ('full', 'incremental', 'webhook', 'manual')),
    status TEXT CHECK (status IN ('running', 'completed', 'failed')),
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    repos_synced INTEGER DEFAULT 0,
    commits_synced INTEGER DEFAULT 0,
    prs_synced INTEGER DEFAULT 0,
    issues_synced INTEGER DEFAULT 0,
    
    -- Errors
    error_count INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Integration mappings table
CREATE TABLE integration_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id BIGINT REFERENCES github_repositories(repo_id) ON DELETE CASCADE,
    
    -- Notion mappings
    notion_database_id TEXT,
    notion_page_id TEXT,
    notion_sync_enabled BOOLEAN DEFAULT true,
    notion_last_synced TIMESTAMP WITH TIME ZONE,
    
    -- Cloze mappings
    cloze_project_id TEXT,
    cloze_opportunity_id TEXT,
    cloze_sync_enabled BOOLEAN DEFAULT true,
    cloze_last_synced TIMESTAMP WITH TIME ZONE,
    
    -- N8N workflow mappings
    n8n_workflow_id TEXT,
    n8n_webhook_url TEXT,
    
    -- Custom field mappings
    field_mappings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics views
CREATE OR REPLACE VIEW repository_analytics AS
SELECT 
    r.repo_id,
    r.name,
    r.category,
    r.language,
    r.private,
    COUNT(DISTINCT c.sha) as total_commits,
    COUNT(DISTINCT pr.pr_number) FILTER (WHERE pr.state = 'open') as open_prs,
    COUNT(DISTINCT pr.pr_number) FILTER (WHERE pr.merged = true) as merged_prs,
    COUNT(DISTINCT i.issue_number) FILTER (WHERE i.state = 'open') as open_issues,
    COUNT(DISTINCT i.issue_number) FILTER (WHERE i.state = 'closed') as closed_issues,
    MAX(c.committer_date) as last_commit_date,
    r.stargazers_count,
    r.forks_count
FROM github_repositories r
LEFT JOIN github_commits c ON r.repo_id = c.repo_id
LEFT JOIN github_pull_requests pr ON r.repo_id = pr.repo_id
LEFT JOIN github_issues i ON r.repo_id = i.repo_id
GROUP BY r.repo_id, r.name, r.category, r.language, r.private, r.stargazers_count, r.forks_count;

-- Development velocity view
CREATE OR REPLACE VIEW development_velocity AS
SELECT 
    DATE_TRUNC('week', c.committer_date) as week,
    r.category,
    COUNT(DISTINCT c.sha) as commits,
    COUNT(DISTINCT c.author_email) as contributors,
    SUM(c.additions) as lines_added,
    SUM(c.deletions) as lines_removed
FROM github_commits c
JOIN github_repositories r ON c.repo_id = r.repo_id
WHERE c.committer_date >= NOW() - INTERVAL '3 months'
GROUP BY DATE_TRUNC('week', c.committer_date), r.category
ORDER BY week DESC, category;

-- Create indexes for performance
CREATE INDEX idx_repos_category ON github_repositories(category);
CREATE INDEX idx_repos_updated ON github_repositories(pushed_at DESC);
CREATE INDEX idx_repos_sync ON github_repositories(sync_enabled, last_synced_at);

CREATE INDEX idx_commits_repo_date ON github_commits(repo_id, committer_date DESC);
CREATE INDEX idx_commits_author ON github_commits(author_email);

CREATE INDEX idx_prs_repo_state ON github_pull_requests(repo_id, state);
CREATE INDEX idx_prs_dates ON github_pull_requests(created_at DESC);

CREATE INDEX idx_issues_repo_state ON github_issues(repo_id, state);
CREATE INDEX idx_issues_dates ON github_issues(created_at DESC);

CREATE INDEX idx_activity_repo_date ON github_activity_timeline(repo_id, occurred_at DESC);
CREATE INDEX idx_activity_type ON github_activity_timeline(activity_type);

-- Row Level Security
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_activity_timeline ENABLE ROW LEVEL SECURITY;

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at_db = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_github_repositories_updated_at BEFORE UPDATE
    ON github_repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();