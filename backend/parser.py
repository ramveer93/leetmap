import os
import json
import csv
import re

DATA_SOURCES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data-sources"))
REPO1_DIR = os.path.join(DATA_SOURCES_DIR, "repo1")
REPO2_DIR = os.path.join(DATA_SOURCES_DIR, "repo2")
OUTPUT_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "database"))
OUTPUT_DB_PATH = os.path.join(OUTPUT_DB_DIR, "leetcode_db.json")

def get_slug(url, title):
    if url and isinstance(url, str) and url.strip():
        match = re.search(r'leetcode\.com/problems/([^/]+)', url)
        if match:
            return match.group(1).strip().lower()
    if title and isinstance(title, str) and title.strip():
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title).strip().lower()
        slug = re.sub(r'[\s-]+', '-', slug)
        return slug
    return ""

def normalize_company_name(name):
    name = name.strip()
    mapping = {
        "j.p. morgan": "J.P. Morgan",
        "jpmorgan": "J.P. Morgan",
        "bytedance": "ByteDance",
        "coinbase": "Coinbase",
        "facebook": "Meta",
        "meta": "Meta",
        "google": "Google",
        "apple": "Apple",
        "microsoft": "Microsoft",
        "netflix": "Netflix",
        "amazon": "Amazon",
    }
    lower_name = name.lower()
    if lower_name in mapping:
        return mapping[lower_name]
    return name.title()

def parse_float_safe(val):
    if not val:
        return 0.0
    val_clean = val.replace('%', '').strip()
    try:
        return float(val_clean)
    except ValueError:
        return 0.0

def run_parser():
    database = {}
    
    print(f"Reading from Repo 1: {REPO1_DIR}")
    if os.path.exists(REPO1_DIR):
        for company_dir in os.listdir(REPO1_DIR):
            company_path = os.path.join(REPO1_DIR, company_dir)
            if not os.path.isdir(company_path) or company_dir.startswith('.'):
                continue
            
            canonical_company = normalize_company_name(company_dir)
            
            file_map = {
                "1. Thirty Days.csv": "30_days",
                "2. Three Months.csv": "3_months",
                "3. Six Months.csv": "6_months",
                "4. More Than Six Months.csv": "more_than_6_months",
                "5. All.csv": "all"
            }
            
            for file_name, period in file_map.items():
                file_path = os.path.join(company_path, file_name)
                if not os.path.exists(file_path):
                    continue
                
                try:
                    with open(file_path, mode='r', encoding='utf-8-sig') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            title = row.get("Title", "")
                            link = row.get("Link", "")
                            difficulty = row.get("Difficulty", "")
                            freq_raw = row.get("Frequency", "0")
                            topics_raw = row.get("Topics", "")
                            
                            slug = get_slug(link, title)
                            if not slug:
                                continue
                            
                            freq = parse_float_safe(freq_raw)
                            topics = [t.strip() for t in topics_raw.split(",") if t.strip()] if topics_raw else []
                            
                            if slug not in database:
                                database[slug] = {
                                    "id": "",
                                    "title": title,
                                    "difficulty": difficulty.title(),
                                    "url": link,
                                    "topics": topics,
                                    "companies": {}
                                }
                            
                            if not database[slug]["topics"] and topics:
                                database[slug]["topics"] = topics
                            
                            if difficulty:
                                database[slug]["difficulty"] = difficulty.title()
                            if link and not database[slug]["url"]:
                                database[slug]["url"] = link
                                
                            if canonical_company not in database[slug]["companies"]:
                                database[slug]["companies"][canonical_company] = {
                                    "30_days": 0.0,
                                    "3_months": 0.0,
                                    "6_months": 0.0,
                                    "more_than_6_months": 0.0,
                                    "all": 0.0
                                }
                            
                            database[slug]["companies"][canonical_company][period] = max(
                                database[slug]["companies"][canonical_company][period],
                                freq
                            )
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    print(f"Reading from Repo 2: {REPO2_DIR}")
    if os.path.exists(REPO2_DIR):
        for company_dir in os.listdir(REPO2_DIR):
            company_path = os.path.join(REPO2_DIR, company_dir)
            if not os.path.isdir(company_path) or company_dir.startswith('.'):
                continue
            
            canonical_company = normalize_company_name(company_dir)
            
            file_map = {
                "thirty-days.csv": "30_days",
                "three-months.csv": "3_months",
                "six-months.csv": "6_months",
                "more-than-six-months.csv": "more_than_6_months",
                "all.csv": "all"
            }
            
            for file_name, period in file_map.items():
                file_path = os.path.join(company_path, file_name)
                if not os.path.exists(file_path):
                    continue
                
                try:
                    with open(file_path, mode='r', encoding='utf-8-sig') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            prob_id = row.get("ID", "")
                            title = row.get("Title", "")
                            url = row.get("URL", "")
                            difficulty = row.get("Difficulty", "")
                            freq_raw = row.get("Frequency %", "0")
                            
                            slug = get_slug(url, title)
                            if not slug:
                                continue
                            
                            freq = parse_float_safe(freq_raw)
                            
                            if slug not in database:
                                database[slug] = {
                                    "id": prob_id,
                                    "title": title,
                                    "difficulty": difficulty.title(),
                                    "url": url,
                                    "topics": [],
                                    "companies": {}
                                }
                            
                            if not database[slug]["id"] and prob_id:
                                database[slug]["id"] = prob_id
                            
                            if not database[slug]["url"] and url:
                                database[slug]["url"] = url
                                
                            if difficulty and not database[slug]["difficulty"]:
                                database[slug]["difficulty"] = difficulty.title()
                                
                            if canonical_company not in database[slug]["companies"]:
                                database[slug]["companies"][canonical_company] = {
                                    "30_days": 0.0,
                                    "3_months": 0.0,
                                    "6_months": 0.0,
                                    "more_than_6_months": 0.0,
                                    "all": 0.0
                                }
                            
                            database[slug]["companies"][canonical_company][period] = max(
                                database[slug]["companies"][canonical_company][period],
                                freq
                            )
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    os.makedirs(OUTPUT_DB_DIR, exist_ok=True)
    with open(OUTPUT_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(database, f, indent=2, ensure_ascii=False)
        
    print(f"Parsing complete! Total unique problems compiled: {len(database)}")
    print(f"Database saved to {OUTPUT_DB_PATH}")

if __name__ == "__main__":
    run_parser()
