import os
from flask import Flask, send_from_directory, jsonify

# Point Flask's static and template folders to the frontend directory
# This allows us to serve the frontend purely from the Flask app without needing Node.js
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

@app.route('/')
def index():
    """Serve the main frontend HTML file."""
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/api/health')
def health_check():
    """Simple API health check endpoint."""
    return jsonify({"status": "ok", "message": "Moore-Mealy Backend is running!"})

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
