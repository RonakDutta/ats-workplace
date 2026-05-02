import sys
import spacy
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer, util
import google.generativeai as genai
import os

# ==============================================================================
# STARTUP & LIFESPAN
# ------------------------------------------------------------------------------
# FastAPI lets you define code that runs once when the server boots up, before
# it starts accepting requests. We use this to load our heavy ML models — SpaCy
# and Hugging Face — so they're ready in memory for every request.
#
# Why not just load them at the top of the file? You could, but using lifespan
# gives FastAPI a chance to handle errors cleanly and keeps startup logic in
# one place. The models are stored in app.state so any route can access them.
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --------------------------------------------------------------------------
    # MODEL 1: SpaCy (the keyword/skill extractor)
    # --------------------------------------------------------------------------
    # This is our custom-trained NER model that knows how to find skill
    # entities in text. We also attach an EntityRuler on top of it — think of
    # the ruler as a hard-coded override list that guarantees specific words
    # (like "react", "aws", "k8s") are ALWAYS tagged as SKILL, even if the
    # neural model is uncertain.
    # --------------------------------------------------------------------------
    print("Loading SpaCy NLP model...")
    try:
        nlp = spacy.load("./custom_ats_model")

        # Add the ruler BEFORE the neural NER so our explicit rules take
        # priority. If it already exists (e.g. from a previous hot reload),
        # just grab the existing one instead of adding a duplicate.
        if "entity_ruler" not in nlp.pipe_names:
            ruler = nlp.add_pipe("entity_ruler", before="ner")
        else:
            ruler = nlp.get_pipe("entity_ruler")

        # ------------------------------------------------------------------
        # SKILL ALIAS MAP
        # ------------------------------------------------------------------
        # Resumes are messy. Someone might write "react.js", "ReactJS", or
        # just "react" — they all mean the same thing. This dictionary maps
        # every known variation (lowercased) to one clean canonical name.
        #
        # We do two things with this map:
        #   1. Feed the KEYS into the EntityRuler so SpaCy can find them.
        #   2. Use the VALUES to normalize whatever SpaCy finds into a
        #      consistent label (e.g. always "React", never "reactjs").
        #
        # If you encounter a skill that's being missed, add it here first —
        # that's usually faster than retraining the model.
        # ------------------------------------------------------------------
        SKILL_ALIASES = {
            # ── Frontend ──────────────────────────────────────────────────
            "react": "React", "react.js": "React", "reactjs": "React",
            "vue": "Vue.js", "vue.js": "Vue.js", "vuejs": "Vue.js",
            "angular": "Angular", "angularjs": "Angular", "angular.js": "Angular",
            "next": "Next.js", "next.js": "Next.js", "nextjs": "Next.js",
            "nuxt": "Nuxt.js", "nuxt.js": "Nuxt.js",
            "svelte": "Svelte", "sveltekit": "SvelteKit",
            "html": "HTML", "html5": "HTML",
            "css": "CSS", "css3": "CSS",
            "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS",
            "bootstrap": "Bootstrap",
            "sass": "Sass", "scss": "Sass",
            "jquery": "jQuery",
            "webpack": "Webpack", "vite": "Vite",

            # ── Languages ─────────────────────────────────────────────────
            "js": "JavaScript", "javascript": "JavaScript",
            "ts": "TypeScript", "typescript": "TypeScript",
            "py": "Python", "python": "Python", "python3": "Python",
            "cpp": "C++", "c++": "C++", "c/c++": "C++",
            "c": "C",
            "cs": "C#", "c#": "C#", "csharp": "C#",
            "java": "Java",
            "kotlin": "Kotlin", "kt": "Kotlin",
            "swift": "Swift",
            "go": "Go", "golang": "Go",
            "rs": "Rust", "rust": "Rust",
            "rb": "Ruby", "ruby": "Ruby",
            "php": "PHP",
            "scala": "Scala",
            "r": "R",
            "matlab": "MATLAB",
            "perl": "Perl",
            "bash": "Bash", "shell": "Bash", "sh": "Bash", "shell scripting": "Bash",
            "dart": "Dart",

            # ── Backend / Frameworks ───────────────────────────────────────
            "node": "Node.js", "node.js": "Node.js", "nodejs": "Node.js",
            "express": "Express.js", "express.js": "Express.js", "expressjs": "Express.js",
            "django": "Django",
            "flask": "Flask",
            "fastapi": "FastAPI",
            "spring": "Spring Boot", "spring boot": "Spring Boot", "springboot": "Spring Boot",
            "rails": "Ruby on Rails", "ruby on rails": "Ruby on Rails", "ror": "Ruby on Rails",
            "laravel": "Laravel",
            "dotnet": ".NET", ".net": ".NET", "asp.net": ".NET", "asp": ".NET",
            "nestjs": "NestJS", "nest.js": "NestJS",
            "graphql": "GraphQL",
            "rest": "REST APIs", "rest api": "REST APIs", "restful": "REST APIs",
            "grpc": "gRPC",

            # ── Databases ─────────────────────────────────────────────────
            "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
            "mysql": "MySQL",
            "sqlite": "SQLite",
            "mssql": "SQL Server", "sql server": "SQL Server", "microsoft sql server": "SQL Server",
            "oracle": "Oracle DB", "oracle db": "Oracle DB",
            "mongo": "MongoDB", "mongodb": "MongoDB",
            "redis": "Redis",
            "elastic": "Elasticsearch", "elasticsearch": "Elasticsearch",
            "cassandra": "Cassandra", "apache cassandra": "Cassandra",
            "dynamodb": "DynamoDB", "dynamo": "DynamoDB",
            "firebase": "Firebase", "firestore": "Firebase",
            "neo4j": "Neo4j",
            "sql": "SQL",
            "nosql": "NoSQL",

            # ── Cloud & DevOps ────────────────────────────────────────────
            "aws": "AWS", "amazon web services": "AWS",
            "gcp": "GCP", "google cloud": "GCP", "google cloud platform": "GCP",
            "azure": "Azure", "microsoft azure": "Azure",
            "docker": "Docker",
            "k8s": "Kubernetes", "kubernetes": "Kubernetes",
            "terraform": "Terraform",
            "ansible": "Ansible",
            "jenkins": "Jenkins",
            "github actions": "GitHub Actions", "gh actions": "GitHub Actions",
            "gitlab ci": "GitLab CI/CD", "gitlab ci/cd": "GitLab CI/CD",
            "circleci": "CircleCI",
            "helm": "Helm",
            "nginx": "Nginx",
            "linux": "Linux",
            "ci/cd": "CI/CD", "ci cd": "CI/CD",

            # ── ML / AI ───────────────────────────────────────────────────
            "ml": "Machine Learning", "machine learning": "Machine Learning",
            "dl": "Deep Learning", "deep learning": "Deep Learning",
            "ai": "Artificial Intelligence", "artificial intelligence": "Artificial Intelligence",
            "nlp": "NLP", "natural language processing": "NLP",
            "cv": "Computer Vision", "computer vision": "Computer Vision",
            "tf": "TensorFlow", "tensorflow": "TensorFlow",
            "pytorch": "PyTorch", "torch": "PyTorch",
            "keras": "Keras",
            "sklearn": "Scikit-learn", "scikit-learn": "Scikit-learn", "scikit learn": "Scikit-learn",
            "xgboost": "XGBoost", "xgb": "XGBoost",
            "huggingface": "Hugging Face", "hugging face": "Hugging Face", "hf": "Hugging Face",
            "langchain": "LangChain",
            "openai": "OpenAI API",
            "llm": "LLMs", "large language model": "LLMs", "large language models": "LLMs",
            "rag": "RAG",
            "pandas": "Pandas", "pd": "Pandas",
            "numpy": "NumPy", "np": "NumPy",
            "matplotlib": "Matplotlib",
            "seaborn": "Seaborn",
            "scipy": "SciPy",
            "jupyter": "Jupyter",
            "spark": "Apache Spark", "apache spark": "Apache Spark", "pyspark": "Apache Spark",
            "hadoop": "Hadoop",
            "mlflow": "MLflow",
            "dvc": "DVC",

            # ── Data & Analytics ──────────────────────────────────────────
            "powerbi": "Power BI", "power bi": "Power BI",
            "tableau": "Tableau",
            "excel": "Excel",
            "looker": "Looker",
            "dbt": "dbt",
            "airflow": "Apache Airflow", "apache airflow": "Apache Airflow",
            "kafka": "Apache Kafka", "apache kafka": "Apache Kafka",

            # ── Tools & Practices ─────────────────────────────────────────
            "git": "Git",
            "github": "GitHub",
            "gitlab": "GitLab",
            "jira": "Jira",
            "figma": "Figma",
            "dsa": "Data Structures", "data structures": "Data Structures",
            "data structures and algorithms": "Data Structures",
            "oop": "OOP", "object oriented": "OOP", "object-oriented": "OOP",
            "agile": "Agile", "scrum": "Agile/Scrum",
            "tdd": "TDD", "test driven development": "TDD",
            "microservices": "Microservices",
            "system design": "System Design",

            # ── Mobile ────────────────────────────────────────────────────
            "react native": "React Native", "rn": "React Native",
            "flutter": "Flutter",
            "android": "Android",
            "ios": "iOS",
        }

        # Feed every alias KEY into the ruler as a pattern. SpaCy will then
        # flag any of these strings as a SKILL entity during extraction.
        patterns = [{"label": "SKILL", "pattern": key} for key in SKILL_ALIASES.keys()]
        ruler.add_patterns(patterns)

        # Store both on app.state so the route handler can reach them
        app.state.nlp = nlp
        app.state.skill_aliases = SKILL_ALIASES
        print("✅ SpaCy model ready.")

    except Exception as e:
        print(f"❌ Failed to load SpaCy model: {e}")
        sys.exit(1)

    # --------------------------------------------------------------------------
    # MODEL 2: Sentence Transformers (the semantic similarity engine)
    # --------------------------------------------------------------------------
    # SpaCy is great at finding exact skill keywords, but it has no idea whether
    # a resume "feels" relevant to a job description overall. That's what this
    # model is for — it converts entire text blobs into vectors, and then we
    # measure the cosine similarity between the JD vector and the resume vector.
    #
    # 'all-MiniLM-L6-v2' is a solid lightweight choice: fast to run, and good
    # enough for sentence-level similarity tasks like this one.
    # --------------------------------------------------------------------------
    print("Loading Hugging Face semantic model...")
    try:
        app.state.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Semantic model ready.")
    except Exception as e:
        print(f"❌ Failed to load semantic model: {e}")
        sys.exit(1)

    yield  # Everything above runs on startup; everything below runs on shutdown
    # (Nothing to clean up for now, but this is where you'd close DB connections etc.)


