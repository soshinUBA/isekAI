# Fonts Follow-up Agent MVP

## Backend

cd backend
python -m venv ..\.venv
..\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000

## Frontend

cd frontend
npm install
npm run dev

## Demo

Open http://localhost:5173/agent and switch U1001-U1004, then Generate draft.
