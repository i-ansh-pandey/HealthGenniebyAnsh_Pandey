import os
import logging
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from config import Config

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
        import models
        db.create_all()
        from routes import main
        app.register_blueprint(main)

    # ---------- MCP Endpoint for Puch AI ----------
    @app.route('/mcp', methods=['POST'])
    def mcp_webhook():
        try:
            data = request.json
            command = data.get("command", "").lower()
            response = "Command not recognized."

            # Example WhatsApp Commands
            if "bmi" in command:
                weight = float(data.get("weight", 0))
                height = float(data.get("height", 0)) / 100  # cm to m
                bmi = round(weight / (height ** 2), 2) if height > 0 else 0
                response = f"Your BMI is {bmi}."

            elif "water" in command:
                weight = float(data.get("weight", 0))
                intake = round(weight * 35 / 1000, 2)  # liters/day
                response = f"Recommended water intake: {intake} liters/day."

            elif "steps" in command:
                steps = int(data.get("steps", 0))
                response = f"You have walked {steps} steps today!"

            elif "health tips" in command:
                tips = [
                    "Drink at least 2 liters of water daily.",
                    "Take a 5-minute walk every hour.",
                    "Eat more vegetables and fruits."
                ]
                response = tips[0]  # Just giving first tip for now

            return jsonify({"reply": response}), 200

        except Exception as e:
            logging.error(f"MCP Error: {e}")
            return jsonify({"error": str(e)}), 500

    # ---------- Validation Endpoint for Puch AI ----------
    @app.route('/validate', methods=['GET'])
    def validate():
        return jsonify({"status": "MCP connected", "app": "HealthGennie"}), 200

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
