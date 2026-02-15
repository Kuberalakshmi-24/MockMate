from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
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

# 🔑 ENV VARIABLES
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# 🗄️ CONNECT DATABASE
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

# --- GLOBAL MEMORY (Stores Data Temporarily) ---
resume_text = ""
chat_history = []
ats_result = {} # 🆕 Stores ATS Score for Final Report

@app.get("/")
async def health_check():
    return {"status": "alive", "message": "MockMate AI is ready!"}

# --- 1. UPLOAD & CALCULATE ATS SCORE ---
@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    from langchain_groq import ChatGroq
    from langchain_community.document_loaders import PyPDFLoader

    global resume_text, chat_history, ats_result
    resume_text = ""
    chat_history = []
    ats_result = {} # Reset previous result
    
    unique_filename = f"resume_{uuid.uuid4()}.pdf"
    
    # Default Fallback
    ats_feedback = {
        "score": "N/A", 
        "missing_keywords": [], 
        "summary": "Analysis failed or pending."
    }
    
    try:
        with open(unique_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        loader = PyPDFLoader(unique_filename)
        docs = loader.load()
        resume_text = " ".join([d.page_content for d in docs[:3]])

        # 👇 STRICT ATS SCORING
        llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.2)
        ats_prompt = f"""
        You are a strict ATS Scanner.
        RESUME TEXT: {resume_text[:3000]}
        
        TASK:
        1. Identify Job Role.
        2. Calculate Score (0-100) based on keywords & structure.
        3. List 3-5 CRITICAL missing technical skills.
        
        OUTPUT JSON ONLY:
        {{
            "score": "XX/100",
            "missing_keywords": ["Skill1", "Skill2"],
            "formatting_issues": ["Issue1"],
            "summary": "1-line honest feedback"
        }}
        """
        ats_response = llm.invoke(ats_prompt)
        json_match = re.search(r"\{.*\}", ats_response.content, re.DOTALL)
        if json_match:
            ats_feedback = json.loads(json_match.group(0))
            ats_result = ats_feedback # ✅ SAVE FOR FINAL REPORT
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(unique_filename):
            os.remove(unique_filename)
            
    return {"message": "Resume processed!", "ats_report": ats_feedback}

# --- 2. CHAT ---
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
    
    Instructions:
    1. If user says "start", ask a technical question based on resume.
    2. If answering, evaluate answer strictly.
    """
    
    try:
        response = llm.invoke(prompt)
        ai_reply = response.content
        chat_history.append(f"User: {question} | AI: {ai_reply}")

        # Save to DB
        if supabase and question.lower().strip() != "start":
            try:
                supabase.table("interviews").insert({
                    "user_question": question, 
                    "ai_response": ai_reply, 
                    "score": 0 # Simple logging
                }).execute()
            except: pass

        return {"response": ai_reply}
    except Exception as e:
        return {"response": "Sorry, could you repeat that?"}

# --- 3. DASHBOARD ---
@app.get("/dashboard")
async def get_dashboard():
    if not supabase: return []
    try:
        response = supabase.table("interviews").select("*").order("created_at", desc=True).limit(10).execute()
        return response.data
    except: return []

# --- 4. GENERATE FINAL REPORT (UPDATED) 🚀 ---
@app.get("/generate_report")
async def generate_report():
    from langchain_groq import ChatGroq
    global chat_history, ats_result

    # Default Report if no history
    final_report = {
        "communication": "N/A",
        "technical": "N/A",
        "confidence": "N/A",
        "feedback": "No interview history found.",
        "improvements": [],
        "ats_score": ats_result.get("score", "N/A"), # ✅ Include stored ATS Score
        "missing_skills": ats_result.get("missing_keywords", [])
    }

    if not chat_history:
        return final_report
    
    history_text = "\n".join(chat_history)
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.6)
    
    # Analyze Interview Performance
    prompt = f"""
    Analyze this Technical Interview History.
    HISTORY:
    {history_text}
    
    Generate a Performance Report (JSON ONLY):
    {{
        "communication": "Rating/5",
        "technical": "Rating/5",
        "confidence": "Rating/5",
        "feedback": "Summary of candidate's answers.",
        "improvements": ["Improvement 1", "Improvement 2"]
    }}
    """
    
    try:
        response = llm.invoke(prompt)
        json_match = re.search(r"\{.*\}", response.content, re.DOTALL)
        
        if json_match:
            interview_feedback = json.loads(json_match.group(0))
            
            # 🔗 MERGE INTERVIEW FEEDBACK + ATS SCORE
            final_report.update(interview_feedback)
            
    except Exception as e:
        print(f"Report Gen Error: {e}")

    return final_report