#!/usr/bin/env python3
"""
Script pour configurer la base de données Supabase avec les tables et fonctions nécessaires
"""

import requests
import json
import sys

# Configuration Supabase
SUPABASE_URL = "https://brznmveoycrwlyksffvh.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyem5tdmVveWNyd2x5a3NmZnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyMDU0MSwiZXhwIjoyMDc1NDk2NTQxfQ.5SBbjktksc_-FeYGzUXGqYZXrXyi0BHarc1nTf83vD4"

def execute_sql_via_postgrest(sql_query):
    """Exécuter une requête SQL via l'API PostgREST"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    payload = {"sql": sql_query}

    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            print(f"✅ Requête SQL exécutée avec succès")
            return True
        else:
            print(f"❌ Erreur: {response.status_code}")
            try:
                error_info = response.json()
                print(f"Détails: {error_info}")
            except:
                print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return False

def main():
    print("🔧 Configuration de la base de données Supabase")
    print("=" * 50)

    # Lire le fichier SQL
    try:
        with open('create_missing_functions.sql', 'r') as f:
            sql_content = f.read()
        print(f"✅ Fichier SQL lu avec succès")
    except Exception as e:
        print(f"❌ Erreur lecture fichier SQL: {str(e)}")
        return

    # Diviser le SQL en instructions individuelles
    sql_statements = []
    current_statement = ""

    for line in sql_content.split('\n'):
        line = line.strip()
        if line and not line.startswith('--'):
            current_statement += line + " "
            if line.endswith(';'):
                sql_statements.append(current_statement.strip())
                current_statement = ""

    print(f"📝 {len(sql_statements)} instructions SQL à exécuter")

    # Exécuter chaque instruction
    success_count = 0
    for i, statement in enumerate(sql_statements, 1):
        print(f"\n🔄 Exécution {i}/{len(sql_statements)}: {statement[:50]}...")

        if execute_sql_via_postgrest(statement):
            success_count += 1
        else:
            print(f"⚠️ Échec de l'instruction {i}, continuation...")

    print(f"\n" + "=" * 50)
    print(f"📊 RÉSULTAT: {success_count}/{len(sql_statements)} instructions exécutées")

    if success_count > 0:
        print("✅ Configuration de la base de données terminée")
        print("🌐 Testez l'authentification dans l'interface web!")
    else:
        print("❌ Aucune instruction n'a pu être exécutée")
        print("💡 Utilisez le dashboard Supabase pour exécuter manuellement le SQL")

if __name__ == "__main__":
    main()