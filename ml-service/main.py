from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from matcher import read_pdf, similarity_score
from skills import find_skills
from summary import ai_summary, basic_summary

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/match")
def match_resume(
    description: str = Form(...),
    file: UploadFile = File(...),
    api_key: str = Form(...),
    strictness: int = Form(50),
):
    description = description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="The job description is empty.")

    resume_text = read_pdf(file.file.read())
    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="No text could be read from this PDF. Scanned image PDFs are not supported.",
        )

    required_skills = find_skills(description)
    resume_skills = find_skills(resume_text)

    matched = sorted(required_skills & resume_skills)
    missing = sorted(required_skills - resume_skills)
    extra = sorted(resume_skills - required_skills)

    semantic_score = similarity_score(description, resume_text)

    if required_skills:
        keyword_score = len(matched) / len(required_skills) * 100
        keyword_weight = min(100, max(0, strictness)) / 100
    else:
        keyword_score = 0.0
        keyword_weight = 0.0

    score = round(keyword_score * keyword_weight + semantic_score * (1 - keyword_weight))
    score = min(100, max(0, score))

    summary = ai_summary(api_key, score, sorted(required_skills), matched, missing)
    if not summary:
        summary = basic_summary(score, matched, missing)

    return {
        "filename": file.filename,
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "all_candidate_skills": (matched + extra)[:8],
        "ai_summary": summary,
        "breakdown": {
            "keyword_score": round(keyword_score),
            "semantic_score": round(semantic_score),
            "keyword_weight": keyword_weight,
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
