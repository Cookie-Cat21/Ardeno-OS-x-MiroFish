import sys
import os

# Ensure the backend directory is in the path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

# Vercel needs the app instance named 'app'
app = create_app()

# This is the entry point for Vercel
if __name__ == "__main__":
    app.run()
