from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import shutil
import re
import uuid
import json

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

resume_text = ""
chat_history = [] 

@app.get("/")
async def health_check():
    return {"status": "alive", "message": "MockMate AI is ready!"}

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    from langchain_groq import ChatGroq
    from langchain_community.document_loaders import PyPDFLoader

    global resume_text, chat_history
    resume_text = ""
    chat_history = [] 
    
    unique_filename = f"resume_{uuid.uuid4()}.pdf"
    ats_feedback = {"score": "N/A", "missing_keywords": [], "summary": "Error analyzing"}
    
    try:
        with open(unique_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        loader = PyPDFLoader(unique_filename)
        docs = loader.load()
        resume_text = " ".join([d.page_content for d in docs[:3]])

        # 🔴 STRICT PROMPT: NO GENERIC EXAMPLES
        llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1) # 0.1 means VERY STRICT
        
        ats_prompt = f"""
        You are an advanced ATS Scanner.
        
        TASK:
        1. Read the RESUME TEXT below carefully.
        2. Determine the specific JOB ROLE (e.g., Python Backend, React Frontend).
        3. Compare the skills in the text against industry standards for THAT specific role.
        4. List 3-5 technical skills that are COMPLETELY MISSING from the text. 
           (Do NOT list skills if they are already present).

        RESUME TEXT:
        {resume_text[:3000]}
        
        OUTPUT (JSON ONLY):
        {{
            "score": "85/100",
            "missing_keywords": ["SpecificMissingSkill1", "SpecificMissingSkill2"],
            "formatting_issues": ["Issue 1"],
            "summary": "Specific summary"
        }}
        """
        ats_response = llm.invoke(ats_prompt)
        
        json_match = re.search(r"\{.*\}", ats_response.content, re.DOTALL)
        if json_match:
            ats_feedback = json.loads(json_match.group(0))
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(unique_filename):
            os.remove(unique_filename)
            
    return {"message": "Resume processed!", "ats_report": ats_feedback}

@app.post("/chat")
async def chat_interview(question: str = Form(...)):
    from langchain_groq import ChatGroq
    global resume_text, chat_history
    
    if not resume_text: return {"response": "Please upload a resume first!"}
    
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
    
    prompt = f"""
    You are a technical interviewer.
    RESUME: {resume_text[:3000]}
    HISTORY: {chat_history[-3:]} 
    USER: {question}
    
    If user says "start", ask a specific technical question based on their projects/skills.
    """
    
    try:
        response = llm.invoke(prompt)
        ai_reply = response.content
        chat_history.append(f"User: {question} | AI: {ai_reply}")
        return {"response": ai_reply}
    except Exception as e:
        return {"response": "Sorry, could you repeat that?"}

@app.get("/generate_report")
async def generate_report():
    from langchain_groq import ChatGroq
    if not chat_history: return {"error": "No history"}
    
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
    prompt = f"""
    Generate report for: {chat_history}
    Output JSON ONLY:
    {{
        "communication": "4/5",
        "technical": "3/5",
        "confidence": "4/5",
        "feedback": "Summary",
        "improvements": ["Point 1", "Point 2"]
    }}
    """
    try:
        response = llm.invoke(prompt)
        json_match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if json_match: return json.loads(json_match.group(0))
    except: pass
    return {}
    
@app.get("/dashboard")
async def get_dashboard(): return []