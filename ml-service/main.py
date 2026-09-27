import logging
from contextlib import asynccontextmanager

import numpy as np
import pymupdf
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer

from skills import SkillExtractor

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ml-service")

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
SUMMARY_MODEL = "gemini-2.5-flash-lite"

# MiniLM reads at most 256 word pieces. Longer text is split into overlapping
# windows of words that fit, so the whole resume is compared rather than only
# its first paragraph.
CHUNK_WORDS = 160
CHUNK_STRIDE = 120

# Raw cosine similarity between a resume and a job description sits in a narrow
# band. These bounds map that band onto 0 to 100.
SIMILARITY_FLOOR = 0.10
SIMILARITY_CEILING = 0.40

MAX_CANDIDATE_SKILLS = 8


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading skill extractor")
    app.state.skills = SkillExtractor()
    log.info("Loading embedding model %s", EMBEDDING_MODEL)
    app.state.embedder = SentenceTransformer(EMBEDDING_MODEL)
    log.info("Models ready")
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_text_from_pdf(data: bytes) -> str:
    try:
        with pymupdf.open(stream=data, filetype="pdf") as doc:
            # sort=True reads blocks top to bottom, left to right.
            return "\n".join(page.get_text("text", sort=True) for page in doc).strip()
    except Exception as error:
        log.warning("PDF extraction failed: %s", error)
        return ""


def chunk_words(text: str) -> list[str]:
    words = text.split()
    if len(words) <= CHUNK_WORDS:
        return [" ".join(words)]
    return [
        " ".join(words[start:start + CHUNK_WORDS])
        for start in range(0, len(words) - CHUNK_WORDS + CHUNK_STRIDE, CHUNK_STRIDE)
    ]


def embed_document(embedder: SentenceTransformer, text: str) -> np.ndarray:
    """One unit vector for a whole document: the mean of its chunk embeddings."""
    vectors = embedder.encode(chunk_words(text), normalize_embeddings=True)
    mean = vectors.mean(axis=0)
    return mean / (np.linalg.norm(mean) or 1.0)


def similarity_score(embedder: SentenceTransformer, a: str, b: str) -> float:
    raw = float(np.dot(embed_document(embedder, a), embed_document(embedder, b)))
    scaled = (raw - SIMILARITY_FLOOR) / (SIMILARITY_CEILING - SIMILARITY_FLOOR)
    return min(1.0, max(0.0, scaled)) * 100


def fallback_summary(score: int, matched: list[str], missing: list[str]) -> str:
    if not matched and not missing:
        return f"Scored {score}% on overall similarity to the job description. No specific required skills were detected in it."
    parts = []
    if matched:
        parts.append(f"Covers {len(matched)} of {len(matched) + len(missing)} required skills, including {', '.join(matched[:3])}.")
    if missing:
        parts.append(f"Missing {', '.join(missing[:3])}{' and others' if len(missing) > 3 else ''}.")
    else:
        parts.append("Every required skill is present.")
    return " ".join(parts)


def write_summary(api_key: str, score: int, required: list[str], matched: list[str], missing: list[str]) -> str | None:
    prompt = (
        "You are an experienced technical recruiter reviewing a resume.\n\n"
        f"Skills the job requires: {', '.join(required) or 'none listed'}\n"
        f"Required skills the candidate has: {', '.join(matched) or 'none'}\n"
        f"Required skills the candidate lacks: {', '.join(missing) or 'none'}\n"
        f"Overall match score: {score}%\n\n"
        "Write exactly two short sentences on whether this candidate is a good fit. "
        "Be direct and name specific skills. Plain text only, no dashes or bullet points."
    )
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=SUMMARY_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=160,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            ),
        )
        text = (response.text or "").strip()
        return text or None
    except Exception as error:
        log.warning("Summary generation failed: %s", error)
        return None


# A plain def runs in FastAPI's threadpool. The work here is CPU bound and the
# Gemini call blocks, so an async def would stall every other request.
@app.post("/api/match")
def calculate_match(
    description: str = Form(...),
    file: UploadFile = File(...),
    api_key: str = Form(...),
    strictness: int = Form(50),
):
    description = description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="The job description is empty.")

    resume_text = extract_text_from_pdf(file.file.read())
    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="No text could be read from this PDF. Scanned image PDFs are not supported.",
        )

    extractor: SkillExtractor = app.state.skills
    required = extractor.extract(description)
    found = extractor.extract(resume_text)
    matched = sorted(required & found)
    missing = sorted(required - found)

    semantic = similarity_score(app.state.embedder, description, resume_text)

    if required:
        keyword = len(matched) / len(required) * 100
        keyword_weight = min(100, max(0, strictness)) / 100
    else:
        # No recognised skills in the description means there is nothing to
        # match against, so the score rests on similarity alone instead of
        # handing every resume a free 100 on the keyword side.
        keyword, keyword_weight = 0.0, 0.0

    score = round(keyword * keyword_weight + semantic * (1 - keyword_weight))
    score = min(100, max(0, score))

    summary = write_summary(api_key, score, sorted(required), matched, missing)

    # Matched skills first, then the rest of what the resume mentions.
    candidate_skills = matched + sorted(found - required)

    return {
        "filename": file.filename,
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "all_candidate_skills": candidate_skills[:MAX_CANDIDATE_SKILLS],
        "ai_summary": summary or fallback_summary(score, matched, missing),
        "breakdown": {
            "keyword_score": round(keyword),
            "semantic_score": round(semantic),
            "keyword_weight": keyword_weight,
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
