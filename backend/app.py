import os
import json
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from parser import run_parser

# Load env variables
load_dotenv()

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

def get_leetcode_db() -> Dict[str, Dict[str, Any]]:
    from database.connection import get_client
    client = get_client()
    try:
        res = client.execute("SELECT * FROM leetcode_problems")
        db = {}
        for row in res:
            db[row["slug"]] = {
                "id": row["id"],
                "title": row["title"],
                "difficulty": row["difficulty"],
                "url": row["url"],
                "topics": json.loads(row["topics"] or "[]"),
                "companies": json.loads(row["companies"] or "{}")
            }
        return db
    except Exception as e:
        print(f"Error loading LeetCode DB from database: {e}")
        return {}
    finally:
        client.close()

def save_leetcode_problem_to_db(slug: str, prob: Dict[str, Any]):
    from database.connection import get_client
    from libsql_client import Statement
    client = get_client()
    try:
        client.execute(Statement(
            "INSERT OR REPLACE INTO leetcode_problems (slug, id, title, difficulty, url, topics, companies) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                slug,
                str(prob.get("id", "")),
                prob.get("title", ""),
                prob.get("difficulty", ""),
                prob.get("url", ""),
                json.dumps(prob.get("topics", [])),
                json.dumps(prob.get("companies", {}))
            ]
        ))
    except Exception as e:
        print(f"Error saving LeetCode problem {slug} to database: {e}")
        raise e
    finally:
        client.close()

def get_custom_problems_db(query: str = "") -> List[Dict[str, Any]]:
    from database.connection import get_client
    client = get_client()
    try:
        if query:
            sql = "SELECT * FROM custom_questions WHERE LOWER(title) LIKE ? OR LOWER(company) LIKE ? OR LOWER(description) LIKE ?"
            p = f"%{query.lower()}%"
            res = client.execute(sql, [p, p, p])
        else:
            res = client.execute("SELECT * FROM custom_questions ORDER BY id DESC")
            
        results = []
        for row in res:
            results.append({
                "id": row["id"],
                "title": row["title"],
                "company": row["company"],
                "description": row["description"] or "",
                "solution": row["solution"] or "",
                "code_language": row["code_language"] or "python",
                "role": row["role"] or "",
                "difficulty": row["difficulty"] or "Medium"
            })
        return results
    except Exception as e:
        print(f"Error loading custom questions from database: {e}")
        return []
    finally:
        client.close()

def add_custom_problem_to_db(prob: Dict[str, Any]) -> Dict[str, Any]:
    from database.connection import get_client
    from libsql_client import Statement
    client = get_client()
    try:
        client.execute(Statement(
            "INSERT INTO custom_questions (title, company, description, solution, code_language, role, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                prob["title"],
                prob["company"],
                prob["description"],
                prob["solution"],
                prob["code_language"],
                prob["role"],
                prob["difficulty"]
            ]
        ))
        # Fetch the newly created record to get the auto-generated id
        res = client.execute(
            "SELECT * FROM custom_questions WHERE title = ? AND company = ? ORDER BY id DESC LIMIT 1",
            [prob["title"], prob["company"]]
        )
        row = list(res)[0] if list(res) else None
        if row:
            return {
                "id": row["id"],
                "title": row["title"],
                "company": row["company"],
                "description": row["description"] or "",
                "solution": row["solution"] or "",
                "code_language": row["code_language"] or "python",
                "role": row["role"] or "",
                "difficulty": row["difficulty"] or "Medium"
            }
        raise HTTPException(status_code=500, detail="Failed to fetch created custom question.")
    except Exception as e:
        print(f"Error adding custom question to database: {e}")
        raise e
    finally:
        client.close()

def delete_custom_problem_from_db(question_id: int):
    from database.connection import get_client
    client = get_client()
    try:
        client.execute("DELETE FROM custom_questions WHERE id = ?", [question_id])
    except Exception as e:
        print(f"Error deleting custom question {question_id} from database: {e}")
        raise e
    finally:
        client.close()

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
        
    leetcode_db = get_leetcode_db()
    
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
    leetcode_db = get_leetcode_db()
    companies_set = set()
    for prob in leetcode_db.values():
        for c in prob.get('companies', {}).keys():
            companies_set.add(c)
    return sorted(list(companies_set))

@app.post("/api/problems/{slug}/company")
def add_company_to_problem(slug: str, data: CompanyUpdate):
    leetcode_db = get_leetcode_db()
    
    # Create problem on the fly if it does not exist
    if slug not in leetcode_db:
        title = data.title or slug.replace('-', ' ').title()
        difficulty = data.difficulty or 'Medium'
        url = data.url or f"https://leetcode.com/problems/{slug}"
        topics = data.topics or []
        
        prob_data = {
            "id": "",
            "title": title,
            "difficulty": difficulty,
            "url": url,
            "topics": topics,
            "companies": {}
        }
    else:
        prob_data = dict(leetcode_db[slug])
    
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
    
    if canonical_company not in prob_data["companies"]:
        prob_data["companies"][canonical_company] = freq_data
    else:
        # Merge by updating or keeping max frequency
        for period, val in freq_data.items():
            prob_data["companies"][canonical_company][period] = max(
                prob_data["companies"][canonical_company][period],
                val
            )
            
    save_leetcode_problem_to_db(slug, prob_data)
    
    response_item = dict(prob_data)
    response_item['slug'] = slug
    return response_item

@app.get("/api/custom-problems")
def get_custom_problems(
    response: Response,
    q: Optional[str] = "",
    page: int = Query(1, ge=1),
    limit: int = Query(150, ge=1)
):
    results = get_custom_problems_db(q)
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
        "title": title,
        "company": company,
        "description": data.description.strip() if data.description else "",
        "solution": data.solution.strip() if data.solution else "",
        "code_language": data.code_language.strip() if data.code_language else "python",
        "role": data.role.strip() if data.role else "",
        "difficulty": data.difficulty.strip() if data.difficulty else "Medium"
    }
    
    return add_custom_problem_to_db(new_q)

@app.delete("/api/custom-problems/{question_id}")
def delete_custom_problem(question_id: int):
    delete_custom_problem_from_db(question_id)
    return {"status": "success"}

@app.post("/api/parser/run")
def trigger_parser():
    try:
        run_parser()
        leetcode_db = get_leetcode_db()
        return {"status": "success", "count": len(leetcode_db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
