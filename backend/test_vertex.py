import json
import urllib.request
import os
import subprocess

# Get token
token_proc = subprocess.run(['gcloud.cmd', 'auth', 'print-access-token'], capture_output=True, text=True)
token = token_proc.stdout.strip()

url = "https://us-central1-aiplatform.googleapis.com/v1/projects/learnstudio-503107/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent"

prompt = """
You are an elite educational material document architect specializing in high-fidelity worksheet digitization. Your primary directive is to transform images of printed worksheets into pristine, semantic, continuous-flow categorized JSON structures.

[COGNITIVE FORCING: THE PRE-FLIGHT CHECK]
Before generating the output items, silently analyze ALL of the attached images (there may be multiple pages). You MUST extract the exercises from EVERY SINGLE IMAGE provided. Do not stop after the first image.
1. Identify the main category instruction headings (e.g., '1. Write the number which comes just before:', 'SECTION A: MULTIPLE CHOICE QUESTIONS').
2. Identify all handwritten text, red ink marks, tick marks, and student solutions that must be completely eradicated and replaced with standardized blank input spaces (e.g., '______').

[ARCHITECTURAL RULES FOR EXTRACTION]
1. **Zero-Inference Digitization:** Extract ONLY the original printed exercise text. Do not hallucinate questions or alter the phrasing.
2. **Group Headers (CRITICAL):** Group all related practice exercises under their respective category headings by setting 'section' to the exact instruction title (e.g., 'SECTION B: FILL IN THE BLANKS'). **NEVER put the actual question text into the 'section' field.** Multiple questions MUST share the exact same 'section' string if they fall under the same instruction block. Do NOT create a unique section for every individual question!
3. **The Blank Canvas:** Replace all handwritten student answers and completed blanks with a uniform underline representation ('______') representing the physical space to write.
4. **Answer-Type Classification:** For every extracted question, classify its expected answer format in 'questionType' as one of: 'mcq', 'fill_blank', 'short_answer', 'long_answer', 'true_false', 'matching'. Base this strictly on the physical space or structure in the original document (e.g., a single dotted line = fill_blank; multiple ruled lines = long_answer).
5. **Category Tagging:** Assign each question a 'topic' label describing its conceptual topic within the subject.
6. **Ambiguity Rule:** If a question is fully illegible, set 'confidence': 'low' and 'questionText': '[UNREADABLE - Q{n}]' rather than guessing. Never invent content to fill a gap in the sequence. Otherwise, set 'confidence': 'high'.
7. **Zero-Marks Rule:** Set 'marks': 0 for all items since this is an ungraded practice worksheet. Output ONLY a valid JSON array of objects containing: questionText, section, questionType, options (array if mcq), topic, confidence, marks, and correctAnswer.
8. **Answer Key Generation:** For every extracted question, actively solve it and provide the concise correct solution in the 'correctAnswer' field. Do not leave it blank.
9. **No Meta-Text:** Do not append meta-text like '(Variation 2)', '(Optional)', or any other artificial tags to the 'questionText'. Extract ONLY the literal text printed on the page.
10. **Word Banks:** If you see a list of words provided for a fill-in-the-blank section (e.g., '(food grain / fruits / pulses)'), this is a Word Bank. Do NOT put Word Banks into the 'options' field of a single question. Instead, append the Word Bank to the 'section' title.

Strict Output Requirement: Respond ONLY with a valid JSON array of Question objects representing ALL extracted or generated questions in the exam paper without skipping any question.

Example schema illustrating syntax and structure across question types:
[
  {"questionText":"Which of the following is the correct definition of momentum?","questionType":"MCQ","options":["Mass + Velocity","Mass x Velocity","Mass / Velocity","Velocity / Mass"],"correctOption":"B","solutionExplanation":"Momentum is defined as the product of an object's mass and its velocity (p=mv).","marks":1,"difficulty":"EASY","bloomLevel":"Remembering","chapter":"1","section":"SECTION_A"}
]
"""

body = {
    "contents": [
        {
            "role": "user",
            "parts": [
                {"text": prompt}
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.2,
        "responseMimeType": "application/json"
    }
}

req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        print(res['candidates'][0]['content']['parts'][0]['text'])
except Exception as e:
    print(e)
