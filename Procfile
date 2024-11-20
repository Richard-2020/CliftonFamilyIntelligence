web: uvicorn app:app --host=0.0.0.0 --port=${PORT:-8000}
web: gunicorn app:app
web: source venv/bin/activate && python app.py