import pandas as pd
import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv
load_dotenv('../.env')

supabaseUrl = os.getenv('VITE_SUPABASE_URL')
supabaseKey = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
supabase: Client = create_client(supabaseUrl, supabaseKey)

# Load your data
with open("../data/emailUserMapping.json", 'r', encoding='utf-8') as file:
    userMapping = json.load(file)

sellingPointsAccountManager = pd.read_csv("../data/sellingPointsAccountManager.csv")
sellingPointsAccountManager["accountManager"] = sellingPointsAccountManager["accountManager"].apply(lambda x: userMapping[x])

updatedCount = 0
failedCount = 0
failedIds = []

for index, row in sellingPointsAccountManager.iterrows():
    try:
        # Update by name instead of ID
        result = supabase.table('sellingPoints').update({
            'accountManager': row['accountManager']
        }).eq('name', row['sellingPointName']).execute()
        
        if result.data:
            updatedCount += 1
            print(f"✅ Updated {row['sellingPointName']} with account manager {row['accountManager']}")
        else:
            failedCount += 1
            print(f"❌ Failed to update {row['sellingPointName']}")
            
    except Exception as e:
        failedCount += 1
        print(f"❌ Error updating {row['sellingPointName']}: {e}")

print(f"\n📊 Update Summary:")
print(f"  ✅ Successfully updated: {updatedCount}")
print(f"  ❌ Failed updates: {failedCount}")
print(f"  📋 Total processed: {len(sellingPointsAccountManager)}")