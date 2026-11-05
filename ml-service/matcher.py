import numpy as np
import pymupdf
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

CHUNK_SIZE = 160
CHUNK_STEP = 120

LOWEST_SIMILARITY = 0.10
HIGHEST_SIMILARITY = 0.40


def read_pdf(data):
    try:
        with pymupdf.open(stream=data, filetype="pdf") as pdf:
            pages = [page.get_text("text", sort=True) for page in pdf]
        return "\n".join(pages).strip()
    except Exception as error:
        print("PDF Read Error:", error)
        return ""


def split_into_chunks(text):
    words = text.split()

    if len(words) <= CHUNK_SIZE:
        return [" ".join(words)]

    chunks = []
    for start in range(0, len(words) - CHUNK_SIZE + CHUNK_STEP, CHUNK_STEP):
        chunks.append(" ".join(words[start:start + CHUNK_SIZE]))
    return chunks


def embed(text):
    vectors = model.encode(split_into_chunks(text), normalize_embeddings=True)
    average = vectors.mean(axis=0)
    return average / (np.linalg.norm(average) or 1.0)


def similarity_score(job_text, resume_text):
    similarity = float(np.dot(embed(job_text), embed(resume_text)))
    score = (similarity - LOWEST_SIMILARITY) / (HIGHEST_SIMILARITY - LOWEST_SIMILARITY) * 100
    return min(100, max(0, score))