# ==============================================================================
# APP INIT
# ==============================================================================
app = FastAPI(lifespan=lifespan)

# Allow all origins for now — lock this down to your frontend URL before deploying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# HELPERS
# ==============================================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Pull all readable text out of a PDF, preserving a sensible reading order.

    PDFs don't store text linearly — they store it as floating blocks on a
    canvas. The default extraction order can be all over the place, especially
    for multi-column layouts. Sorting blocks by (y, x) gives us a rough
    top-to-bottom, left-to-right order that works well for most resumes.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        full_text = ""

        for page in doc:
            # get_text("blocks") returns a list of tuples:
            # (x0, y0, x1, y1, text, block_no, block_type)
            blocks = page.get_text("blocks")

            # Sort: primary key = vertical position (y0), secondary = horizontal (x0)
            blocks.sort(key=lambda b: (b[1], b[0]))

            for block in blocks:
                full_text += block[4] + "\n"  # index 4 is the actual text string

        return full_text.strip()

    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def get_normalized_skills(text: str, nlp, skill_aliases: dict) -> set[str]:
    """
    Extract skills from text and normalize them to their canonical names.

    We lowercase the input first because all our alias keys are lowercase.
    SpaCy finds the raw matches, then we look each one up in the alias map
    to get the clean name (e.g. "reactjs" → "React").

    If a matched entity isn't in our alias map for some reason (shouldn't
    happen with the ruler, but just in case), we title-case it as a fallback
    rather than dropping it silently.
    """
    doc = nlp(text.lower())
    skills = set()

    for ent in doc.ents:
        if ent.label_ == "SKILL":
            canonical = skill_aliases.get(ent.text, ent.text.title())
            skills.add(canonical)

    return skills


