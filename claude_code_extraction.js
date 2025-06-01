
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
                path: `/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project/cloze_${key}.json`,
                content: JSON.stringify(data, null, 2)
            });
        }
        
        console.log('✅ Cloze extraction complete!');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

extractAllClozeData();
