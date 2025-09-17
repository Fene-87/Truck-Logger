# ELD Logbook & Trip Planner

A full-stack web app for truck drivers and fleet managers to plan trips, visualize ELD log sheets, and ensure FMCSA HOS compliance.  
Built with Django (backend) and React + Vite + Material UI (frontend).

---

## Features

- Enter trip details (current, pickup, dropoff locations, HOS cycle)
- See route, rest, and fuel stops on an interactive map
- Generate and visualize daily ELD log sheets (HOS-compliant)
- Export log sheets to PDF for reporting or compliance

---

## Prerequisites

- **Python 3.9+**
- **Node.js 18+** and **npm**
- **Git**

---

## 1. Clone the Repository

```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

## Backend Setup

python -m venv venv
# Activate the virtual environment:
# On Windows (Git Bash):
source venv/Scripts/activate
# On Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
# If requirements.txt does not exist, install manually:
pip install django djangorestframework requests

python manage.py migrate
python manage.py runserver

# The backend will run at http://127.0.0.1:8000

## Frontend Setup
cd spotter_assessment/frontend
npm install
npm run dev

# The frontend will run at http://localhost:5173

Usage
Open http://localhost:5173 in your browser.
Enter your trip details and submit.
View your route, stops, and daily ELD log sheets.
Click “Export Log Sheets to PDF” to download your logs.

The app uses free, public APIs (OpenStreetMap, OSRM) for geocoding and routing.

#Project Structure
spotter_assessment/
├── backend/         # Django project settings
├── triplog/         # Django app (API logic)
├── frontend/        # React + Vite frontend
├── manage.py
├── venv/
└── ...
