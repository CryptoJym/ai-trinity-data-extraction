#!/usr/bin/env node

// Direct MCP Data Extraction Script
// This script extracts data from Cloze and analyzes Notion data

const fs = require('fs').promises;
const path = require('path');

const outputDir = '/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project';

async function extractData() {
    console.log('🚀 Starting AI Trinity Data Extraction...\n');

    // Since we can't directly call MCP functions from here,
    // let's create task files that describe what needs to be done
    
    const tasks = {
        cloze_extraction: {
            status: 'partial',
            completed: ['user_profile'],
            pending: ['contacts', 'companies', 'tasks', 'deals', 'interactions'],
            notes: 'User profile extracted. Search endpoints returning 404.'
        },
        notion_analysis: {
            status: 'ready',
            data_file: 'notion_for_codex.json',
            insights: {
                main_project: 'Utilyze™ - Automated Background Check Platform',
                categories: ['Product Docs', 'Technical Architecture', 'API Integration', 'AI Infrastructure'],
                page_count: '20+',
                last_activity: '2025-05-30'
            }
        },
        integration_opportunities: [
            'Sync Utilyze project status with Cloze opportunities',
            'Link Notion documentation to Cloze customer communications',
            'Create unified task management across both platforms',
            'Map technical stakeholders to CRM contacts',
            'Automate milestone updates between systems'
        ]
    };

    // Save extraction status
    await fs.writeFile(
        path.join(outputDir, 'extraction_status.json'),
        JSON.stringify(tasks, null, 2)
    );

    // Create Notion analysis prompt for Codex
    const codexPrompt = `
# Notion Data Analysis Task

Read the file: notion_for_codex.json

Analyze the Notion workspace structure and create:

1. **Visual Workspace Map**
   - Show hierarchy of projects and pages
   - Identify relationships between documents
   - Map information architecture

2. **Integration Strategy**
   - How to sync with Cloze CRM
   - Which data should be synchronized
   - Automation recommendations

3. **Key Insights**
   - Most active areas
   - Documentation patterns
   - Workflow opportunities

Save your analysis to: notion_analysis_complete.md
`;

    await fs.writeFile(
        path.join(outputDir, 'codex_analysis_prompt.txt'),
        codexPrompt
    );

    // Create Cloze extraction script for Claude Code
    const claudeCodeScript = `
// Cloze Complete Extraction Script
// Run this with Claude Code to extract all remaining data

async function extractAllClozeData() {
    const results = {};
    
    try {
        // Get all contacts
        console.log('Extracting contacts...');
        results.contacts = await cloze_search_people({ query: "", limit: 100 });
        
        // Get all companies
        console.log('Extracting companies...');
        results.companies = await cloze_search_companies({ query: "", limit: 50 });
        
        // Get open tasks
        console.log('Extracting tasks...');
        results.tasks = await cloze_get_tasks({ status: "open", limit: 50 });
        
        // Get deals
        console.log('Extracting deals...');
        results.deals = await cloze_get_deals({ limit: 50 });
        
        // Save all results
        for (const [key, data] of Object.entries(results)) {
            await write_file({
                path: \`${outputDir}/cloze_\${key}.json\`,
                content: JSON.stringify(data, null, 2)
            });
        }
        
        console.log('✅ Cloze extraction complete!');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

extractAllClozeData();
`;

    await fs.writeFile(
        path.join(outputDir, 'claude_code_extraction.js'),
        claudeCodeScript
    );

    console.log('✅ Created extraction scripts and status files\n');
    console.log('📁 Files created:');
    console.log('- extraction_status.json');
    console.log('- codex_analysis_prompt.txt');
    console.log('- claude_code_extraction.js\n');
    
    console.log('🎯 Next Steps:');
    console.log('1. For Claude Code: claude --model opus');
    console.log('   Then paste the contents of claude_code_extraction.js');
    console.log('\n2. For Codex: codex --model o3');
    console.log('   Then paste the contents of codex_analysis_prompt.txt');
}

extractData().catch(console.error);
