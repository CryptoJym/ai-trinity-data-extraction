# Direct MCP Commands for Claude Code

Execute these commands in sequence to extract all data:

## 1. Check Cloze MCP Access
First, let's use the Cloze MCP to get your user profile:

```javascript
// Get user profile
const profile = await cloze_get_user_profile();
console.log("User Profile:", JSON.stringify(profile, null, 2));
```

## 2. Extract All Contacts
```javascript
// Search for all people
const contacts = await cloze_search_people({ 
  query: "", 
  limit: 100 
});
console.log(`Found ${contacts.length} contacts`);

// Save to file
await write_file({
  path: "/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/cloze_contacts_full.json",
  content: JSON.stringify(contacts, null, 2)
});
```

## 3. Extract All Companies
```javascript
// Search for all companies
const companies = await cloze_search_companies({ 
  query: "", 
  limit: 50 
});
console.log(`Found ${companies.length} companies`);

// Save to file
await write_file({
  path: "/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/cloze_companies.json",
  content: JSON.stringify(companies, null, 2)
});
```

## 4. Get Open Tasks
```javascript
// Get all open tasks
const tasks = await cloze_get_tasks({ 
  status: "open",
  limit: 50 
});
console.log(`Found ${tasks.length} open tasks`);

// Save to file
await write_file({
  path: "/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/cloze_tasks.json",
  content: JSON.stringify(tasks, null, 2)
});
```

## 5. Access Notion Data
```javascript
// Search Notion workspaces
const notionSearch = await API-post-search({ 
  query: "",
  filter: { property: "object", value: "database" }
});
console.log(`Found ${notionSearch.results?.length || 0} Notion databases`);

// Save for Codex
await write_file({
  path: "/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/notion_for_codex.json",
  content: JSON.stringify(notionSearch, null, 2)
});
```

## 6. Create Summary
Generate a summary report with:
- Total contacts found
- Total companies found
- Open tasks count
- Notion databases discovered

Save the summary to `data_extraction_summary.md`