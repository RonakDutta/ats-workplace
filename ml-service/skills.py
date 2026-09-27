"""Skill catalogue and extraction.

Skills are found with a spaCy PhraseMatcher over a blank English tokenizer.
Nothing here needs a trained pipeline: the old approach ran the full
en_core_web_sm tagger, parser and NER over every resume only to read back the
entity ruler's matches.
"""

import spacy
from spacy.matcher import PhraseMatcher
from spacy.util import filter_spans

# Matched case-insensitively. Keys are what appears in the text, values are the
# canonical name shown to the user.
SKILL_ALIASES = {
    # Frontend
    "react": "React", "react.js": "React", "reactjs": "React",
    "vue": "Vue.js", "vue.js": "Vue.js", "vuejs": "Vue.js",
    "angular": "Angular", "angularjs": "Angular", "angular.js": "Angular",
    "next.js": "Next.js", "nextjs": "Next.js",
    "nuxt": "Nuxt.js", "nuxt.js": "Nuxt.js",
    "svelte": "Svelte", "sveltekit": "SvelteKit",
    "html": "HTML", "html5": "HTML",
    "css": "CSS", "css3": "CSS",
    "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS", "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "sass": "Sass", "scss": "Sass",
    "jquery": "jQuery",
    "webpack": "Webpack", "vite": "Vite",
    "redux": "Redux",

    # Languages
    "js": "JavaScript", "javascript": "JavaScript",
    "ts": "TypeScript", "typescript": "TypeScript",
    "python": "Python", "python3": "Python",
    "cpp": "C++", "c++": "C++", "c/c++": "C++",
    "c#": "C#", "csharp": "C#",
    "java": "Java",
    "kotlin": "Kotlin",
    "golang": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "scala": "Scala",
    "matlab": "MATLAB",
    "perl": "Perl",
    "bash": "Bash", "shell scripting": "Bash",
    "dart": "Dart",

    # Backend and frameworks
    "node.js": "Node.js", "nodejs": "Node.js",
    "express.js": "Express.js", "expressjs": "Express.js",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "spring boot": "Spring Boot", "springboot": "Spring Boot",
    "rails": "Ruby on Rails", "ruby on rails": "Ruby on Rails", "ror": "Ruby on Rails",
    "laravel": "Laravel",
    "dotnet": ".NET", ".net": ".NET", "asp.net": ".NET",
    "nestjs": "NestJS", "nest.js": "NestJS",
    "graphql": "GraphQL",
    "rest api": "REST APIs", "rest apis": "REST APIs", "restful": "REST APIs",
    "grpc": "gRPC",

    # Databases
    "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "mssql": "SQL Server", "sql server": "SQL Server", "microsoft sql server": "SQL Server",
    "oracle db": "Oracle DB", "oracle database": "Oracle DB",
    "mongo": "MongoDB", "mongodb": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "cassandra": "Cassandra", "apache cassandra": "Cassandra",
    "dynamodb": "DynamoDB", "dynamo": "DynamoDB",
    "firebase": "Firebase", "firestore": "Firebase",
    "neo4j": "Neo4j",
    "sql": "SQL",
    "nosql": "NoSQL",

    # Cloud and DevOps
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
    "nginx": "Nginx",
    "linux": "Linux",
    "ci/cd": "CI/CD", "ci cd": "CI/CD",

    # ML and AI
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "artificial intelligence": "Artificial Intelligence",
    "nlp": "NLP", "natural language processing": "NLP",
    "computer vision": "Computer Vision",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch", "torch": "PyTorch",
    "keras": "Keras",
    "sklearn": "Scikit-learn", "scikit-learn": "Scikit-learn", "scikit learn": "Scikit-learn",
    "xgboost": "XGBoost", "xgb": "XGBoost",
    "huggingface": "Hugging Face", "hugging face": "Hugging Face",
    "langchain": "LangChain",
    "openai api": "OpenAI API",
    "llm": "LLMs", "llms": "LLMs", "large language model": "LLMs", "large language models": "LLMs",
    "rag": "RAG",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "scipy": "SciPy",
    "jupyter": "Jupyter",
    "spark": "Apache Spark", "apache spark": "Apache Spark", "pyspark": "Apache Spark",
    "hadoop": "Hadoop",
    "mlflow": "MLflow",
    "dvc": "DVC",

    # Data and analytics
    "powerbi": "Power BI", "power bi": "Power BI",
    "tableau": "Tableau",
    "looker": "Looker",
    "dbt": "dbt",
    "airflow": "Apache Airflow", "apache airflow": "Apache Airflow",
    "kafka": "Apache Kafka", "apache kafka": "Apache Kafka",

    # Tools and practices
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "jira": "Jira",
    "figma": "Figma",
    "dsa": "Data Structures", "data structures": "Data Structures",
    "data structures and algorithms": "Data Structures",
    "oop": "OOP", "object oriented": "OOP", "object-oriented": "OOP",
    "agile": "Agile", "scrum": "Agile",
    "tdd": "TDD", "test driven development": "TDD", "test-driven development": "TDD",
    "microservices": "Microservices",
    "system design": "System Design",
    "jest": "Jest",
    "cypress": "Cypress",
    "playwright": "Playwright",

    # Mobile
    "react native": "React Native",
    "flutter": "Flutter",
    "android": "Android",
    "ios": "iOS",
}

# Matched with exact casing. These spellings are ordinary English words or
# common abbreviations in lower case ("go to market", "the rest", "excel at",
# "at the helm"), so only the capitalised form counts as the skill. Aliases
# that were too ambiguous even with casing ("cv", "cs", "rn", "next", "np")
# are left out.
CASE_SENSITIVE_ALIASES = {
    "Go": "Go",
    "R": "R",
    "C": "C",
    "REST": "REST APIs",
    "Node": "Node.js",
    "Express": "Express.js",
    "Spring": "Spring Boot",
    "Swift": "Swift",
    "Excel": "Excel",
    "Helm": "Helm",
    "Oracle": "Oracle DB",
    "Elastic": "Elasticsearch",
    "AI": "Artificial Intelligence",
    "ML": "Machine Learning",
    "DL": "Deep Learning",
    "TF": "TensorFlow",
    "PySpark": "Apache Spark",
}


class SkillExtractor:
    def __init__(self):
        self.nlp = spacy.blank("en")
        self.canonical = {}

        self.insensitive = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        self.sensitive = PhraseMatcher(self.nlp.vocab, attr="ORTH")

        for matcher, aliases in (
            (self.insensitive, SKILL_ALIASES),
            (self.sensitive, CASE_SENSITIVE_ALIASES),
        ):
            for alias, name in aliases.items():
                key = f"SKILL::{name}"
                self.canonical[self.nlp.vocab.strings.add(key)] = name
                matcher.add(key, [self.nlp.make_doc(alias)])

    def extract(self, text: str) -> set[str]:
        doc = self.nlp.make_doc(text)
        matches = self.insensitive(doc) + self.sensitive(doc)
        spans = [doc[start:end] for _, start, end in matches]
        labels = {(start, end): match_id for match_id, start, end in matches}

        # Longest match wins, so "React Native" is not also read as "React"
        # and "Spring Boot" is not read twice.
        return {
            self.canonical[labels[(span.start, span.end)]]
            for span in filter_spans(spans)
        }
