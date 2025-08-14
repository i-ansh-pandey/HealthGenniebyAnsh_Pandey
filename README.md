Build for Puch AI - Hackathon - by Ansh Pandey
Deployed on Render (Free)
#You Can Try This App - [Click Here](https://healthgenniebyansh-pandey.onrender.com/)

# Overview

A comprehensive health and wellness tracking web application built with Flask that integrates with Puch AI via the Model Context Protocol (MCP). The application enables users to track health metrics like water intake, steps, BMI, and other wellness indicators through both a web interface and WhatsApp integration via Puch AI's conversational interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Web Framework Architecture
- **Flask Application**: Built using the Flask web framework with SQLAlchemy ORM for database operations
- **Blueprint Structure**: Routes are organized using Flask blueprints for modular organization
- **Database Layer**: SQLAlchemy with declarative base model for ORM operations
- **Configuration Management**: Environment-based configuration using a Config class with fallback defaults

## Frontend Architecture
- **Template Engine**: Jinja2 templating with Bootstrap 5 for responsive UI design
- **Progressive Web App**: Includes PWA meta tags and mobile-first responsive design
- **Client-side JavaScript**: Vanilla JavaScript for health tracking functionality, chart visualization using Chart.js
- **CSS Framework**: Bootstrap 5 with custom CSS variables for theming and health-specific styling

## Database Design
- **User Management**: User model with profile information including demographics and health preferences
- **Health Tracking Models**: Separate models for WaterLog, StepLog, and HealthRecord for granular tracking
- **Relationship Mapping**: One-to-many relationships between User and tracking models with cascade delete
- **Database Engine**: Configurable between SQLite (development) and PostgreSQL (production) via environment variables

## MCP Integration Architecture
- **FastMCP Server**: Dedicated MCP server implementation for Puch AI integration
- **Bearer Token Authentication**: Secure authentication for MCP endpoints using configurable tokens
- **Async Operations**: Asynchronous handling of MCP requests for better performance
- **Health Data Exposure**: RESTful endpoints exposed through MCP for AI assistant access

## API Design
- **RESTful Endpoints**: Standard REST API patterns for user profile management and health data operations
- **JSON Communication**: API endpoints accept and return JSON for seamless integration
- **Session Management**: Flask session handling for web interface user authentication
- **Cross-platform Access**: Dual access patterns supporting both web UI and MCP server integration

## Health Tracking Features
- **Multi-metric Tracking**: Support for water intake, step counting, BMI calculation, and general health records
- **Goal Setting**: Configurable daily goals for different health metrics
- **Progress Visualization**: Chart.js integration for data visualization and trend analysis
- **BMI Calculation**: Automatic BMI calculation with health category classification

# External Dependencies

## Core Framework Dependencies
- **Flask**: Web application framework with SQLAlchemy extension for database operations
- **Werkzeug**: WSGI utilities including ProxyFix middleware for deployment

## Database Dependencies
- **SQLAlchemy**: ORM for database operations with support for multiple database backends
- **Database Drivers**: Support for SQLite (built-in) and PostgreSQL via environment configuration

## MCP Integration
- **FastMCP**: Model Context Protocol implementation for Puch AI integration
- **Bearer Authentication**: Token-based authentication system for secure MCP access

## Frontend Dependencies
- **Bootstrap 5**: CSS framework for responsive design and UI components
- **Chart.js**: JavaScript charting library for health data visualization
- **Font Awesome**: Icon library for UI elements

## Production Dependencies
- **Environment Variables**: Configuration management for database URLs, authentication tokens, and deployment settings
- **Logging**: Python logging module for application monitoring and debugging
