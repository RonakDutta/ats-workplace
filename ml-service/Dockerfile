FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential

WORKDIR /code

# Copy and install dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

RUN python -m spacy download en_core_web_sm

# CRITICAL: Hugging Face requires a non-root user to run ML models
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# CRITICAL: Hugging Face forces port 7860
EXPOSE 7860

# Boot up the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
