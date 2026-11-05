# TODO

## ML service

### 1. Switch from FastAPI to Flask

Flask reads almost the same as Express, so the ML service will look like the Node server.

- `request.form["description"]` instead of `description: str = Form(...)`
- `request.files["file"]` instead of `file: UploadFile = File(...)`
- `return jsonify({...}), 400` instead of `raise HTTPException(...)`
- Keep the same URLs (`/api/match`, `/health`) and the same response JSON so the Node server does not change
- Keep the same error messages and send them as `{"detail": "..."}` with status 400
- Check missing form fields by hand (FastAPI did this on its own)
- `requirements.txt`: replace `fastapi`, `uvicorn`, `python-multipart` with `flask`, `gunicorn`
- `Dockerfile`: start with `gunicorn -b 0.0.0.0:7860 main:app`
- Update the resume and README to say Flask instead of FastAPI

### 2. Remove the CORS setup

Only the Node server calls the ML service. The frontend never calls it directly, and CORS only matters for browsers.

- Delete the `CORSMiddleware` block from `main.py`

### 3. Replace spaCy skill matching with plain Python

- Loop over the skill list and look for each word in the text
- Keep the longest match, so "React Native" does not also count as "React"
- Keep the two lists: any case (`SKILLS`) and exact case (`EXACT_CASE_SKILLS`)
- Remove `spacy` from `requirements.txt`
- Before switching, run the old and new versions on many resumes and make sure they find exactly the same skills

## Done when

- The same resume and job description give the same score, skills and summary as before
- The Node server works without any changes
