// App.js - Main application JavaScript
class RouteTrackerApp {
    constructor() {
        this.isOnline = navigator.onLine;
        this.installPrompt = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPWA();
        this.initializeComponents();
    }

    setupEventListeners() {
        // Online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));

        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallButton();
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            } else {
                this.handlePageHidden();
            }
        });

        // Form enhancements
        this.enhanceForms();
    }

    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        this.updateUI();
        
        if (isOnline) {
            this.showMessage('You are back online!', 'success');
            this.syncOfflineData();
        } else {
            this.showMessage('You are offline. Some features may be limited.', 'warning');
        }
    }

    updateUI() {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            if (this.isOnline) {
                statusIndicator.classList.remove('offline');
                statusIndicator.classList.add('online');
            } else {
                statusIndicator.classList.remove('online');
                statusIndicator.classList.add('offline');
            }
        }
    }

    handlePageVisible() {
        // Refresh data when page becomes visible
        if (window.TrackingApp && window.TrackingApp.isTracking) {
            window.TrackingApp.resume();
        }
    }

    handlePageHidden() {
        // Handle page being hidden
        if (window.TrackingApp && window.TrackingApp.isTracking) {
            window.TrackingApp.pause();
        }
    }

    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateAvailable();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        // Handle app install
        const installButton = document.getElementById('install-app');
        if (installButton) {
            installButton.addEventListener('click', () => {
                this.installApp();
            });
        }
    }

    showInstallButton() {
        const installButton = document.getElementById('install-app');
        if (installButton) {
            installButton.style.display = 'block';
        }
    }

    installApp() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            this.installPrompt.userChoice.then(result => {
                if (result.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                this.installPrompt = null;
            });
        }
    }

    showUpdateAvailable() {
        const updateButton = document.createElement('button');
        updateButton.className = 'btn btn-primary btn-floating';
        updateButton.innerHTML = '<i class="fas fa-download"></i>';
        updateButton.title = 'Update Available';
        updateButton.onclick = () => {
            window.location.reload();
        };
        document.body.appendChild(updateButton);

        this.showMessage('App update available! Click to refresh.', 'info');
    }

    initializeComponents() {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        // Initialize modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('shown.bs.modal', () => {
                const autofocus = modal.querySelector('[autofocus]');
                if (autofocus) {
                    autofocus.focus();
                }
            });
        });

        // Initialize loading states
        this.setupLoadingStates();
    }

    enhanceForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    this.setButtonLoading(submitButton, true);
                }
            });
        });
    }

    setupLoadingStates() {
        const buttons = document.querySelectorAll('.btn[data-loading]');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.setButtonLoading(button, true);
            });
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        } else {
            button.disabled = false;
            // Restore original text (should be stored in data attribute)
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
        }
    }

    showMessage(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('d-none');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('d-none');
        }
    }

    async syncOfflineData() {
        // Sync any offline data when coming back online
        const offlineData = this.getOfflineData();
        if (offlineData.length > 0) {
            this.showMessage('Syncing offline data...', 'info');
            
            try {
                for (const data of offlineData) {
                    await this.syncDataItem(data);
                }
                this.clearOfflineData();
                this.showMessage('Offline data synced successfully!', 'success');
            } catch (error) {
                console.error('Sync failed:', error);
                this.showMessage('Failed to sync some offline data', 'warning');
            }
        }
    }

    getOfflineData() {
        const data = localStorage.getItem('offline_data');
        return data ? JSON.parse(data) : [];
    }

    saveOfflineData(data) {
        const offlineData = this.getOfflineData();
        offlineData.push(data);
        localStorage.setItem('offline_data', JSON.stringify(offlineData));
    }

    clearOfflineData() {
        localStorage.removeItem('offline_data');
    }

    async syncDataItem(data) {
        // Implement sync logic based on data type
        if (data.type === 'location') {
            return this.syncLocationData(data);
        }
        // Add more sync types as needed
    }

    async syncLocationData(data) {
        const response = await fetch('/api/add_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data.payload)
        });

        if (!response.ok) {
            throw new Error('Failed to sync location data');
        }

        return response.json();
    }

    // Utility methods
    formatDistance(meters) {
        if (meters < 1000) {
            return `${meters.toFixed(0)} m`;
        } else {
            return `${(meters / 1000).toFixed(2)} km`;
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    formatSpeed(kmh) {
        return `${kmh.toFixed(1)} km/h`;
    }

    // Location utilities
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

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
}

// Initialize the app
const app = new RouteTrackerApp();

// Export for global access
window.RouteTrackerApp = app;

// Additional utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export utilities
window.debounce = debounce;
window.throttle = throttle;
