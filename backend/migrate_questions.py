import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def migrate_questions():
    # Load questions from JSON
    questions_path = Path(__file__).parent.parent / 'frontend' / 'data' / 'questions.json'
    
    with open(questions_path, 'r') as f:
        questions = json.load(f)
    
    # Clear existing questions and drop indexes
    await db.questions.drop()
    
    print(f"Migrating {len(questions)} questions to MongoDB...")
    
    # Insert all questions
    if questions:
        result = await db.questions.insert_many(questions)
        print(f"✅ Successfully migrated {len(result.inserted_ids)} questions!")
    
    # Create indexes for better performance
    try:
        await db.questions.create_index("id", unique=True)
        await db.questions.create_index("subareaId")
        await db.questions.create_index("type")
        await db.questions.create_index("mode")
        print("✅ Created indexes")
    except Exception as e:
        print(f"Index creation: {e}")
    
    # Show statistics
    flashcard_count = await db.questions.count_documents({"type": "flashcard"})
    mcq_count = await db.questions.count_documents({"type": "mcq"})
    
    print(f"\n📊 Migration Complete:")
    print(f"   - Total Questions: {len(questions)}")
    print(f"   - Flashcards: {flashcard_count}")
    print(f"   - MCQs: {mcq_count}")
    
    # Count by subarea
    for sa in ["SA-1", "SA-2", "SA-3", "SA-4"]:
        count = await db.questions.count_documents({"subareaId": sa, "type": "mcq"})
        print(f"   - {sa} MCQs: {count}")

if __name__ == "__main__":
    asyncio.run(migrate_questions())
