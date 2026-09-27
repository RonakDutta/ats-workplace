FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /code

# CPU wheels for torch keep the image a fraction of the default CUDA build.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch
COPY ./requirements.txt /code/requirements.txt
RUN pip install -r /code/requirements.txt

# Hugging Face Spaces runs containers as a non-root user.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Download the embedding model at build time so a cold start does not wait on it.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Hugging Face Spaces routes traffic to port 7860.
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