# ==============================================================================
# ROUTE: /api/match
# ==============================================================================

@app.post("/api/match")
async def calculate_match(
    description: str = Form(...),
    file: UploadFile = File(...),
    api_key: str = Form(...),
    strictness: int = Form(50),  # 0 = pure semantic, 100 = pure keyword matching
):
    """
    The main endpoint. Takes a job description + resume PDF and returns a
    match score, skill breakdown, and a short AI-written summary.

    The final score is a weighted blend of two engines:
      - SpaCy keyword score  (hard skill overlap, weighted by `strictness`)
      - Hugging Face score   (semantic similarity, weighted by 1 - `strictness`)

    Gemini then writes a human-readable summary based on what was found.
    """

    # Grab the models that were loaded at startup
    nlp = app.state.nlp
    skill_aliases = app.state.skill_aliases
    semantic_model = app.state.semantic_model

    resume_bytes = await file.read()
    resume_text = extract_text_from_pdf(resume_bytes)

    if not resume_text or not description:
        raise HTTPException(status_code=400, detail="Could not read resume or job description is empty.")

    # --------------------------------------------------------------------------
    # ENGINE 1: SpaCy — hard keyword skill matching
    # --------------------------------------------------------------------------
    # We extract skills from both the JD and the resume, then compare.
    # The score here is simply: what % of the JD's required skills does the
    # candidate actually have?
    # --------------------------------------------------------------------------
    jd_skills = get_normalized_skills(description, nlp, skill_aliases)
    resume_skills = get_normalized_skills(resume_text, nlp, skill_aliases)

    matched_skills = jd_skills & resume_skills   # skills in both
    missing_skills = jd_skills - resume_skills   # skills JD wants but resume lacks

    if jd_skills:
        skill_score = (len(matched_skills) / len(jd_skills)) * 100
    else:
        # If the JD doesn't mention any trackable skills, don't penalize the
        # candidate — just give full marks for this engine.
        skill_score = 100.0

    # --------------------------------------------------------------------------
    # ENGINE 2: Hugging Face — semantic / contextual similarity
    # --------------------------------------------------------------------------
    # Converts both texts into embedding vectors and measures cosine similarity.
    # Raw cosine similarity for text blobs typically falls between 0.10–0.40,
    # so we rescale that range to 0–100 to make it comparable to the skill score.
    #
    # Tweak MIN_RAW_SCORE / MAX_RAW_SCORE if your scores feel too harsh or too
    # generous — these values were calibrated on a sample of real resumes.
    # --------------------------------------------------------------------------
    jd_embedding = semantic_model.encode(description, convert_to_tensor=True)
    resume_embedding = semantic_model.encode(resume_text, convert_to_tensor=True)
    raw_similarity = util.cos_sim(jd_embedding, resume_embedding).item()

    MIN_RAW_SCORE = 0.10
    MAX_RAW_SCORE = 0.40

    if raw_similarity <= MIN_RAW_SCORE:
        context_score = 0.0
    elif raw_similarity >= MAX_RAW_SCORE:
        context_score = 100.0
    else:
        context_score = ((raw_similarity - MIN_RAW_SCORE) / (MAX_RAW_SCORE - MIN_RAW_SCORE)) * 100

    # --------------------------------------------------------------------------
    # BLEND: combine the two scores using the strictness slider
    # --------------------------------------------------------------------------
    # strictness=100 means "only care about exact keywords" (full SpaCy weight)
    # strictness=0   means "only care about overall relevance" (full HF weight)
    # strictness=50  is a balanced split, which is the default
    # --------------------------------------------------------------------------
    keyword_weight = strictness / 100.0
    semantic_weight = 1.0 - keyword_weight

    final_score = round((skill_score * keyword_weight) + (context_score * semantic_weight))
    final_score = max(0, min(100, final_score))  # clamp to [0, 100] just in case

    # --------------------------------------------------------------------------
    # ENGINE 3: Gemini — human-readable summary
    # --------------------------------------------------------------------------
    # We pass Gemini the structured data from the two engines above and ask it
    # to write a concise recruiter-style summary. The goal is just two sentences
    # so the UI stays clean. If the API call fails for any reason, we fall back
    # gracefully rather than failing the whole request.
    #
    # Skills are sorted before being passed in so the prompt is deterministic —
    # sets have random ordering, which makes debugging harder.
    # --------------------------------------------------------------------------
    summary_text = "AI summary unavailable."
    try:
        genai.configure(api_key=api_key)
        gemini = genai.GenerativeModel('gemini-2.5-flash-lite')

        prompt = f"""
        You are an expert technical recruiter reviewing a candidate's resume.

        Job requires: {', '.join(sorted(jd_skills))}
        Candidate has: {', '.join(sorted(matched_skills))}
        Candidate is missing: {', '.join(sorted(missing_skills))}
        Overall match score: {final_score}%

        Write exactly TWO short sentences summarizing whether this candidate is
        a good fit. Be direct and specific — mention actual skill names.
        """

        response = gemini.generate_content(prompt)
        summary_text = response.text.strip()

    except Exception as e:
        # Log it server-side but don't crash the request
        print(f"Gemini API error: {e}")

    # --------------------------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------------------------
    # For all_candidate_skills we sort matched skills first so the most relevant
    # ones always appear at the top — a plain set slice would be random every time.
    # --------------------------------------------------------------------------
    sorted_candidate_skills = sorted(resume_skills, key=lambda s: s not in matched_skills)

    return {
        "filename": file.filename,
        "score": final_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "all_candidate_skills": sorted_candidate_skills[:8],  # top 8 for the UI badges
        "ai_summary": summary_text,
    }


# ==============================================================================
# ENTRY POINT
# ==============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)