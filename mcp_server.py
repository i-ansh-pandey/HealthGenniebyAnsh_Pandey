"""
MCP Server for Puch AI Integration
This server provides health and wellness tools that can be accessed via Puch AI's WhatsApp interface.
The Model Context Protocol (MCP) allows AI models to interact with external tools and data sources.
"""

import asyncio
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from fastmcp import FastMCP
from fastmcp.server.auth.providers.bearer import BearerAuthProvider
from app import create_app, db
from models import User, HealthRecord, WaterLog, StepLog, HealthTip
from config import Config
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create MCP server with authentication
mcp = FastMCP("Health Assistant MCP Server")

# Authentication handled via validate() tool as required by Puch AI

# Initialize Flask app context for database operations
flask_app = create_app()

def get_or_create_user(phone_number: str) -> User:
    """Get existing user or create new one"""
    with flask_app.app_context():
        user = User.query.filter_by(phone_number=phone_number).first()
        if not user:
            user = User()
            user.phone_number = phone_number
            db.session.add(user)
            db.session.commit()
            logger.info(f"Created new user with phone: {phone_number}")
        return user

@mcp.tool()
async def validate() -> str:
    """
    Required validation tool for Puch AI MCP integration.
    Returns the server owner's phone number for authentication.
    Format: {country_code}{number} (e.g., 919876543210 for +91-9876543210)
    """
    return Config.OWNER_PHONE

@mcp.tool()
async def calculate_bmi(phone_number: str, height_cm: float, weight_kg: float) -> str:
    """
    Calculate BMI and provide health recommendations.
    
    Args:
        phone_number: User's phone number for identification
        height_cm: Height in centimeters
        weight_kg: Weight in kilograms
    
    Returns:
        JSON string with BMI calculation and recommendations
    """
    try:
        with flask_app.app_context():
            user = get_or_create_user(phone_number)
            user.height = height_cm
            user.weight = weight_kg
            db.session.commit()
            
            bmi = user.calculate_bmi()
            category = user.get_bmi_category()
            
            # Generate recommendations based on BMI
            recommendations = []
            if category == "Underweight":
                recommendations = [
                    "Consider consulting a healthcare provider about healthy weight gain",
                    "Focus on nutrient-dense foods and strength training",
                    "Ensure adequate protein intake (1.2-1.6g per kg body weight)"
                ]
            elif category == "Normal weight":
                recommendations = [
                    "Maintain your current healthy weight through balanced diet",
                    "Continue regular physical activity (150 min/week moderate exercise)",
                    "Focus on overall wellness and preventive health measures"
                ]
            elif category == "Overweight":
                recommendations = [
                    "Consider gradual weight loss through caloric deficit",
                    "Increase physical activity to 300 min/week moderate exercise",
                    "Focus on whole foods and reduce processed food intake"
                ]
            else:  # Obese
                recommendations = [
                    "Consult healthcare provider for personalized weight management plan",
                    "Consider structured diet and exercise program",
                    "Regular monitoring of blood pressure and blood sugar levels"
                ]
            
            result = {
                "bmi": bmi,
                "category": category,
                "height_cm": height_cm,
                "weight_kg": weight_kg,
                "recommendations": recommendations,
                "healthy_bmi_range": "18.5 - 24.9"
            }
            
            return json.dumps(result, indent=2)
            
    except Exception as e:
        logger.error(f"Error calculating BMI: {str(e)}")
        return json.dumps({"error": f"Failed to calculate BMI: {str(e)}"})

@mcp.tool()
async def log_water_intake(phone_number: str, amount_ml: int, note: str = "") -> str:
    """
    Log water intake for the user.
    
    Args:
        phone_number: User's phone number for identification
        amount_ml: Amount of water in milliliters
        note: Optional note about the water intake
    
    Returns:
        JSON string with updated daily water intake
    """
    try:
        with flask_app.app_context():
            user = get_or_create_user(phone_number)
            
            # Create water log entry
            water_log = WaterLog()
            water_log.user_id = user.id
            water_log.amount = amount_ml
            water_log.note = note
            db.session.add(water_log)
            db.session.commit()
            
            # Get today's total intake
            daily_total = user.get_daily_water_intake()
            goal = Config.DEFAULT_WATER_GOAL
            percentage = min(100, (daily_total / goal) * 100)
            
            result = {
                "logged_amount_ml": amount_ml,
                "daily_total_ml": daily_total,
                "daily_goal_ml": goal,
                "percentage_complete": round(percentage, 1),
                "remaining_ml": max(0, goal - daily_total),
                "status": "Goal reached!" if daily_total >= goal else "Keep drinking!"
            }
            
            return json.dumps(result, indent=2)
            
    except Exception as e:
        logger.error(f"Error logging water intake: {str(e)}")
        return json.dumps({"error": f"Failed to log water intake: {str(e)}"})

