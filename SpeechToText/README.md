# SpeakEasy Transcriber

A modern, responsive web application for real-time speech-to-text transcription using OpenAI's GPT-4o-transcribe model. Record audio directly in your browser and get instant, accurate text transcriptions.

![SpeakEasy Transcriber](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-teal)

## Features

- 🎤 **Browser-Based Recording**: Record audio directly in your browser using the MediaRecorder API
- 🚀 **Real-Time Transcription**: Get instant transcriptions using OpenAI's advanced speech-to-text model
- 📱 **Fully Responsive**: Beautiful, modern UI that works seamlessly on desktop and mobile devices
- 📋 **Copy & Download**: Easily copy transcriptions to clipboard or download as text files
- 🎨 **Modern Design**: Clean, minimal interface inspired by Apple, Notion, and Whisper.ai
- ⚡ **Fast & Efficient**: Lightweight backend with FastAPI for optimal performance

## Project Structure

```
SpeechToText/
├── app.py              # FastAPI backend server
├── main.py             # Original Python CLI script (preserved)
├── index.html          # Frontend HTML
├── styles.css          # Frontend styles
├── app.js              # Frontend JavaScript
├── requirements.txt    # Python dependencies
├── README.md           # This file
└── .env                # Environment variables (create this)
```

## Prerequisites

- Python 3.8 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Microphone access

## Installation

### 1. Clone or Navigate to the Project

```bash
cd SpeechToText
```

### 2. Create a Virtual Environment (Recommended)

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key. Never commit this file to version control.

## Running the Application

### Step 1: Start the Backend Server

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend will start on `http://localhost:8000`

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 2: Open the Frontend

Simply open `index.html` in your web browser. You can:

- **Double-click** the `index.html` file, or
- **Right-click** → Open with → Your preferred browser, or
- Use a local web server (recommended for production):

**Python:**
```bash
# Python 3
python -m http.server 8080
```

**Node.js (if installed):**
```bash
npx http-server -p 8080
```

Then navigate to `http://localhost:8080` in your browser.

### Step 3: Use the Application

1. **Click "Start Recording"** - Grant microphone permissions when prompted
2. **Speak into your microphone** - The recording indicator will show you're recording
3. **Click "Stop Recording"** - Your audio is now ready for transcription
4. **Click "Transcribe"** - The audio will be sent to OpenAI and transcribed
5. **View your transcription** - Copy or download the result

## API Endpoints

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "message": "SpeakEasy Transcriber API is running"
}
```

### `POST /record`
Transcribe an audio file.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file (WebM, WAV, MP3, etc.)

**Response:**
```json
{
  "transcript": "Your transcribed text here..."
}
```

**Error Responses:**
- `400`: Invalid file type or processing error
- `401`: OpenAI API authentication failed
- `500`: Server error during transcription

## Configuration

### Changing the API Endpoint

If your backend is running on a different URL, edit `app.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url:port';
```

### CORS Configuration

For production deployment, update CORS settings in `app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Deployment

### Backend Deployment

The FastAPI backend can be deployed to:

- **Heroku**: Use the included `Procfile` (create one if needed)
- **Railway**: Connect your GitHub repo
- **DigitalOcean**: Use App Platform
- **AWS**: Deploy to EC2 or use Elastic Beanstalk
- **Google Cloud**: Use Cloud Run
- **Azure**: Use App Service

**Example for Heroku:**

1. Create a `Procfile`:
```
web: uvicorn app:app --host 0.0.0.0 --port $PORT
```

2. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key_here
git push heroku main
```

### Frontend Deployment

The frontend can be deployed to:

- **Netlify**: Drag and drop the `index.html`, `styles.css`, and `app.js` files
- **Vercel**: Connect your repository
- **GitHub Pages**: Push to a `gh-pages` branch
- **Any static hosting**: Upload the three frontend files

**Important**: Update the `API_BASE_URL` in `app.js` to point to your deployed backend URL.

## Troubleshooting

### Microphone Not Working

- **Check browser permissions**: Ensure microphone access is allowed
- **Try a different browser**: Some browsers have better MediaRecorder support
- **Check system settings**: Verify microphone is enabled in your OS settings

### Backend Connection Errors

- **Verify backend is running**: Check `http://localhost:8000` in your browser
- **Check CORS settings**: Ensure CORS is properly configured
- **Verify API endpoint**: Make sure `API_BASE_URL` in `app.js` matches your backend URL

### Transcription Errors

- **Check API key**: Verify your OpenAI API key is correct in `.env`
- **Check API quota**: Ensure you have credits in your OpenAI account
- **Verify audio format**: The backend accepts most audio formats, but WebM is recommended

### Port Already in Use

If port 8000 is already in use:

```bash
# Change the port in app.py
uvicorn.run(app, host="0.0.0.0", port=8001)
```

Or use:
```bash
uvicorn app:app --reload --port 8001
```

## Development

### Running in Development Mode

Backend with auto-reload:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Testing the API

You can test the API endpoint using curl:

```bash
curl -X POST "http://localhost:8000/record" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/audio.wav"
```

## Security Notes

- **Never commit `.env` files** to version control
- **Use environment variables** for API keys in production
- **Restrict CORS origins** in production to your frontend domain only
- **Consider rate limiting** for production deployments
- **Use HTTPS** in production for secure audio transmission

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ⚠️ Opera
- ❌ Internet Explorer (not supported)

## License

This project is open source and available for personal and commercial use.

## Support

For issues, questions, or contributions, please open an issue on the project repository.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [OpenAI](https://openai.com/) GPT-4o-transcribe
- UI inspired by modern design systems (Apple, Notion, Whisper.ai)

---

**Made with ❤️ for seamless speech-to-text transcription**


