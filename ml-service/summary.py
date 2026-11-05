from google import genai
from google.genai import types


def ai_summary(api_key, score, required, matched, missing):
    required_text = ", ".join(required) or "none listed"
    matched_text = ", ".join(matched) or "none"
    missing_text = ", ".join(missing) or "none"

    prompt = f"""You are an experienced technical recruiter reviewing a resume.

Skills the job requires: {required_text}
Required skills the candidate has: {matched_text}
Required skills the candidate lacks: {missing_text}
Overall match score: {score}%

Write exactly two short sentences on whether this candidate is a good fit. Be direct and name specific skills. Plain text only, no dashes or bullet points."""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=160,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            ),
        )
        return (response.text or "").strip()
    except Exception as error:
        print("Gemini Error:", error)
        return ""


def basic_summary(score, matched, missing):
    if not matched and not missing:
        return f"Scored {score}% on overall similarity to the job description. No specific required skills were detected in it."

    total = len(matched) + len(missing)
    summary = ""

    if matched:
        summary += f"Covers {len(matched)} of {total} required skills, including {', '.join(matched[:3])}. "

    if missing:
        others = " and others" if len(missing) > 3 else ""
        summary += f"Missing {', '.join(missing[:3])}{others}."
    else:
        summary += "Every required skill is present."

    return summary
