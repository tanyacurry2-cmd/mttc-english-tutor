from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Question/MCQ Model
class MCQQuestion(BaseModel):
    id: str
    subarea: str
    subareaId: str
    objective: str
    stem: str
    options: List[str]
    correctIndex: int
    answer: str  # The correct answer text
    rationales: List[str]
    difficulty: int
    mode: str = "Drill"
    type: str = "mcq"
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# Flashcard Model
class Flashcard(BaseModel):
    id: str
    subarea: str
    subareaId: str
    objective: str
    question: str
    answer: str
    explanation: str
    difficulty: int
    tags: List[str]
    mode: str = "Learn"
    type: str = "flashcard"
    options: List[str] = []
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

# Unified Question Model (for frontend consumption)
class Question(BaseModel):
    id: str
    subarea: str
    subareaId: str
    objective: str
    mode: str
    type: str
    difficulty: int
    # MCQ fields
    stem: Optional[str] = None
    question: Optional[str] = None
    options: Optional[List[str]] = None
    correctIndex: Optional[int] = None
    answer: Optional[str] = None
    rationales: Optional[List[str]] = None
    # Flashcard fields
    explanation: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
