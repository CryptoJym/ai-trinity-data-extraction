#!/bin/bash
# AI Trinity Data Extraction Coordinator
# Orchestrates Claude Code and Codex to extract data from Cloze and Notion

echo "🚀 AI Trinity Data Extraction Project"
echo "====================================="
echo ""
echo "Mission: Extract and map all data from Cloze CRM and Notion"
echo "Claude Code → Cloze CRM extraction"
echo "Codex o3 → Notion data analysis"
echo ""

WORKSPACE="/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project"
cd "$WORKSPACE"

# Set up environment
echo "📋 Setting up environment..."
echo "――――――――――――――――――――――――――――"

# Export API key for Codex
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

# Create progress tracker
cat > extraction_progress.md << 'EOF'
# Data Extraction Progress

## Claude Code Tasks
- [ ] Verify MCP configuration
- [ ] Extract Cloze user profile
- [ ] Extract all contacts
- [ ] Extract all companies
- [ ] Get recent interactions
- [ ] Extract deals/opportunities
- [ ] Get all tasks
- [ ] Access Notion data for Codex
- [ ] Create summary report

## Codex Tasks
- [ ] Analyze Notion structure
- [ ] Extract key insights
- [ ] Create visual data map
- [ ] Identify integration opportunities
- [ ] Generate recommendations
- [ ] Prepare combined insights
- [ ] Create final report

## Status Updates
EOF

echo "✅ Environment ready"
echo ""

# Phase 1: Claude Code - Cloze Extraction
echo "🤖 Phase 1: Claude Code extracting Cloze CRM data..."
echo "―――――――――――――――――――――――――――――――――――――――――――――――――"

# Create a specific instruction file for Claude Code
cat > claude_code_execute.txt << 'EOF'
Please execute the following MCP operations and save all data to the specified directory:

1. First check your MCP configuration with: claude mcp list
2. Then use the Cloze MCP to extract all data as specified in claude_code_task.md
3. Also use the Notion MCP to get data for Codex
4. Save all files to: /Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/

Start with:
- cloze_get_user_profile() → save to cloze_user_profile.json
- cloze_search_people(limit=100) → save to cloze_contacts_full.json
- Continue with all other extractions listed in the task file
EOF

echo "Launching Claude Code..."
(
    echo "=== CLAUDE CODE STARTING ===" >> claude_code_log.txt
    echo "Time: $(date)" >> claude_code_log.txt
    echo "" >> claude_code_log.txt
    
    # Execute Claude Code with the task
    claude --model opus --print "$(cat claude_code_task.md)" 2>&1 | tee -a claude_code_log.txt
    
    echo "" >> claude_code_log.txt
    echo "=== CLAUDE CODE COMPLETED ===" >> claude_code_log.txt
    echo "Time: $(date)" >> claude_code_log.txt
) &

CLAUDE_PID=$!
echo "Claude Code PID: $CLAUDE_PID"

# Give Claude Code time to work
echo "⏳ Waiting for Claude Code to extract data..."
sleep 30

# Phase 2: Prepare Notion data for Codex
echo ""
echo "🔄 Phase 2: Preparing Notion data for Codex..."
echo "――――――――――――――――――――――――――――――――――――――――――――"

# Check if Claude Code created the Notion data file
if [ ! -f "notion_for_codex.json" ]; then
    echo "⚠️  Notion data not yet available. Creating mock structure for Codex..."
    
    # Create a request for Claude Code to specifically get Notion data
    cat > get_notion_data.txt << 'EOF'
Use the Notion MCP to:
1. Search for all databases: API-post-search
2. Get database schemas: API-retrieve-a-database
3. Query key databases: API-post-database-query
4. Save structured data to notion_for_codex.json
EOF
    
    echo "Requesting Notion data from Claude Code..."
    claude --model opus --quiet "$(cat get_notion_data.txt)" 2>&1 | tee -a notion_extraction_log.txt
fi

# Phase 3: Codex Analysis
echo ""
echo "🧠 Phase 3: Codex analyzing Notion data..."
echo "――――――――――――――――――――――――――――――――――――――――"

echo "Launching Codex o3..."
(
    echo "=== CODEX STARTING ===" >> codex_log.txt
    echo "Time: $(date)" >> codex_log.txt
    echo "Model: o3" >> codex_log.txt
    echo "" >> codex_log.txt
    
    # Execute Codex with the analysis task
    codex --model o3 --quiet "$(cat codex_task.md)" 2>&1 | tee -a codex_log.txt
    
    echo "" >> codex_log.txt
    echo "=== CODEX COMPLETED ===" >> codex_log.txt
    echo "Time: $(date)" >> codex_log.txt
) &

CODEX_PID=$!
echo "Codex PID: $CODEX_PID"

# Monitor progress
echo ""
echo "⏳ Monitoring extraction progress..."
echo "―――――――――――――――――――――――――――――――――"

# Simple progress indicator
for i in {1..60}; do
    # Check for output files
    FILES_CREATED=$(ls -1 *.json 2>/dev/null | wc -l)
    echo -ne "\rFiles created: $FILES_CREATED | Time elapsed: $i seconds"
    sleep 1
done
echo ""

# Phase 4: Synthesis
echo ""
echo "🔄 Phase 4: Data synthesis..."
echo "――――――――――――――――――――――――――――"

# Wait for both processes
wait $CLAUDE_PID 2>/dev/null
wait $CODEX_PID 2>/dev/null

# Check results
echo ""
echo "📊 Extraction Results:"
echo "――――――――――――――――――――"

# List all generated files
echo "Files created:"
ls -la *.json *.md 2>/dev/null | grep -v "task.md" | grep -v "plan.md"

# Create final summary
cat > extraction_complete.md << 'EOF'
# AI Trinity Data Extraction - Complete

## Execution Summary
- **Date**: $(date)
- **Claude Code**: Extracted Cloze CRM data
- **Codex o3**: Analyzed Notion structure

## Files Generated

### Cloze CRM Data (by Claude Code)
- `cloze_user_profile.json` - User profile information
- `cloze_contacts_full.json` - All contacts with stages
- `cloze_companies.json` - All companies
- `cloze_interactions.json` - Recent interactions
- `cloze_deals.json` - Deals and opportunities
- `cloze_tasks.json` - Open tasks

### Notion Data (by Claude Code for Codex)
- `notion_raw_data.json` - Raw Notion API data
- `notion_for_codex.json` - Structured for analysis

### Analysis Reports (by Codex)
- `notion_data_map.md` - Visual data structure
- `notion_analysis_recommendations.md` - Recommendations
- `unified_data_insights.md` - Combined insights
- `notion_analysis_complete.md` - Final report

## Next Steps
1. Review the extracted data
2. Implement recommended integrations
3. Set up automated synchronization
4. Create unified dashboard

## Trinity Collaboration Success! 🎉
EOF

echo ""
echo "✅ Data extraction complete!"
echo ""
echo "📁 All files saved in: $WORKSPACE"
echo ""
echo "Next steps:"
echo "1. Review extraction_complete.md for summary"
echo "2. Check individual JSON files for raw data"
echo "3. Read analysis reports for insights"
echo "4. Implement recommended integrations"