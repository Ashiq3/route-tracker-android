from flask import render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db
from models import User, Route, RoutePoint
from datetime import datetime
import json
import math

@app.route('/')
def index():
    """Home page"""
    return redirect(url_for('track'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if user exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists')
            return render_template('register.html')
        
        # Create new user
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful!')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    """User dashboard"""
    # For demo purposes, use user_id = 1 or create a demo user
    demo_user_id = 1
    recent_routes = Route.query.filter_by(user_id=demo_user_id).order_by(Route.created_at.desc()).limit(5).all()
    active_route = Route.query.filter_by(user_id=demo_user_id, is_active=True, is_completed=False).first()
    
    return render_template('dashboard.html', 
                         recent_routes=recent_routes, 
                         active_route=active_route)

@app.route('/track')
def track():
    """Route tracking page"""
    demo_user_id = 1
    active_route = Route.query.filter_by(user_id=demo_user_id, is_active=True, is_completed=False).first()
    return render_template('track.html', active_route=active_route)

@app.route('/routes')
def routes():
    """View all user routes"""
    demo_user_id = 1
    user_routes = Route.query.filter_by(user_id=demo_user_id).order_by(Route.created_at.desc()).all()
    return render_template('routes.html', routes=user_routes)

@app.route('/api/start_tracking', methods=['POST'])
def start_tracking():
    """Start a new route tracking session"""
    data = request.get_json()
    demo_user_id = 1
    
    # Check if user has an active route
    active_route = Route.query.filter_by(user_id=demo_user_id, is_active=True, is_completed=False).first()
    if active_route:
        return jsonify({'error': 'You already have an active route'}), 400
    
    # Create new route
    route = Route(
        user_id=demo_user_id,
        name=data.get('name', f'Route {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
        description=data.get('description', ''),
        start_time=datetime.utcnow(),
        is_active=True,
        is_completed=False
    )
    
    db.session.add(route)
    db.session.commit()
    
    return jsonify({'success': True, 'route_id': route.id})

@app.route('/api/stop_tracking', methods=['POST'])
def stop_tracking():
    """Stop the current route tracking session"""
    demo_user_id = 1
    active_route = Route.query.filter_by(user_id=demo_user_id, is_active=True, is_completed=False).first()
    
    if not active_route:
        return jsonify({'error': 'No active route found'}), 400
    
    # Update route
    active_route.end_time = datetime.utcnow()
    active_route.is_completed = True
    active_route.is_active = False
    
    # Calculate total time
    if active_route.start_time and active_route.end_time:
        total_time = (active_route.end_time - active_route.start_time).total_seconds()
        active_route.total_time = int(total_time)
        
        # Calculate average speed
        if active_route.total_distance > 0 and total_time > 0:
            active_route.average_speed = (active_route.total_distance / (total_time / 3600))
    
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/add_location', methods=['POST'])
def add_location():
    """Add a new location point to the active route"""
    data = request.get_json()
    demo_user_id = 1
    
    active_route = Route.query.filter_by(user_id=demo_user_id, is_active=True, is_completed=False).first()
    
    if not active_route:
        return jsonify({'error': 'No active route found'}), 400
    
    lat = data.get('latitude')
    lng = data.get('longitude')
    accuracy = data.get('accuracy')
    
    if not lat or not lng:
        return jsonify({'error': 'Invalid coordinates'}), 400
    
    # Add route point
    route_point = RoutePoint(
        route_id=active_route.id,
        latitude=lat,
        longitude=lng,
        accuracy=accuracy,
        timestamp=datetime.utcnow()
    )
    
    db.session.add(route_point)
    
    # Update route distance
    points = RoutePoint.query.filter_by(route_id=active_route.id).order_by(RoutePoint.timestamp).all()
    if len(points) > 1:
        # Calculate distance from last point
        last_point = points[-2]
        distance = calculate_distance(last_point.latitude, last_point.longitude, lat, lng)
        active_route.total_distance += distance
    
    db.session.commit()
    
    return jsonify({'success': True, 'total_distance': active_route.total_distance})

@app.route('/api/get_route_data/<int:route_id>')
def get_route_data(route_id):
    """Get route data for displaying on map"""
    demo_user_id = 1
    route = Route.query.filter_by(id=route_id, user_id=demo_user_id).first()
    
    if not route:
        return jsonify({'error': 'Route not found'}), 404
    
    points = RoutePoint.query.filter_by(route_id=route_id).order_by(RoutePoint.timestamp).all()
    
    route_data = {
        'id': route.id,
        'name': route.name,
        'description': route.description,
        'start_time': route.start_time.isoformat() if route.start_time else None,
        'end_time': route.end_time.isoformat() if route.end_time else None,
        'total_distance': route.total_distance,
        'total_time': route.total_time,
        'average_speed': route.average_speed,
        'is_active': route.is_active,
        'is_completed': route.is_completed,
        'points': [
            {
                'lat': point.latitude,
                'lng': point.longitude,
                'timestamp': point.timestamp.isoformat(),
                'accuracy': point.accuracy
            }
            for point in points
        ]
    }
    
    return jsonify(route_data)

@app.route('/api/get_active_route')
def get_active_route():
    """Get the current active route"""
    demo_user_id = 1
    active_route = Route.query.filter_by(user_id=demo_user_id, is_active=True, is_completed=False).first()
    
    if not active_route:
        return jsonify({'active_route': None})
    
    points = RoutePoint.query.filter_by(route_id=active_route.id).order_by(RoutePoint.timestamp).all()
    
    route_data = {
        'id': active_route.id,
        'name': active_route.name,
        'description': active_route.description,
        'start_time': active_route.start_time.isoformat(),
        'total_distance': active_route.total_distance,
        'total_time': (datetime.utcnow() - active_route.start_time).total_seconds(),
        'points': [
            {
                'lat': point.latitude,
                'lng': point.longitude,
                'timestamp': point.timestamp.isoformat(),
                'accuracy': point.accuracy
            }
            for point in points
        ]
    }
    
    return jsonify({'active_route': route_data})

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c
