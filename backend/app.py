import os
from flask import Flask, send_from_directory, jsonify, request

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

@app.route('/api/validate', methods=['POST'])
def validate_machine():
    """API Contract: Validates a machine against all theoretical rules."""
    # TODO: Implement in Phase 6
    return jsonify({"valid": True, "errors": []})

from backend.serialization.json_serializer import deserialize_machine, serialize_machine
from backend.algorithms.moore_to_mealy import convert_moore_to_mealy
from backend.algorithms.mealy_to_moore import convert_mealy_to_moore

@app.route('/api/convert', methods=['POST'])
def convert_machine():
    """API Contract: Converts a machine and returns the result + animation steps."""
    try:
        data = request.json.get('machine')
        target_type = request.json.get('target_type')
        
        machine = deserialize_machine(data)
        
        if machine.type == 'moore' and target_type == 'mealy':
            converted, steps = convert_moore_to_mealy(machine)
            return jsonify({
                "converted_machine": serialize_machine(converted),
                "steps": steps
            })
        elif machine.type == 'mealy' and target_type == 'moore':
            converted, steps = convert_mealy_to_moore(machine)
            return jsonify({
                "converted_machine": serialize_machine(converted),
                "steps": steps
            })
        else:
            return jsonify({"error": "Invalid conversion requested."}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/simulate', methods=['POST'])
def simulate_string():
    """API Contract: Simulates a string on the machine step-by-step."""
    # TODO: Implement in Phase 6
    return jsonify({"path": [], "output_string": "", "final_state": ""})

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
