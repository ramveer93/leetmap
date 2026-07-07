import os
import json
import time
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from parser import run_parser, OUTPUT_DB_PATH

app = FastAPI(title="LeetMap API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-count"],
)

DB_DIR = os.path.dirname(OUTPUT_DB_PATH)
CUSTOM_DB_PATH = os.path.join(DB_DIR, "custom_questions.json")

leetcode_db = {}
custom_questions = []

def load_databases():
    global leetcode_db, custom_questions
    # Load LeetCode DB
    if os.path.exists(OUTPUT_DB_PATH):
        try:
            with open(OUTPUT_DB_PATH, 'r', encoding='utf-8') as f:
                leetcode_db = json.load(f)
            print(f"Loaded {len(leetcode_db)} LeetCode problems.")
        except Exception as e:
            print(f"Error loading LeetCode DB: {e}")
            leetcode_db = {}
    else:
        print("LeetCode DB does not exist yet. Run parser first.")
        leetcode_db = {}

    # Load Custom DB
    if os.path.exists(CUSTOM_DB_PATH):
        try:
            with open(CUSTOM_DB_PATH, 'r', encoding='utf-8') as f:
                custom_questions = json.load(f)
            print(f"Loaded {len(custom_questions)} custom questions.")
        except Exception as e:
            print(f"Error loading custom questions: {e}")
            custom_questions = []
    else:
        custom_questions = []
        save_custom_db()

