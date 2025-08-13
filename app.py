import os
import logging
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from config import Config
import math
import random

# MCP related imports
try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    FastMCP = None

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = os.environ.get("SESSION_SECRET", Config.SECRET_KEY)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    db.init_app(app)

    with app.app_context():
        import models  # noqa: F401
        db.create_all()
        
        from routes import main
        app.register_blueprint(main)

    # -------------------------
    # Health Tools Endpoints
    # -------------------------

    @app.route('/bmi', methods=['POST'])
    def bmi_calculator():
        data = request.json
        weight = data.get('weight')  # in kg
        height = data.get('height')  # in cm
        if not weight or not height:
            return jsonify({"error": "Weight and height are required"}), 400
        bmi = weight / ((height / 100) ** 2)
        category = (
            "Underweight" if bmi < 18.5 else
            "Normal weight" if bmi < 24.9 else
            "Overweight" if bmi < 29.9 else
            "Obese"
        )
        return jsonify({"bmi": round(bmi, 2), "category": category})

    @app.route('/water-intake', methods=['POST'])
    def water_intake():
        data = request.json
        weight = data.get('weight')  # in kg
        if not weight:
            return jsonify({"error": "Weight is required"}), 400
        intake = weight * 35  # ml per kg rule
        return jsonify({"recommended_water_ml": intake})

    @app.route('/steps', methods=['POST'])
    def step_counter():
        data = request.json
        steps = data.get('steps')
        if steps is None:
            return jsonify({"error": "Steps are required"}), 400
        distance_km = steps * 0.0008  # average step length 0.8m
        calories_burned = steps * 0.04
        return jsonify({"steps": steps, "distance_km": round(distance_km, 2), "calories_burned": round(calories_burned, 2)})

    @app.route('/log-metrics', methods=['POST'])
    def log_metrics():
        data = request.json
        logging.info(f"Health metrics logged: {data}")
        return jsonify({"status": "Metrics logged successfully", "data": data})

    @app.route('/health-tips', methods=['GET'])
    def health_tips():
        tips = [
            "Drink plenty of water throughout the day.",
            "Get at least 7-8 hours of sleep.",
            "Exercise for at least 30 minutes daily.",
            "Eat more fruits and vegetables.",
            "Take short breaks when working for long hours."
        ]
        return jsonify({"tip": random.choice(tips)})

    # AI assistant endpoint (MCP-based if installed)
    if FastMCP:
        mcp = FastMCP(name="health-assistant")

        @mcp.tool()
        def ai_assistant(question: str) -> str:
            """AI assistant for answering health-related questions."""
            # You can integrate OpenAI API or other models here
            return f"I am your health assistant. You asked: {question}"

        @app.route('/ai', methods=['POST'])
        def ai_route():
            data = request.json
            question = data.get('question')
            if not question:
                return jsonify({"error": "Question is required"}), 400
            return jsonify({"answer": ai_assistant(question)})

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
