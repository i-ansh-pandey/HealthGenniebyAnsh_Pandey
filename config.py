import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///health_app.db')
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MCP Server Configuration
    MCP_SERVER_PORT = int(os.environ.get('MCP_PORT', '8001'))
    MCP_AUTH_TOKEN = os.environ.get('MCP_AUTH_TOKEN', 'health-app-token-2024')
    OWNER_PHONE = os.environ.get('OWNER_PHONE', '919876543210')  # Format: {country_code}{number}
    
    # Health App Settings
    DEFAULT_WATER_GOAL = 2500  # ml
    DEFAULT_STEP_GOAL = 10000
    
    # Social Media
    SHARE_BASE_URL = os.environ.get('SHARE_BASE_URL', 'https://your-app-domain.com')
