from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import shutil
import re
import uuid
import json

# Load env vars
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 KEYS
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# Global Variables (Simple Storage)
resume_text = ""
chat_history = [] 

# --- HEALTH CHECK ---
@app.get("/")
async def health_check():
    return {"status": "alive", "message": "MockMate AI is ready!"}

# --- 1. ATS RESUME SCORER (Lightweight) ---
@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    # 👇 ONLY Necessary Imports
    from langchain_groq import ChatGroq
    from langchain_community.document_loaders import PyPDFLoader

    global resume_text, chat_history
    resume_text = ""
    chat_history = [] 
    
    unique_filename = f"resume_{uuid.uuid4()}.pdf"
    ats_feedback = {"score": "N/A", "missing_keywords": [], "summary": "Error analyzing"}
    
    try:
        # Save File Temporarily
        with open(unique_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract Text
        loader = PyPDFLoader(unique_filename)
        docs = loader.load()
        # Take first 3 pages only to save RAM
        resume_text = " ".join([d.page_content for d in docs[:3]])

        # --- ATS ANALYSIS ---
        llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.5)
        ats_prompt = f"""
        Analyze this resume text for ATS compatibility.
        Resume Text: {resume_text[:3000]}
        
        Output ONLY valid JSON format:
        {{
            "score": "85/100",
            "missing_keywords": ["Python", "Docker", "etc"],
            "formatting_issues": ["Too many columns", "etc"],
            "summary": "One line summary"
        }}
        """
        ats_response = llm.invoke(ats_prompt)
        
        # Clean JSON
        json_match = re.search(r"\{.*\}", ats_response.content, re.DOTALL)
        if json_match:
            ats_feedback = json.loads(json_match.group(0))
        
    except Exception as e:
        print(f"Error: {e}")
        return {"message": "Failed", "ats_report": ats_feedback}
        
    finally:
        if os.path.exists(unique_filename):
            os.remove(unique_filename)
            
    return {"message": "Resume processed!", "ats_report": ats_feedback}

# --- 2. CHAT WITH AI (Direct Context - No Vector DB) ---
@app.post("/chat")
async def chat_interview(question: str = Form(...)):
    from langchain_groq import ChatGroq

    global resume_text, chat_history
    
    if not resume_text: 
        return {"response": "Please upload a resume first!"}
    
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
    
    # Simple Prompt with Direct Resume Context
    prompt = f"""
    You are a technical interviewer.
    RESUME CONTEXT: {resume_text[:3000]}
    
    CHAT HISTORY: {chat_history[-3:]} 
    USER: {question}
    
    Instructions:
    1. If user says "start", ask a technical question based on the resume.
    2. If answering, evaluate answer. Start with "SCORE: X/10".
    3. Keep it conversational.
    """
    
    try:
        response = llm.invoke(prompt)
        ai_reply = response.content
        chat_history.append(f"User: {question} | AI: {ai_reply}")
        return {"response": ai_reply}
    except Exception as e:
        return {"response": "Sorry, I lost my train of thought. Please ask again."}

# --- 3. FINAL REPORT ---
@app.get("/generate_report")
async def generate_report():
    from langchain_groq import ChatGroq

    if not chat_history:
        return {"error": "No interview history found."}
    
    history_text = "\n".join(chat_history)
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
    
    prompt = f"""
    Generate performance report.
    History: {history_text}
    
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
        if json_match:
            return json.loads(json_match.group(0))
    except:
        pass
    return {"communication": "N/A", "technical": "N/A", "confidence": "N/A", "feedback": "Not enough data", "improvements": []}

@app.get("/dashboard")
async def get_dashboard():
    return []