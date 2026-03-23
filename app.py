import sys
import os

# Ensure the 'backend' directory is in the path so its modules can be found
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import the actual Flask app from backend/app.py
from backend.app import app

if __name__ == "__main__":
    # This block is only used if running locally via `python app.py`
    # Otherwise, Gunicorn uses the 'app' object imported above.
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port)