def save_leetcode_db():
    try:
        with open(OUTPUT_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(leetcode_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving LeetCode DB: {e}")

def save_custom_db():
    try:
        with open(CUSTOM_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(custom_questions, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving Custom DB: {e}")

# Initial load
load_databases()

# Pydantic models for request validation
class CompanyUpdate(BaseModel):
    company_name: str
    title: Optional[str] = None
    difficulty: Optional[str] = None
    url: Optional[str] = None
    topics: Optional[List[str]] = None
    thirty_days: Optional[float] = Field(0.0, alias="30_days")
    three_months: Optional[float] = Field(0.0, alias="3_months")
    six_months: Optional[float] = Field(0.0, alias="6_months")
    more_than_6_months: Optional[float] = Field(0.0, alias="more_than_6_months")
    all: Optional[float] = 100.0

    class Config:
        populate_by_name = True

class CustomQuestionCreate(BaseModel):
    title: str
    company: str
    description: Optional[str] = ""
    solution: Optional[str] = ""
    code_language: Optional[str] = "python"
    role: Optional[str] = ""
    difficulty: Optional[str] = "Medium"

@app.get("/api/problems")
def get_problems(
    response: Response,
    q: Optional[str] = "",
    company: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(150, ge=1)
):
    query = q.strip().lower()
    results = []
    
    # Normalize difficulty
    target_difficulty = None
    if difficulty and difficulty.strip() and difficulty.strip().lower() != 'all':
        target_difficulty = difficulty.strip().lower()
    
    # If company query is provided, find all problems containing that company
    if company:
        from parser import normalize_company_name
        target_company = normalize_company_name(company)
        
        for slug, prob in leetcode_db.items():
            # Apply difficulty filter if specified
            if target_difficulty and prob.get('difficulty', '').lower() != target_difficulty:
                continue
                
            companies_map = prob.get('companies', {})
            matched_company_key = None
            for c in companies_map.keys():
                if c.lower() == company.lower() or c.lower() == target_company.lower():
                    matched_company_key = c
                    break
            
            if matched_company_key:
                res_item = dict(prob)
                res_item['slug'] = slug
                res_item['searched_company'] = matched_company_key
                res_item['sort_freq'] = companies_map[matched_company_key].get('all', 0.0)
                results.append(res_item)
                
        # Sort by frequency descending (highest frequency first)
        results.sort(key=lambda x: x.get('sort_freq', 0.0), reverse=True)
        
    else:
        # Standard query search (title, slug, ID, or company name)
        for slug, prob in leetcode_db.items():
            # Apply difficulty filter if specified
            if target_difficulty and prob.get('difficulty', '').lower() != target_difficulty:
                continue
                
            title = prob.get('title', '').lower()
            prob_id = str(prob.get('id', '')).lower()
            companies_list = [c.lower() for c in prob.get('companies', {}).keys()]
            
            if not query or query in title or query in slug or query in prob_id or any(query in c for c in companies_list):
                res_item = dict(prob)
                res_item['slug'] = slug
                
                # Tag frequency for sorting
                matching_companies = [c for c in prob.get('companies', {}).keys() if query in c.lower()]
                if matching_companies:
                    res_item['sort_freq'] = max(prob['companies'][c].get('all', 0.0) for c in matching_companies)
                else:
                    res_item['sort_freq'] = 0.0
                    
                results.append(res_item)
                
        # Sort if query matches a company
        if query and any(query in c.lower() for slug, prob in leetcode_db.items() for c in prob.get('companies', {}).keys()):
            results.sort(key=lambda x: x.get('sort_freq', 0.0), reverse=True)
            
    response.headers["x-total-count"] = str(len(results))
    skip = (page - 1) * limit
    return results[skip : skip + limit]

@app.get("/api/companies")
def get_companies():
    companies_set = set()
    for prob in leetcode_db.values():
        for c in prob.get('companies', {}).keys():
            companies_set.add(c)
    return sorted(list(companies_set))

@app.post("/api/problems/{slug}/company")
def add_company_to_problem(slug: str, data: CompanyUpdate):
    # Create problem on the fly if it does not exist
    if slug not in leetcode_db:
        title = data.title or slug.replace('-', ' ').title()
        difficulty = data.difficulty or 'Medium'
        url = data.url or f"https://leetcode.com/problems/{slug}"
        topics = data.topics or []
        
        leetcode_db[slug] = {
            "id": "",
            "title": title,
            "difficulty": difficulty,
            "url": url,
            "topics": topics,
            "companies": {}
        }
    
    company_name = data.company_name.strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="Company name is required.")
    
    from parser import normalize_company_name
    canonical_company = normalize_company_name(company_name)
    
    freq_data = {
        "30_days": data.thirty_days,
        "3_months": data.three_months,
        "6_months": data.six_months,
        "more_than_6_months": data.more_than_6_months,
        "all": data.all
    }
    
    if canonical_company not in leetcode_db[slug]["companies"]:
        leetcode_db[slug]["companies"][canonical_company] = freq_data
    else:
        # Merge by updating or keeping max frequency
        for period, val in freq_data.items():
            leetcode_db[slug]["companies"][canonical_company][period] = max(
                leetcode_db[slug]["companies"][canonical_company][period],
                val
            )
            
    save_leetcode_db()
    
    response_item = dict(leetcode_db[slug])
    response_item['slug'] = slug
    return response_item

@app.get("/api/custom-problems")
def get_custom_problems(
    response: Response,
    q: Optional[str] = "",
    page: int = Query(1, ge=1),
    limit: int = Query(150, ge=1)
):
    query = q.strip().lower()
    if not query:
        results = list(custom_questions)
    else:
        results = []
        for q_item in custom_questions:
            title = q_item.get('title', '').lower()
            company = q_item.get('company', '').lower()
            desc = q_item.get('description', '').lower()
            if query in title or query in company or query in desc:
                results.append(q_item)
                
    response.headers["x-total-count"] = str(len(results))
    skip = (page - 1) * limit
    return results[skip : skip + limit]

@app.post("/api/custom-problems")
def add_custom_problem(data: CustomQuestionCreate):
    title = data.title.strip()
    company = data.company.strip()
    
    if not title or not company:
        raise HTTPException(status_code=400, detail="Title and Company are required.")
        
    new_q = {
        "id": int(time.time()),
        "title": title,
        "company": company,
        "description": data.description.strip(),
        "solution": data.solution.strip(),
        "code_language": data.code_language.strip(),
        "role": data.role.strip(),
        "difficulty": data.difficulty.strip()
    }
    
    custom_questions.append(new_q)
    save_custom_db()
    return new_q

@app.delete("/api/custom-problems/{question_id}")
def delete_custom_problem(question_id: int):
    global custom_questions
    custom_questions = [q for q in custom_questions if q.get('id') != question_id]
    save_custom_db()
    return {"status": "success"}

@app.post("/api/parser/run")
def trigger_parser():
    try:
        run_parser()
        load_databases()
        return {"status": "success", "count": len(leetcode_db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
