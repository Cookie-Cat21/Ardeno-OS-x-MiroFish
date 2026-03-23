"""
Vercel Serverless Entry Point for MiroFish Backend
This file sits at the root /api/ directory so Vercel can discover it as a serverless function.
"""
import sys
import os

# Add the MiroFish backend to the Python path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'services', 'mirofish', 'backend')
sys.path.insert(0, backend_path)

from app import create_app

app = create_app()
