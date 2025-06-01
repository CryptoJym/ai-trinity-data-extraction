#!/usr/bin/env python3

import json
import requests
import os

# Cloze API configuration
CLOZE_API_KEY = "d6a734618ad33f0772633455ca468ef5"
CLOZE_API_URL = "https://api.cloze.com/v1"
OUTPUT_DIR = "/Users/jamesbrady/Desktop/ai_trinity_workspace/data_extraction_project"

def cloze_api_request(endpoint, params=None):
    """Make a request to the Cloze API"""
    headers = {
        "Authorization": f"Bearer {CLOZE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{CLOZE_API_URL}/{endpoint}"
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        return None

def extract_cloze_data():
    """Extract all available data from Cloze"""
    print("🔍 Starting Cloze data extraction...")
    
    # Try different endpoints
    endpoints = [
        ("profile", None),
        ("people/list", {"limit": 50}),
        ("companies/list", {"limit": 50}),
        ("projects/list", {"limit": 50}),
        ("timeline/list", {"limit": 50}),
    ]
    
    results = {}
    
    for endpoint, params in endpoints:
        print(f"\nTrying endpoint: {endpoint}")
        data = cloze_api_request(endpoint, params)
        
        if data:
            results[endpoint.replace('/', '_')] = data
            
            # Save to file
            filename = f"cloze_{endpoint.replace('/', '_')}.json"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            
            print(f"✅ Saved {filename}")
        else:
            print(f"❌ Failed to get data from {endpoint}")
    
    # Create summary
    summary = {
        "extraction_date": "2025-06-01",
        "endpoints_tried": len(endpoints),
        "successful_extractions": len(results),
        "files_created": list(results.keys())
    }
    
    summary_path = os.path.join(OUTPUT_DIR, "cloze_extraction_summary.json")
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✅ Extraction complete! Summary saved to {summary_path}")

if __name__ == "__main__":
    extract_cloze_data()
