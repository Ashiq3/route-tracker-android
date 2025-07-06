#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Route Tracker Server Launcher
"""
import os
import sys
import webbrowser
import threading
import time
from app import app

def open_browser():
    """Open browser after a short delay"""
    time.sleep(2)
    webbrowser.open('http://localhost:5000')

def main():
    print("=" * 50)
    print("ROUTE TRACKER SERVER")
    print("=" * 50)
    print()
    print("Server starting...")
    print("URL: http://localhost:5000")
    print("Mobile: Install as PWA for best experience")
    print()
    print("Demo Login:")
    print("Username: demo_user")
    print("Password: demo123")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Open browser in a separate thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        # Start the Flask app
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
        print("Thanks for using Route Tracker!")
    except Exception as e:
        print(f"\nError starting server: {e}")
        print("Make sure port 5000 is available")

if __name__ == '__main__':
    main()
