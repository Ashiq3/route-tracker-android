from app import db
from flask_login import UserMixin
from datetime import datetime
import json

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to routes
    routes = db.relationship('Route', backref='user', lazy=True, cascade='all, delete-orphan')

class Route(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Route data
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    total_distance = db.Column(db.Float, default=0.0)  # in kilometers
    total_time = db.Column(db.Integer, default=0)  # in seconds
    average_speed = db.Column(db.Float, default=0.0)  # in km/h
    
    # Store route points as JSON
    route_points = db.Column(db.Text)  # JSON string of coordinates
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_completed = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_route_points(self):
        """Get route points as list of dictionaries"""
        if self.route_points:
            return json.loads(self.route_points)
        return []
    
    def set_route_points(self, points):
        """Set route points from list of dictionaries"""
        self.route_points = json.dumps(points)
    
    def add_route_point(self, lat, lng, timestamp=None):
        """Add a new point to the route"""
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat()
        
        points = self.get_route_points()
        points.append({
            'lat': lat,
            'lng': lng,
            'timestamp': timestamp
        })
        self.set_route_points(points)

class RoutePoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    altitude = db.Column(db.Float)
    accuracy = db.Column(db.Float)
    
    # Relationship
    route = db.relationship('Route', backref='points')
