from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Question API Endpoints
@api_router.get("/questions/stats")
async def get_question_stats():
    """Get statistics about the question library"""
    total = await db.questions.count_documents({})
    flashcards = await db.questions.count_documents({"type": "flashcard"})
    mcqs = await db.questions.count_documents({"type": "mcq"})
    
    subarea_stats = {}
    for sa in ["SA-1", "SA-2", "SA-3", "SA-4"]:
        subarea_stats[sa] = {
            "mcqs": await db.questions.count_documents({"subareaId": sa, "type": "mcq"}),
            "flashcards": await db.questions.count_documents({"subareaId": sa, "type": "flashcard"})
        }
    
    return {
        "total": total,
        "flashcards": flashcards,
        "mcqs": mcqs,
        "by_subarea": subarea_stats
    }

@api_router.get("/questions/{question_id}")
async def get_question(question_id: str):
    """Get a single question by ID"""
    question = await db.questions.find_one({"id": question_id}, {"_id": 0})
    if not question:
        return {"error": "Question not found"}
    return question

@api_router.get("/questions")
async def get_all_questions(
    type: str = None,
    subareaId: str = None,
    mode: str = None
):
    """Get all questions with optional filters"""
    query = {}
    if type:
        query["type"] = type
    if subareaId:
        query["subareaId"] = subareaId
    if mode:
        query["mode"] = mode
    
    questions = await db.questions.find(query, {"_id": 0}).to_list(10000)
    return questions

# Writing Lab API Endpoint
class WritingRequest(BaseModel):
    promptId: str
    promptText: str
    userResponse: str

@api_router.post("/grade-writing")
async def grade_writing(request: WritingRequest):
    """Grade a constructed response using OpenAI"""
    try:
        from openai import OpenAI
        
        # Initialize OpenAI client with Emergent LLM key
        api_key = os.getenv("EMERGENT_LLM_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"error": "API key not configured"}
        
        client_openai = OpenAI(api_key=api_key)
        
        system_message = """You are an experienced MTTC English (002) scorer.
Score the response using this rubric, from 1 (weak) to 4 (strong):

1. Focus & Purpose: Does the response address the prompt clearly and stay on topic?
2. Organization & Coherence: Is there a logical structure with clear connections between ideas?
3. Evidence & Analysis: Does the writer explain, analyze, or support points effectively?
4. Language & Conventions: Are grammar, mechanics, and word choice appropriate for a teacher candidate?

Return ONLY a valid JSON object with this shape:
{
  "overall_score": number,
  "focus_purpose": { "score": number, "comment": string },
  "organization": { "score": number, "comment": string },
  "evidence_analysis": { "score": number, "comment": string },
  "language_conventions": { "score": number, "comment": string },
  "next_steps": string
}
Do not include any extra text or explanation."""

        user_message = f"""PROMPT:
{request.promptText}

CANDIDATE RESPONSE:
{request.userResponse}"""

        completion = client_openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # Parse the AI response
        import json
        raw_response = completion.choices[0].message.content
        feedback = json.loads(raw_response)
        
        return feedback
        
    except Exception as e:
        logger.error(f"Error in grade_writing: {str(e)}")
        return {"error": f"Failed to grade response: {str(e)}"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
