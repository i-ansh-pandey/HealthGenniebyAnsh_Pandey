from flask import Flask, request, jsonify
import math
import random

app = Flask(__name__)

# ------------------ Existing Features ------------------ #

@app.route('/bmi', methods=['POST'])
def bmi():
    data = request.get_json()
    weight = data.get('weight')  # in kg
    height = data.get('height')  # in meters
    if not weight or not height:
        return jsonify({"error": "Please provide weight and height"}), 400
    bmi_value = weight / (height ** 2)
    return jsonify({
        "bmi": round(bmi_value, 2),
        "category": (
            "Underweight" if bmi_value < 18.5 else
            "Normal weight" if bmi_value < 24.9 else
            "Overweight" if bmi_value < 29.9 else
            "Obese"
        )
    })

@app.route('/water-intake', methods=['POST'])
def water_intake():
    data = request.get_json()
    weight = data.get('weight')  # in kg
    if not weight:
        return jsonify({"error": "Please provide weight"}), 400
    water_needed = weight * 35  # ml per kg
    return jsonify({
        "water_intake_ml": water_needed,
        "message": f"Drink at least {water_needed} ml of water daily"
    })

@app.route('/steps', methods=['POST'])
def steps():
    data = request.get_json()
    steps_count = data.get('steps')
    if not steps_count:
        return jsonify({"error": "Please provide steps count"}), 400
    km_walked = steps_count * 0.0008
    return jsonify({
        "steps": steps_count,
        "distance_km": round(km_walked, 2)
    })

@app.route('/health-tips', methods=['GET'])
def health_tips():
    tips = [
        "Drink plenty of water.",
        "Get at least 7-8 hours of sleep.",
        "Eat more fruits and vegetables.",
        "Exercise for at least 30 minutes daily.",
        "Take short breaks during work to stretch."
    ]
    return jsonify({"tip": random.choice(tips)})

@app.route('/log-health', methods=['POST'])
def log_health():
    data = request.get_json()
    return jsonify({"status": "Health data logged", "data": data})

@app.route('/ai-assistant', methods=['POST'])
def ai_assistant():
    data = request.get_json()
    user_query = data.get("query", "")
    return jsonify({"response": f"AI Assistant Response to: {user_query}"})


# ------------------ MCP Integration ------------------ #

@app.route('/validate', methods=['GET'])
def validate():
    return jsonify({"app": "HealthGennie", "status": "MCP connected"})

@app.route('/mcp', methods=['GET', 'POST'])
def mcp():
    if request.method == 'GET':
        return jsonify({"message": "MCP endpoint ready. Send POST requests here."})
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
        
        user_message = data.get("message", "").lower()

        # Simple command routing for WhatsApp/Puch.ai
        if "bmi" in user_message:
            return jsonify({"command": "bmi", "usage": "Send weight(kg) and height(m) in POST to /bmi"})
        elif "water" in user_message:
            return jsonify({"command": "water-intake", "usage": "Send weight(kg) in POST to /water-intake"})
        elif "steps" in user_message:
            return jsonify({"command": "steps", "usage": "Send steps count in POST to /steps"})
        elif "tip" in user_message:
            return jsonify({"command": "health-tips", "tip": random.choice([
                "Drink plenty of water.",
                "Get at least 7-8 hours of sleep.",
                "Eat more fruits and vegetables.",
                "Exercise for at least 30 minutes daily.",
                "Take short breaks during work to stretch."
            ])})
        elif "log" in user_message:
            return jsonify({"command": "log-health", "usage": "Send health data in POST to /log-health"})
        elif "ai" in user_message:
            return jsonify({"command": "ai-assistant", "usage": "Send a query in POST to /ai-assistant"})
        else:
            return jsonify({"message": "Unknown command. Try: bmi, water, steps, tip, log, ai"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
