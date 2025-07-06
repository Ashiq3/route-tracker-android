#!/usr/bin/env python3
"""
Test script to verify the Route Tracker app works correctly
"""

import os
import sys
import requests
from urllib.parse import urljoin

def test_local_app():
    """Test the app running locally"""
    print("Testing Route Tracker App...")
    
    # Test 1: Check if icons exist
    print("\n1. Checking icons...")
    icon_192 = "static/icons/icon-192.png"
    icon_512 = "static/icons/icon-512.png"
    
    if os.path.exists(icon_192) and os.path.exists(icon_512):
        print("[OK] Icons exist")
    else:
        print("[ERROR] Icons missing")
        return False
    
    # Test 2: Check manifest.json
    print("\n2. Checking manifest.json...")
    manifest_path = "static/manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r') as f:
            content = f.read()
            if '"purpose": "any maskable"' in content:
                print("[OK] Manifest updated for Android")
            else:
                print("[WARNING] Manifest may need Android optimization")
    else:
        print("[ERROR] Manifest not found")
        return False
    
    # Test 3: Check requirements
    print("\n3. Checking requirements.txt...")
    if os.path.exists("requirements.txt"):
        print("[OK] Requirements file exists")
    else:
        print("[ERROR] Requirements file missing")
        return False
    
    # Test 4: Check deployment files
    print("\n4. Checking deployment files...")
    deployment_files = ["build.sh", "Procfile", "render.yaml"]
    for file in deployment_files:
        if os.path.exists(file):
            print(f"[OK] {file} exists")
        else:
            print(f"[WARNING] {file} missing (optional)")
    
    print("\n[OK] Local tests completed!")
    return True

def test_remote_app(url):
    """Test the deployed app"""
    print(f"\nTesting deployed app at {url}...")
    
    try:
        # Test 1: Main page
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print("[OK] Main page loads")
        else:
            print(f"[ERROR] Main page failed: {response.status_code}")
            return False
        
        # Test 2: Manifest
        manifest_url = urljoin(url, "/static/manifest.json")
        response = requests.get(manifest_url, timeout=10)
        if response.status_code == 200:
            print("[OK] Manifest accessible")
        else:
            print(f"[ERROR] Manifest failed: {response.status_code}")
            return False
        
        # Test 3: Icons
        icon_urls = [
            urljoin(url, "/static/icons/icon-192.png"),
            urljoin(url, "/static/icons/icon-512.png")
        ]
        
        for icon_url in icon_urls:
            response = requests.get(icon_url, timeout=10)
            if response.status_code == 200:
                print(f"[OK] Icon accessible: {icon_url.split('/')[-1]}")
            else:
                print(f"[ERROR] Icon failed: {icon_url.split('/')[-1]}")
                return False
        
        print("\n[OK] Remote tests completed!")
        return True
        
    except requests.RequestException as e:
        print(f"[ERROR] Connection error: {e}")
        return False

def main():
    """Main test function"""
    print("Route Tracker Test Suite")
    print("=" * 40)
    
    # Test locally first
    local_success = test_local_app()
    
    if not local_success:
        print("\n[ERROR] Local tests failed. Fix issues before deploying.")
        sys.exit(1)
    
    # Ask for remote URL
    print("\n" + "=" * 40)
    remote_url = input("Enter your deployed app URL (or press Enter to skip): ").strip()
    
    if remote_url:
        if not remote_url.startswith(('http://', 'https://')):
            remote_url = 'https://' + remote_url
        
        remote_success = test_remote_app(remote_url)
        
        if remote_success:
            print(f"\n[SUCCESS] All tests passed! Your app is ready for TWA conversion.")
            print(f"[INFO] Use this URL for Bubblewrap: {remote_url}")
        else:
            print(f"\n[ERROR] Remote tests failed. Check your deployment.")
    else:
        print("\n[SUCCESS] Local tests passed! Deploy to Render and test again.")

if __name__ == '__main__':
    main()
