import sys
import spacy
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import fitz 
from sentence_transformers import SentenceTransformer, util
import google.generativeai as genai
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading SpaCy NLP model...")
    try:
        nlp = spacy.load("./custom_ats_model")

        if "entity_ruler" not in nlp.pipe_names:
            ruler = nlp.add_pipe("entity_ruler", before="ner")
        else:
            ruler = nlp.get_pipe("entity_ruler")

       
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

        patterns = [{"label": "SKILL", "pattern": key} for key in SKILL_ALIASES.keys()]
        ruler.add_patterns(patterns)

        app.state.nlp = nlp
        app.state.skill_aliases = SKILL_ALIASES
        print("✅ SpaCy model ready.")

    except Exception as e:
        print(f"❌ Failed to load SpaCy model: {e}")
        sys.exit(1)

    print("Loading Hugging Face semantic model...")
    try:
        app.state.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Semantic model ready.")
    except Exception as e:
        print(f"❌ Failed to load semantic model: {e}")
        sys.exit(1)

    yield
  
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)




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
   
            blocks = page.get_text("blocks")

      
            blocks.sort(key=lambda b: (b[1], b[0]))

            for block in blocks:
                full_text += block[4] + "\n"  

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




@app.post("/api/match")
async def calculate_match(
    description: str = Form(...),
    file: UploadFile = File(...),
    api_key: str = Form(...),
    strictness: int = Form(50), 
):
    """
    The main endpoint. Takes a job description + resume PDF and returns a
    match score, skill breakdown, and a short AI-written summary.

    The final score is a weighted blend of two engines:
      - SpaCy keyword score  (hard skill overlap, weighted by `strictness`)
      - Hugging Face score   (semantic similarity, weighted by 1 - `strictness`)

    Gemini then writes a human-readable summary based on what was found.
    """

  
    nlp = app.state.nlp
    skill_aliases = app.state.skill_aliases
    semantic_model = app.state.semantic_model

    resume_bytes = await file.read()
    resume_text = extract_text_from_pdf(resume_bytes)

    if not resume_text or not description:
        raise HTTPException(status_code=400, detail="Could not read resume or job description is empty.")

    # spacy
    jd_skills = get_normalized_skills(description, nlp, skill_aliases)
    resume_skills = get_normalized_skills(resume_text, nlp, skill_aliases)

    matched_skills = jd_skills & resume_skills   # skills in both
    missing_skills = jd_skills - resume_skills   # skills JD wants but resume lacks

    if jd_skills:
        skill_score = (len(matched_skills) / len(jd_skills)) * 100
    else:
        skill_score = 100.0
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
    keyword_weight = strictness / 100.0
    semantic_weight = 1.0 - keyword_weight

    final_score = round((skill_score * keyword_weight) + (context_score * semantic_weight))
    final_score = max(0, min(100, final_score))  # clamp to [0, 100] just in case

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
        print(f"Gemini API error: {e}")

    sorted_candidate_skills = sorted(resume_skills, key=lambda s: s not in matched_skills)

    return {
        "filename": file.filename,
        "score": final_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "all_candidate_skills": sorted_candidate_skills[:8], 
        "ai_summary": summary_text,
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)