@mcp.tool()
async def log_steps(phone_number: str, steps: int, distance_km: float = 0, calories: float = 0) -> str:
    """
    Log step count for the user.
    
    Args:
        phone_number: User's phone number for identification
        steps: Number of steps taken
        distance_km: Distance covered in kilometers (optional)
        calories: Calories burned (optional)
    
    Returns:
        JSON string with updated daily step count
    """
    try:
        with flask_app.app_context():
            user = get_or_create_user(phone_number)
            
            # Create step log entry
            step_log = StepLog()
            step_log.user_id = user.id
            step_log.steps = steps
            step_log.distance_km = distance_km if distance_km > 0 else None
            step_log.calories_burned = calories if calories > 0 else None
            db.session.add(step_log)
            db.session.commit()
            
            # Get today's total steps
            daily_total = user.get_daily_steps()
            goal = Config.DEFAULT_STEP_GOAL
            percentage = min(100, (daily_total / goal) * 100)
            
            result = {
                "logged_steps": steps,
                "daily_total_steps": daily_total,
                "daily_goal_steps": goal,
                "percentage_complete": round(percentage, 1),
                "remaining_steps": max(0, goal - daily_total),
                "status": "Goal achieved!" if daily_total >= goal else "Keep moving!"
            }
            
            return json.dumps(result, indent=2)
            
    except Exception as e:
        logger.error(f"Error logging steps: {str(e)}")
        return json.dumps({"error": f"Failed to log steps: {str(e)}"})

@mcp.tool()
async def get_health_summary(phone_number: str) -> str:
    """
    Get comprehensive health summary for the user.
    
    Args:
        phone_number: User's phone number for identification
    
    Returns:
        JSON string with complete health summary
    """
    try:
        with flask_app.app_context():
            user = get_or_create_user(phone_number)
            
            # Calculate current health metrics
            bmi = user.calculate_bmi()
            bmi_category = user.get_bmi_category()
            daily_water = user.get_daily_water_intake()
            daily_steps = user.get_daily_steps()
            
            # Water intake progress
            water_goal = Config.DEFAULT_WATER_GOAL
            water_percentage = min(100, (daily_water / water_goal) * 100)
            
            # Steps progress
            step_goal = Config.DEFAULT_STEP_GOAL
            step_percentage = min(100, (daily_steps / step_goal) * 100)
            
            # Get recent health record
            recent_record = HealthRecord.query.filter_by(user_id=user.id).order_by(HealthRecord.record_date.desc()).first()
            
            result = {
                "user_info": {
                    "phone_number": phone_number,
                    "name": user.name,
                    "age": user.age,
                    "height_cm": user.height,
                    "weight_kg": user.weight
                },
                "bmi_info": {
                    "bmi": bmi,
                    "category": bmi_category,
                    "is_healthy": bmi_category == "Normal weight" if bmi else False
                },
                "today_progress": {
                    "water_intake": {
                        "current_ml": daily_water,
                        "goal_ml": water_goal,
                        "percentage": round(water_percentage, 1),
                        "status": "Completed" if daily_water >= water_goal else "In Progress"
                    },
                    "steps": {
                        "current_steps": daily_steps,
                        "goal_steps": step_goal,
                        "percentage": round(step_percentage, 1),
                        "status": "Completed" if daily_steps >= step_goal else "In Progress"
                    }
                },
                "latest_health_record": {
                    "date": recent_record.record_date.isoformat() if recent_record else None,
                    "weight_kg": recent_record.weight if recent_record else None,
                    "sleep_hours": recent_record.sleep_hours if recent_record else None,
                    "mood_score": recent_record.mood_score if recent_record else None,
                    "energy_level": recent_record.energy_level if recent_record else None
                } if recent_record else None,
                "summary_date": date.today().isoformat()
            }
            
            return json.dumps(result, indent=2)
            
    except Exception as e:
        logger.error(f"Error getting health summary: {str(e)}")
        return json.dumps({"error": f"Failed to get health summary: {str(e)}"})

