from datetime import datetime, date
from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, session
from app import db
from models import User, HealthRecord, WaterLog, StepLog, HealthTip
from config import Config
import json

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Main dashboard"""
    return render_template('index.html')

@main.route('/api/user/profile', methods=['GET', 'POST'])
def user_profile():
    """Get or update user profile"""
    if request.method == 'POST':
        data = request.get_json()
        phone_number = session.get('phone_number') or data.get('phone_number')
        
        if not phone_number:
            return jsonify({'error': 'Phone number required'}), 400
        
        user = User.query.filter_by(phone_number=phone_number).first()
        if not user:
            user = User()
            user.phone_number = phone_number
            db.session.add(user)
        
        # Update user profile
        if 'name' in data:
            user.name = data['name']
        if 'age' in data:
            user.age = data['age']
        if 'gender' in data:
            user.gender = data['gender']
        if 'height' in data:
            user.height = float(data['height'])
        if 'weight' in data:
            user.weight = float(data['weight'])
        if 'activity_level' in data:
            user.activity_level = data['activity_level']
        
        db.session.commit()
        session['phone_number'] = phone_number
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'name': user.name,
                'age': user.age,
                'gender': user.gender,
                'height': user.height,
                'weight': user.weight,
                'activity_level': user.activity_level,
                'bmi': user.calculate_bmi(),
                'bmi_category': user.get_bmi_category()
            }
        })
    
    # GET request
    phone_number = session.get('phone_number')
    if not phone_number:
        return jsonify({'error': 'No user session found'}), 404
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'phone_number': user.phone_number,
            'name': user.name,
            'age': user.age,
            'gender': user.gender,
            'height': user.height,
            'weight': user.weight,
            'activity_level': user.activity_level,
            'bmi': user.calculate_bmi(),
            'bmi_category': user.get_bmi_category()
        }
    })

@main.route('/api/bmi/calculate', methods=['POST'])
def calculate_bmi():
    """Calculate BMI"""
    data = request.get_json()
    height = float(data.get('height'))
    weight = float(data.get('weight'))
    
    if not height or not weight:
        return jsonify({'error': 'Height and weight are required'}), 400
    
    height_m = height / 100  # Convert cm to m
    bmi = round(weight / (height_m ** 2), 1)
    
    # Determine category
    if bmi < 18.5:
        category = "Underweight"
        color = "text-info"
    elif 18.5 <= bmi < 25:
        category = "Normal weight"
        color = "text-success"
    elif 25 <= bmi < 30:
        category = "Overweight"
        color = "text-warning"
    else:
        category = "Obese"
        color = "text-danger"
    
    return jsonify({
        'bmi': bmi,
        'category': category,
        'color': color,
        'healthy_range': '18.5 - 24.9'
    })

@main.route('/api/water/log', methods=['POST'])
def log_water():
    """Log water intake"""
    data = request.get_json()
    phone_number = session.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'User session required'}), 401
    
    amount = int(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Valid amount required'}), 400
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    water_log = WaterLog()
    water_log.user_id = user.id
    water_log.amount = amount
    water_log.note = data.get('note', '')
    db.session.add(water_log)
    db.session.commit()
    
    daily_total = user.get_daily_water_intake()
    goal = Config.DEFAULT_WATER_GOAL
    percentage = min(100, (daily_total / goal) * 100)
    
    return jsonify({
        'message': 'Water intake logged successfully',
        'daily_total': daily_total,
        'goal': goal,
        'percentage': round(percentage, 1)
    })

@main.route('/api/water/today', methods=['GET'])
def get_water_today():
    """Get today's water intake"""
    phone_number = session.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'User session required'}), 401
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    daily_total = user.get_daily_water_intake()
    goal = Config.DEFAULT_WATER_GOAL
    percentage = min(100, (daily_total / goal) * 100)
    
    return jsonify({
        'daily_total': daily_total,
        'goal': goal,
        'percentage': round(percentage, 1),
        'remaining': max(0, goal - daily_total)
    })

