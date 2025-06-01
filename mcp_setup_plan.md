# AI Trinity Data Extraction Project

## Objective
Set up Claude Code and Codex with all MCPs, then extract and map data from:
- **Cloze CRM** (handled by Claude Code)
- **Notion** (handled by Codex o3)

## Challenge & Solution
- **Claude Code**: Has native MCP support - can directly access Cloze
- **Codex**: No native MCP support - will use Claude Code as a bridge to access Notion

## MCP Servers Available
Based on our system check, these MCPs are configured:
1. mem0 - Shared memory
2. notion - Notion workspace access
3. cloze - CRM data access
4. filesystem - File operations
5. desktop-commander - System commands
6. github - Repository access
7. supabase - Database operations
8. figma - Design files
9. cognitive-os-obsidian - Notes
10. cognitive-os-whoop - Health data
11. cognitive-os-activitywatch - Activity tracking
12. playwright - Browser automation
13. sequential-thinking - Complex reasoning
14. web-search - Brave search API

## Execution Plan

### Phase 1: MCP Configuration
1. Ensure Claude Code has access to all MCPs
2. Create data bridge for Codex

### Phase 2: Data Extraction
1. Claude Code extracts Cloze CRM data
2. Claude Code accesses Notion data and saves for Codex
3. Codex analyzes and maps the Notion data

### Phase 3: Data Synthesis
1. Combine insights from both sources
2. Create unified data map
3. Generate actionable insights