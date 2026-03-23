import os
import uuid
import random
from typing import List, Dict

# This is a representative seed script. 
# In a real environment, embeddings would be generated via OpenAI API.

DEPARTMENTS = [
    'Commercial & Growth', 'Design & Identity', 'Development & Engineering', 
    'Operations & Portal', 'Analytics & Research', 'Security & Compliance', 
    'Finance & Legal', 'Localization & Accessibility', 'Innovation & R&D'
]

SRI_LANKAN_NAMES = [
    "Kasun Perera", "Niluka Siriwardena", "Amara Jayasuriya", "Tharindu Bandara",
    "Dilina Wijesinghe", "Sanduni Fonseka", "Dushan Ratnayake", "Iromi Gunawardena",
    "Nuwan Kulasekara", "Oshadhee Weerasinghe", "Maleesha De Silva"
]

GLOBAL_TECH_NAMES = [
    "Alex Rivera", "Satoshi Tanaka", "Elena Rossi", "Liam O'Connor",
    "Chloe Zhang", "Marcus Steiner", "Aisha Khan", "Dr. Julian Vance"
]

def generate_personality(dept: str, name: str, role: str) -> str:
    templates = {
        'Security & Compliance': "Extremely cautious and detail-oriented. Skeptical of new technologies until they are audited. Obsessed with data sovereignty in Sri Lanka.",
        'Innovation & R&D': "Highly optimistic and visionary. Early adopter of AI agents and decentralized technologies. Constantly looking for the next paradigm shift.",
        'Development & Engineering': "Pragmatic, focused on performance and scalability. Prefers boring tech that works over hype-driven development.",
        'Design & Identity': "User-centric, aesthetic-focused, but deeply committed to accessibility (A11Y) and cross-platform consistency.",
        'Finance & Legal': "Focused on ROI, runway, and legal compliance. Blunt about server costs and token efficiency."
    }
    base = templates.get(dept, "Professional with internal drive and departmental focus.")
    return f"You are {name}, the {role} at Ardeno OS. {base} Your communication is {random.choice(['concise', 'balanced', 'verbose', 'formal'])}."

def seed():
    agents = []
    for _ in range(50): # Initial batch of 50 varied agents
        dept = random.choice(DEPARTMENTS)
        name = random.choice(SRI_LANKAN_NAMES + GLOBAL_TECH_NAMES)
        role = f"Senior {dept.split(' ')[0]} Strategist"
        
        agent = {
            "id": str(uuid.uuid4()),
            "name": name,
            "department": dept,
            "role": role,
            "personality_prompt_template": generate_personality(dept, name, role),
            "skills": random.sample(["React", "PostgreSQL", "RAG", "LLM Security", "UX Design", "Sri Lankan Market Analysis"], 2)
        }
        agents.append(agent)
    
    print(f"Generated {len(agents)} agents for seeding.")
    # In execution: INSERT INTO agents ...
    return agents

if __name__ == "__main__":
    seed()
