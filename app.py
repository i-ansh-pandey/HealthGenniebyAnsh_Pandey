from flask import Flask, request, jsonify
import random

app = Flask(__name__)

# Root route
@app.route('/')
def home():
    return {
        "app": "HealthGennie",
        "status": "running",
        "message": "Welcome! HealthGennie API root endpoint."
    }

# MCP validation endpoint for Puch AI
@app.route('/validate', methods=['GET'])
def validate():
    return jsonify({"app": "HealthGennie", "status": "MCP connected"})

# MCP POST endpoint for WhatsApp commands
@app.route('/mcp', methods=['POST'])
def mcp():
    data = request.json
    command = data.get("command", "").lower()

    if "bmi" in command:
        try:
            height = float(data.get("height"))
            weight = float(data.get("weight"))
            bmi = round(weight / ((height / 100) ** 2), 2)
            return jsonify({"result": f"Your BMI is {bmi}"})
        except:
            return jsonify({"error": "Please provide height (cm) and weight (kg)."}), 400

    elif "water" in command:
        try:
            weight = float(data.get("weight"))
            water_intake = round(weight * 0.033, 2)
            return jsonify({"result": f"You should drink about {water_intake} liters of water daily."})
        except:
            return jsonify({"error": "Please provide weight in kg."}), 400

    elif "steps" in command:
        steps = random.randint(5000, 15000)
        return jsonify({"result": f"You have walked {steps} steps today!"})

    elif "health tips" in command:
        tips = [
            "Drink at least 8 glasses of water daily.",
            "Take short breaks during work to stretch.",
            "Sleep for 7-8 hours every night.",
            "Include fruits and vegetables in your diet.",
            "Exercise at least 30 minutes daily."
        ]
        return jsonify({"result": random.choice(tips)})

    elif "log health" in command:
        return jsonify({"result": "Health metrics logged successfully!"})

    elif "ai assistant" in command:
        query = data.get("query", "How can I help you?")
        return jsonify({"result": f"AI Assistant Response: {query}"})

    else:
        return jsonify({"error": "Unknown command"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
