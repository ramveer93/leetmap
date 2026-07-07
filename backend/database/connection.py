import os
import libsql_client
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Turso config from environment variables
TURSO_URL = os.environ.get("TURSO_DATABASE_URL", "").strip()
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "").strip()

# Resolve local path for database file fallback
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_DB_PATH = f"file:{os.path.join(CURRENT_DIR, 'leetmap.db')}"

def get_client() -> libsql_client.Client:
    """
    Creates and returns a synchronous libsql client.
    If TURSO_DATABASE_URL is configured, it connects to the cloud.
    Otherwise, it falls back to the local database file `leetmap.db`.
    """
    if TURSO_URL:
        # Remote cloud connection
        print(f"Connecting to cloud Turso database: {TURSO_URL}")
        return libsql_client.create_client_sync(url=TURSO_URL, auth_token=TURSO_TOKEN)
    else:
        # Local fallback connection
        print(f"No Turso credentials found. Connecting to local SQLite file: {LOCAL_DB_PATH}")
        return libsql_client.create_client_sync(url=LOCAL_DB_PATH)

def init_db():
    """
    Initializes the required tables in the database if they don't exist.
    """
    client = get_client()
    try:
        # Create custom_questions table
        client.execute("""
        CREATE TABLE IF NOT EXISTS custom_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            description TEXT DEFAULT '',
            solution TEXT DEFAULT '',
            code_language TEXT DEFAULT 'python',
            role TEXT DEFAULT '',
            difficulty TEXT DEFAULT 'Medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create leetcode_problems table
        client.execute("""
        CREATE TABLE IF NOT EXISTS leetcode_problems (
            slug TEXT PRIMARY KEY,
            id TEXT,
            title TEXT NOT NULL,
            difficulty TEXT,
            url TEXT,
            topics TEXT,
            companies TEXT
        );
        """)
        print("Database schema successfully verified/initialized.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise e
    finally:
        client.close()

# Auto-initialize database schema when this module is first imported
init_db()
