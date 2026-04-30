import sys
import os

# Add the project root to the path so we can import from the backend directory
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from backend.main import app

# Vercel needs the app instance to be exported as 'app'
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
