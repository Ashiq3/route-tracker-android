// Tracking.js - Route tracking functionality
class TrackingApp {
    constructor() {
        this.isTracking = false;
        this.isPaused = false;
        this.map = null;
        this.currentRoute = null;
        this.routeLine = null;
        this.currentMarker = null;
        this.watchId = null;
        this.startTime = null;
        this.lastPosition = null;
        this.totalDistance = 0;
        this.routePoints = [];
        this.trackingInterval = null;
        this.updateInterval = null;
        
        // Update frequency (15 seconds as requested)
        this.updateFrequency = 15000;
        
        this.init();
    }

    init() {
        this.setupMap();
        this.setupControls();
        this.checkLocationPermission();
        this.loadActiveRoute();
    }

    setupMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([51.505, -0.09], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add locate control
        this.map.on('locationfound', (e) => {
            this.handleLocationFound(e);
        });

        this.map.on('locationerror', (e) => {
            this.handleLocationError(e);
        });

        // Try to get user's location
        this.locateUser();
    }

    setupControls() {
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const enableLocationBtn = document.getElementById('enable-location');
        const confirmStartBtn = document.getElementById('confirm-start');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.showRouteNameModal());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTracking());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (enableLocationBtn) {
            enableLocationBtn.addEventListener('click', () => this.requestLocationPermission());
        }

        if (confirmStartBtn) {
            confirmStartBtn.addEventListener('click', () => this.startTrackingWithName());
        }
    }

    async checkLocationPermission() {
        if (!navigator.geolocation) {
            this.showMessage('Geolocation is not supported by this browser.', 'error');
            return;
        }

        // Check permission status
        if (navigator.permissions) {
            try {
                const permission = await navigator.permissions.query({name: 'geolocation'});
                if (permission.state === 'denied') {
                    this.showLocationModal();
                }
            } catch (error) {
                console.log('Permission API not supported');
            }
        }
    }

    async requestLocationPermission() {
        try {
            const position = await this.getCurrentPosition();
            this.handleLocationFound({
                latlng: [position.coords.latitude, position.coords.longitude],
                accuracy: position.coords.accuracy
            });
            this.hideLocationModal();
        } catch (error) {
            this.showMessage('Location access denied. Please enable location services.', 'error');
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    locateUser() {
        if (navigator.geolocation) {
            this.map.locate({
                setView: true,
                maxZoom: 16,
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        }
    }

    handleLocationFound(e) {
        const { latlng, accuracy } = e;
        
        // Remove existing marker
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        // Add current location marker
        this.currentMarker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'custom-marker current-location',
                html: '<i class="fas fa-location-arrow"></i>',
                iconSize: [30, 30]
            })
        }).addTo(this.map);

        // Update map view
        this.map.setView(latlng, 16);

        // Update last position
        this.lastPosition = {
            lat: latlng.lat,
            lng: latlng.lng,
            accuracy: accuracy,
            timestamp: new Date()
        };

        // If tracking, add point to route
        if (this.isTracking && !this.isPaused) {
            this.addRoutePoint(latlng.lat, latlng.lng, accuracy);
        }
    }

    handleLocationError(e) {
        console.error('Location error:', e.message);
        this.showMessage('Could not get your location: ' + e.message, 'error');
    }

    showRouteNameModal() {
        const modal = new bootstrap.Modal(document.getElementById('routeNameModal'));
        modal.show();
    }

    hideRouteNameModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('routeNameModal'));
        if (modal) {
            modal.hide();
        }
    }

    showLocationModal() {
        const modal = new bootstrap.Modal(document.getElementById('locationModal'));
        modal.show();
    }

    hideLocationModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('locationModal'));
        if (modal) {
            modal.hide();
        }
    }

    async startTrackingWithName() {
        const routeName = document.getElementById('route-name').value || 
                         `Route ${new Date().toLocaleString()}`;
        const routeDescription = document.getElementById('route-description').value || '';

        try {
            const response = await fetch('/api/start_tracking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: routeName,
                    description: routeDescription
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentRoute = data.route_id;
                this.startTracking();
                this.hideRouteNameModal();
                this.showMessage('Route tracking started!', 'success');
            } else {
                this.showMessage(data.error || 'Failed to start tracking', 'error');
            }
        } catch (error) {
            console.error('Error starting tracking:', error);
            this.showMessage('Failed to start tracking', 'error');
        }
    }

    startTracking() {
        if (!this.currentRoute) {
            this.showMessage('No active route found', 'error');
            return;
        }

        this.isTracking = true;
        this.isPaused = false;
        this.startTime = new Date();
        this.totalDistance = 0;
        this.routePoints = [];

        // Initialize route line
        this.routeLine = L.polyline([], {
            color: '#007bff',
            weight: 4,
            opacity: 0.8
        }).addTo(this.map);

        // Start location tracking
        this.startLocationTracking();

        // Update UI
        this.updateTrackingUI();
        this.updateStatus('tracking', 'Tracking Route...');

        // Start update interval
        this.updateInterval = setInterval(() => {
            this.updateRouteStats();
        }, 1000);
    }

    startLocationTracking() {
        if (!navigator.geolocation) {
            this.showMessage('Geolocation not supported', 'error');
            return;
        }

        // Watch position with high accuracy
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handleLocationFound({
                    latlng: [position.coords.latitude, position.coords.longitude],
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                this.handleLocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );

        // Also use interval-based tracking as fallback
        this.trackingInterval = setInterval(() => {
            this.getCurrentPosition()
                .then(position => {
                    this.handleLocationFound({
                        latlng: [position.coords.latitude, position.coords.longitude],
                        accuracy: position.coords.accuracy
                    });
                })
                .catch(error => {
                    console.error('Tracking interval error:', error);
                });
        }, this.updateFrequency);
    }

    stopLocationTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async stopTracking() {
        if (!this.isTracking) return;

        try {
            const response = await fetch('/api/stop_tracking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data.success) {
                this.isTracking = false;
                this.isPaused = false;
                this.currentRoute = null;
                
                this.stopLocationTracking();
                this.updateTrackingUI();
                this.updateStatus('ready', 'Route Completed!');
                
                this.showMessage('Route tracking stopped and saved!', 'success');
                
                // Reset UI after delay
                setTimeout(() => {
                    this.updateStatus('ready', 'Ready to Track');
                    this.resetRouteStats();
                }, 3000);
            } else {
                this.showMessage(data.error || 'Failed to stop tracking', 'error');
            }
        } catch (error) {
            console.error('Error stopping tracking:', error);
            this.showMessage('Failed to stop tracking', 'error');
        }
    }

    togglePause() {
        if (!this.isTracking) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.updateStatus('paused', 'Tracking Paused');
            this.showMessage('Tracking paused', 'info');
        } else {
            this.updateStatus('tracking', 'Tracking Route...');
            this.showMessage('Tracking resumed', 'success');
        }

        this.updateTrackingUI();
    }

    async addRoutePoint(lat, lng, accuracy) {
        // Add point to local array
        const point = {
            lat: lat,
            lng: lng,
            accuracy: accuracy,
            timestamp: new Date()
        };
        
        this.routePoints.push(point);

        // Update route line
        if (this.routeLine) {
            const latLngs = this.routePoints.map(p => [p.lat, p.lng]);
            this.routeLine.setLatLngs(latLngs);
        }

        // Calculate distance from last point
        if (this.routePoints.length > 1) {
            const lastPoint = this.routePoints[this.routePoints.length - 2];
            const distance = this.calculateDistance(
                lastPoint.lat, lastPoint.lng,
                lat, lng
            );
            this.totalDistance += distance;
        }

        // Send to server
        try {
            const response = await fetch('/api/add_location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: lat,
                    longitude: lng,
                    accuracy: accuracy
                })
            });

            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save location:', data.error);
            }
        } catch (error) {
            console.error('Error saving location:', error);
            // Save to offline storage
            if (window.RouteTrackerApp) {
                window.RouteTrackerApp.saveOfflineData({
                    type: 'location',
                    payload: {
                        latitude: lat,
                        longitude: lng,
                        accuracy: accuracy
                    }
                });
            }
        }
    }

    updateTrackingUI() {
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const routeInfo = document.getElementById('route-info');

        if (this.isTracking) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'inline-block';
            routeInfo.style.display = 'block';

            pauseBtn.innerHTML = this.isPaused ? 
                '<i class="fas fa-play me-2"></i>Resume' : 
                '<i class="fas fa-pause me-2"></i>Pause';
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            routeInfo.style.display = 'none';
        }
    }

    updateStatus(status, text) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');

        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${status}`;
            statusText.textContent = text;
        }
    }

    updateRouteStats() {
        if (!this.isTracking || !this.startTime) return;

        const currentTime = new Date();
        const elapsedTime = (currentTime - this.startTime) / 1000;

        // Update distance
        const distanceElement = document.getElementById('distance-value');
        if (distanceElement) {
            distanceElement.textContent = (this.totalDistance / 1000).toFixed(2);
        }

        // Update time
        const timeElement = document.getElementById('time-value');
        if (timeElement) {
            timeElement.textContent = this.formatTime(elapsedTime);
        }

        // Update speed
        const speedElement = document.getElementById('speed-value');
        if (speedElement) {
            const speed = this.totalDistance > 0 ? 
                (this.totalDistance / 1000) / (elapsedTime / 3600) : 0;
            speedElement.textContent = speed.toFixed(1);
        }
    }

    resetRouteStats() {
        const distanceElement = document.getElementById('distance-value');
        const timeElement = document.getElementById('time-value');
        const speedElement = document.getElementById('speed-value');

        if (distanceElement) distanceElement.textContent = '0.0';
        if (timeElement) timeElement.textContent = '00:00';
        if (speedElement) speedElement.textContent = '0.0';
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    async loadActiveRoute() {
        try {
            const response = await fetch('/api/get_active_route');
            const data = await response.json();

            if (data.active_route) {
                this.currentRoute = data.active_route.id;
                this.resumeActiveRoute(data.active_route);
            }
        } catch (error) {
            console.error('Error loading active route:', error);
        }
    }

    resumeActiveRoute(routeData) {
        if (!routeData) return;

        this.currentRoute = routeData.id;
        this.startTime = new Date(routeData.start_time);
        this.totalDistance = routeData.total_distance * 1000; // Convert to meters
        this.routePoints = routeData.points || [];

        // Restore route line
        if (this.routePoints.length > 0) {
            const latLngs = this.routePoints.map(p => [p.lat, p.lng]);
            this.routeLine = L.polyline(latLngs, {
                color: '#007bff',
                weight: 4,
                opacity: 0.8
            }).addTo(this.map);

            // Fit map to route
            this.map.fitBounds(this.routeLine.getBounds());
        }

        // Resume tracking
        this.isTracking = true;
        this.isPaused = false;
        this.startLocationTracking();
        this.updateTrackingUI();
        this.updateStatus('tracking', 'Tracking Route...');

        // Start update interval
        this.updateInterval = setInterval(() => {
            this.updateRouteStats();
        }, 1000);

        this.showMessage('Resumed active route tracking', 'info');
    }

    // Public methods for external access
    pause() {
        if (this.isTracking && !this.isPaused) {
            this.togglePause();
        }
    }

    resume() {
        if (this.isTracking && this.isPaused) {
            this.togglePause();
        }
    }

    showMessage(message, type = 'info') {
        if (window.RouteTrackerApp) {
            window.RouteTrackerApp.showMessage(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize tracking app
const trackingApp = new TrackingApp();

// Export for global access
window.TrackingApp = trackingApp;