@mcp.tool()
async def log_health_metrics(phone_number: str, weight_kg: Optional[float] = None, sleep_hours: Optional[float] = None, 
                            mood_score: Optional[int] = None, energy_level: Optional[int] = None, notes: str = "") -> str:
    """
    Log various health metrics for comprehensive tracking.
    
    Args:
        phone_number: User's phone number for identification
        weight_kg: Current weight in kilograms
        sleep_hours: Hours of sleep (0-24)
        mood_score: Mood score on scale of 1-10 (1=terrible, 10=excellent)
        energy_level: Energy level on scale of 1-10 (1=exhausted, 10=energetic)
        notes: Additional notes about health status
    
    Returns:
        JSON string with logged health metrics
    """
    try:
        with flask_app.app_context():
            user = get_or_create_user(phone_number)
            
            # Update user weight if provided
            if weight_kg:
                user.weight = weight_kg
                db.session.commit()
            
            # Create health record
            health_record = HealthRecord()
            health_record.user_id = user.id
            health_record.weight = weight_kg
            health_record.sleep_hours = sleep_hours
            health_record.mood_score = mood_score
            health_record.energy_level = energy_level
            health_record.notes = notes
            db.session.add(health_record)
            db.session.commit()
            
            result = {
                "logged_metrics": {
                    "weight_kg": weight_kg,
                    "sleep_hours": sleep_hours,
                    "mood_score": mood_score,
                    "energy_level": energy_level,
                    "notes": notes
                },
                "bmi_updated": user.calculate_bmi() if weight_kg else None,
                "record_date": date.today().isoformat(),
                "message": "Health metrics logged successfully!"
            }
            
            return json.dumps(result, indent=2)
            
    except Exception as e:
        logger.error(f"Error logging health metrics: {str(e)}")
        return json.dumps({"error": f"Failed to log health metrics: {str(e)}"})

@mcp.tool()
async def generate_health_tip() -> str:
    """
    Generate a personalized health tip using AI.
    This tool provides wellness advice and tips for healthy living.
    
    Returns:
        JSON string with generated health tip
    """
    try:
        # Pre-defined health tips categories and content
        health_tips = [
            {
                "title": "Stay Hydrated for Better Health",
                "content": "Drinking adequate water helps maintain body temperature, lubricates joints, and supports organ function. Aim for 8-10 glasses (2-2.5 liters) daily, more if you're active or in hot weather.",
                "category": "hydration"
            },
            {
                "title": "The Power of Regular Exercise",
                "content": "Just 30 minutes of moderate exercise daily can reduce risk of heart disease, strengthen bones, improve mental health, and boost energy levels. Find activities you enjoy to make it sustainable.",
                "category": "fitness"
            },
            {
                "title": "Quality Sleep for Optimal Health",
                "content": "Adults need 7-9 hours of quality sleep nightly. Good sleep improves immune function, mental clarity, emotional stability, and physical recovery. Maintain consistent sleep schedules.",
                "category": "sleep"
            },
            {
                "title": "Mindful Eating Habits",
                "content": "Eat slowly, chew thoroughly, and listen to hunger cues. Include colorful vegetables, lean proteins, whole grains, and healthy fats. Limit processed foods and added sugars.",
                "category": "nutrition"
            },
            {
                "title": "Stress Management Techniques",
                "content": "Chronic stress affects physical and mental health. Practice deep breathing, meditation, yoga, or regular physical activity. Take breaks, connect with others, and prioritize self-care.",
                "category": "mental_health"
            },
            {
                "title": "The Importance of Regular Health Checkups",
                "content": "Annual health screenings can detect problems early when they're most treatable. Monitor blood pressure, cholesterol, blood sugar, and maintain up-to-date vaccinations.",
                "category": "prevention"
            }
        ]
        
        import random
        tip = random.choice(health_tips)
        
        with flask_app.app_context():
            # Save tip to database
            health_tip = HealthTip()
            health_tip.title = tip["title"]
            health_tip.content = tip["content"]
            health_tip.category = tip["category"]
            db.session.add(health_tip)
            db.session.commit()
        
        result = {
            "tip": tip,
            "generated_at": datetime.now().isoformat(),
            "share_text": f"💡 Health Tip: {tip['title']}\n\n{tip['content']}\n\n#HealthTip #Wellness",
            "social_share_ready": True
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error generating health tip: {str(e)}")
        return json.dumps({"error": f"Failed to generate health tip: {str(e)}"})

async def main():
    """Start the MCP server"""
    logger.info(f"Starting Health Assistant MCP Server on port {Config.MCP_SERVER_PORT}")
    logger.info(f"Authentication token: {Config.MCP_AUTH_TOKEN}")
    logger.info(f"Owner phone number: {Config.OWNER_PHONE}")
    
    # Start the MCP server
    await mcp.run()

if __name__ == "__main__":
    asyncio.run(main())
