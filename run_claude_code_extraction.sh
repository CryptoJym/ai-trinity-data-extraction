#!/bin/bash
# Non-interactive Claude Code MCP Extraction Script

echo "🤖 Claude Code MCP Data Extraction (Non-Interactive)"
echo "==================================================="
echo ""

# Change to safe directory first
cd "$HOME"

# Create a simple extraction script that Claude Code can run
cat > /tmp/extract_cloze_data.js << 'EOF'
// Cloze Data Extraction Script
console.log("Starting Cloze data extraction...");

// This script should be executed by Claude Code with:
// claude --model opus --print "Execute the JavaScript code in /tmp/extract_cloze_data.js using your MCP access to extract Cloze data"

const extractClozeData = async () => {
    const outputDir = "/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project";
    
    try {
        // Get user profile
        console.log("Fetching user profile...");
        const profile = await cloze_get_user_profile();
        await write_file({
            path: `${outputDir}/cloze_user_profile_complete.json`,
            content: JSON.stringify(profile, null, 2)
        });
        
        // Search people
        console.log("Searching for contacts...");
        const people = await cloze_search_people({ query: "", limit: 50 });
        await write_file({
            path: `${outputDir}/cloze_contacts_full.json`,
            content: JSON.stringify(people, null, 2)
        });
        
        // Get tasks
        console.log("Fetching tasks...");
        const tasks = await cloze_get_tasks({ status: "open", limit: 50 });
        await write_file({
            path: `${outputDir}/cloze_tasks.json`,
            content: JSON.stringify(tasks, null, 2)
        });
        
        console.log("Extraction complete!");
        
    } catch (error) {
        console.error("Error during extraction:", error);
    }
};

extractClozeData();
EOF

echo "✅ Extraction script created at /tmp/extract_cloze_data.js"
echo ""
echo "To execute with Claude Code, run:"
echo "claude --model opus --no-interactive 'Read and execute the JavaScript code in /tmp/extract_cloze_data.js to extract Cloze data using MCP'"