import sys
import os

# Add the backend directory to Python path so absolute imports like 'from app...' work on Vercel
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
