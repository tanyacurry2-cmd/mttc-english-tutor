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
    answer: str
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
