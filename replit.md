# Route Tracker - Live Route Tracking for Travelers

## Overview

Route Tracker is a web-based Progressive Web App (PWA) designed for travelers to track their routes in real-time. The application focuses on live route tracking with map visualization, user authentication, and route management capabilities. Built with Flask backend and vanilla JavaScript frontend, it's designed to be mobile-optimized and eventually deployed as a mobile app.

## System Architecture

The application follows a traditional MVC architecture with the following components:

- **Backend**: Flask web framework with SQLAlchemy ORM
- **Frontend**: HTML templates with Bootstrap, vanilla JavaScript for interactivity
- **Database**: SQLite (development) with migration path to PostgreSQL for production
- **Maps**: Leaflet.js for interactive mapping functionality
- **PWA**: Service Worker and Web App Manifest for mobile app-like experience

## Key Components

### Backend Components

1. **Flask Application (`app.py`)**
   - Main application factory with database and authentication setup
   - Session management and security configuration
   - Database initialization and model imports

2. **Database Models (`models.py`)**
   - User model with Flask-Login integration
   - Route model with JSON-stored route points
   - One-to-many relationship between users and routes

3. **Route Handlers (`routes.py`)**
   - Authentication routes (login, register, logout)
   - Dashboard and route management
   - API endpoints for tracking functionality

### Frontend Components

1. **Progressive Web App Structure**
   - Service Worker (`sw.js`) for offline functionality
   - Web App Manifest (`manifest.json`) for mobile installation
   - Responsive design with Bootstrap 5

2. **JavaScript Applications**
   - Main app controller (`app.js`) for PWA features
   - Tracking functionality (`tracking.js`) for live route recording
   - Real-time location updates with 15-second intervals

3. **Template System**
   - Base template with consistent navigation
   - Authentication pages (login, register)
   - Dashboard and route management interfaces
   - Live tracking interface with map integration

## Data Flow

1. **User Authentication Flow**
   - User registration with username/email/password
   - Session-based authentication using Flask-Login
   - Password hashing with Werkzeug security

2. **Route Tracking Flow**
   - User starts tracking session
   - Browser requests location permission
   - GPS coordinates collected every 15 seconds
   - Route points stored as JSON in database
   - Live map updates with route visualization

3. **Data Persistence**
   - Route points stored as JSON strings in database
   - Route metadata (distance, time, speed) calculated and stored
   - User-specific route history maintained

## External Dependencies

### Backend Dependencies
- Flask (web framework)
- Flask-SQLAlchemy (ORM)
- Flask-Login (authentication)
- Werkzeug (security utilities)

### Frontend Dependencies
- Bootstrap 5 (UI framework)
- Font Awesome (icons)
- Leaflet.js (mapping library)
- OpenStreetMap (map tiles)

### Browser APIs
- Geolocation API (location tracking)
- Service Worker API (PWA functionality)
- Web App Manifest (mobile installation)

## Deployment Strategy

The application is designed for progressive deployment:

1. **Development Phase**: 
   - SQLite database for local development
   - Flask development server
   - File-based static assets

2. **Production Phase**:
   - PostgreSQL database (to be added)
   - Production WSGI server
   - CDN for static assets
   - HTTPS required for geolocation

3. **Mobile App Conversion**:
   - PWA capabilities for mobile installation
   - Offline functionality via Service Worker
   - Future consideration for native app conversion

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Technical Notes

- The application uses SQLAlchemy's DeclarativeBase for modern ORM patterns
- Route points are stored as JSON for flexibility in coordinate data
- Location updates are configured for 15-second intervals to balance accuracy and battery life
- The PWA design allows for offline functionality and mobile app-like experience
- Authentication uses session-based approach suitable for web deployment

## Future Enhancements

Based on the project requirements, planned features include:
- Group tracking functionality for tour guides
- Real-time location sharing within groups
- Push notifications for group updates
- Checklist features for travel preparation
- Cross-platform mobile app deployment