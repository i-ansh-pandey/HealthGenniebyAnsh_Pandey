from datetime import datetime, date
from app import db
from sqlalchemy import func

class User(db.Model):
    """User model for health tracking"""
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    height = db.Column(db.Float, nullable=True)  # in cm
    weight = db.Column(db.Float, nullable=True)  # in kg
    activity_level = db.Column(db.String(20), default='moderate')  # low, moderate, high
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    health_records = db.relationship('HealthRecord', backref='user', lazy=True, cascade='all, delete-orphan')
    water_logs = db.relationship('WaterLog', backref='user', lazy=True, cascade='all, delete-orphan')
    step_logs = db.relationship('StepLog', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def calculate_bmi(self):
        """Calculate BMI if height and weight are available"""
        if self.height and self.weight:
            height_m = self.height / 100  # convert cm to m
            return round(self.weight / (height_m ** 2), 1)
        return None
    
    def get_bmi_category(self):
        """Get BMI category based on calculated BMI"""
        bmi = self.calculate_bmi()
        if not bmi:
            return "Unknown"
        
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal weight"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"
    
    def get_daily_water_intake(self, target_date=None):
        """Get total water intake for a specific date"""
        if not target_date:
            target_date = date.today()
        
        total = db.session.query(func.sum(WaterLog.amount)).filter(
            WaterLog.user_id == self.id,
            func.date(WaterLog.logged_at) == target_date
        ).scalar()
        
        return total or 0
    
    def get_daily_steps(self, target_date=None):
        """Get total steps for a specific date"""
        if not target_date:
            target_date = date.today()
        
        total = db.session.query(func.sum(StepLog.steps)).filter(
            StepLog.user_id == self.id,
            func.date(StepLog.logged_at) == target_date
        ).scalar()
        
        return total or 0

class HealthRecord(db.Model):
    """Health records for tracking various metrics"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    record_date = db.Column(db.Date, default=date.today)
    weight = db.Column(db.Float, nullable=True)
    blood_pressure_systolic = db.Column(db.Integer, nullable=True)
    blood_pressure_diastolic = db.Column(db.Integer, nullable=True)
    heart_rate = db.Column(db.Integer, nullable=True)
    sleep_hours = db.Column(db.Float, nullable=True)
    mood_score = db.Column(db.Integer, nullable=True)  # 1-10 scale
    energy_level = db.Column(db.Integer, nullable=True)  # 1-10 scale
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WaterLog(db.Model):
    """Water intake tracking"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # in ml
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)
    note = db.Column(db.String(100), nullable=True)

class StepLog(db.Model):
    """Step count tracking"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    steps = db.Column(db.Integer, nullable=False)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)
    calories_burned = db.Column(db.Float, nullable=True)
    distance_km = db.Column(db.Float, nullable=True)

class HealthTip(db.Model):
    """AI-generated health tips"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # fitness, nutrition, wellness, etc.
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_featured = db.Column(db.Boolean, default=False)
    share_count = db.Column(db.Integer, default=0)