@main.route('/api/steps/log', methods=['POST'])
def log_steps():
    """Log step count"""
    data = request.get_json()
    phone_number = session.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'User session required'}), 401
    
    steps = int(data.get('steps', 0))
    if steps <= 0:
        return jsonify({'error': 'Valid step count required'}), 400
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    step_log = StepLog()
    step_log.user_id = user.id
    step_log.steps = steps
    step_log.distance_km = data.get('distance_km')
    step_log.calories_burned = data.get('calories')
    db.session.add(step_log)
    db.session.commit()
    
    daily_total = user.get_daily_steps()
    goal = Config.DEFAULT_STEP_GOAL
    percentage = min(100, (daily_total / goal) * 100)
    
    return jsonify({
        'message': 'Steps logged successfully',
        'daily_total': daily_total,
        'goal': goal,
        'percentage': round(percentage, 1)
    })

@main.route('/api/steps/today', methods=['GET'])
def get_steps_today():
    """Get today's step count"""
    phone_number = session.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'User session required'}), 401
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    daily_total = user.get_daily_steps()
    goal = Config.DEFAULT_STEP_GOAL
    percentage = min(100, (daily_total / goal) * 100)
    
    return jsonify({
        'daily_total': daily_total,
        'goal': goal,
        'percentage': round(percentage, 1),
        'remaining': max(0, goal - daily_total)
    })

@main.route('/api/health/summary', methods=['GET'])
def health_summary():
    """Get comprehensive health summary"""
    phone_number = session.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'User session required'}), 401
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get today's data
    water_total = user.get_daily_water_intake()
    steps_total = user.get_daily_steps()
    
    # Get recent health record
    recent_record = HealthRecord.query.filter_by(user_id=user.id).order_by(HealthRecord.record_date.desc()).first()
    
    return jsonify({
        'user': {
            'name': user.name,
            'bmi': user.calculate_bmi(),
            'bmi_category': user.get_bmi_category()
        },
        'today': {
            'water': {
                'total': water_total,
                'goal': Config.DEFAULT_WATER_GOAL,
                'percentage': min(100, (water_total / Config.DEFAULT_WATER_GOAL) * 100)
            },
            'steps': {
                'total': steps_total,
                'goal': Config.DEFAULT_STEP_GOAL,
                'percentage': min(100, (steps_total / Config.DEFAULT_STEP_GOAL) * 100)
            }
        },
        'recent_health': {
            'weight': recent_record.weight if recent_record else None,
            'sleep_hours': recent_record.sleep_hours if recent_record else None,
            'mood_score': recent_record.mood_score if recent_record else None,
            'energy_level': recent_record.energy_level if recent_record else None,
            'date': recent_record.record_date.isoformat() if recent_record else None
        } if recent_record else None
    })

@main.route('/api/tips/generate', methods=['GET'])
def generate_tip():
    """Generate a random health tip"""
    # Get random tip from database or create new one
    tip = HealthTip.query.order_by(db.func.random()).first()
    
    if not tip:
        # Create sample tips if none exist
        sample_tips = [
            {
                'title': 'Stay Hydrated',
                'content': 'Drink at least 8 glasses of water daily to maintain proper hydration and support bodily functions.',
                'category': 'hydration'
            },
            {
                'title': 'Move More',
                'content': 'Aim for at least 30 minutes of moderate exercise daily to improve cardiovascular health.',
                'category': 'fitness'
            },
            {
                'title': 'Quality Sleep',
                'content': 'Get 7-9 hours of quality sleep each night to support physical and mental recovery.',
                'category': 'sleep'
            }
        ]
        
        import random
        tip_data = random.choice(sample_tips)
        tip = HealthTip()
        tip.title = tip_data['title']
        tip.content = tip_data['content']
        tip.category = tip_data['category']
        db.session.add(tip)
        db.session.commit()
    
    return jsonify({
        'tip': {
            'title': tip.title,
            'content': tip.content,
            'category': tip.category
        },
        'share_text': f"💡 {tip.title}\n\n{tip.content}\n\n#HealthTip #Wellness"
    })

@main.route('/api/login', methods=['POST'])
def login():
    """Simple login with phone number"""
    data = request.get_json()
    phone_number = data.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'Phone number required'}), 400
    
    # Create or get user
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        user = User()
        user.phone_number = phone_number
        db.session.add(user)
        db.session.commit()
    
    session['phone_number'] = phone_number
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'phone_number': user.phone_number,
            'name': user.name,
            'has_profile': bool(user.height and user.weight)
        }
    })
