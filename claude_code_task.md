# Claude Code Task: MCP Setup and Data Extraction

## 1. First, verify your MCP configuration

Please run:
```bash
claude mcp list
```

## 2. If Cloze MCP is not configured, add it:

```bash
claude mcp add cloze node /Users/jamesbrady/Desktop/Cognitive_OS/Cognitive_OS/MCP_Servers/cloze-mcp-server/dist/index.js
```

## 3. Extract Cloze CRM Data

Use the Cloze MCP to:

1. **Get user profile**
   - Extract your Cloze user information
   - Save to: `cloze_user_profile.json`

2. **Search and extract all contacts**
   - Use `cloze_search_people` to get all people
   - Include their stages (lead, qualified, customer)
   - Extract company associations
   - Save to: `cloze_contacts_full.json`

3. **Extract all companies**
   - Use `cloze_search_companies` to get all companies
   - Save to: `cloze_companies.json`

4. **Get recent interactions**
   - For top 10 contacts, get their interactions
   - Include emails, calls, meetings
   - Save to: `cloze_interactions.json`

5. **Extract deals/opportunities**
   - Use `cloze_get_deals` to get all deals
   - Include status and assignments
   - Save to: `cloze_deals.json`

6. **Get all tasks**
   - Use `cloze_get_tasks` with status "open"
   - Save to: `cloze_tasks.json`

## 4. Help Codex with Notion Data

Since Codex doesn't have direct MCP access:

1. **Access Notion via MCP**
   - Use the Notion MCP to search databases
   - Extract key workspaces and pages
   - Save raw data to: `notion_raw_data.json`

2. **Create Codex-friendly format**
   - Structure the data for easy analysis
   - Include database schemas
   - Save to: `notion_for_codex.json`

## 5. Create Summary Report

Generate a summary including:
- Total contacts in Cloze
- Contact distribution by stage
- Active deals count
- Open tasks count
- Notion workspaces found
- Key databases identified

Save to: `data_extraction_summary.md`

All files should be saved to: `/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/`