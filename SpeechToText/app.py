"""
FastAPI backend for SpeakEasy Transcriber
Handles audio file uploads and transcription using OpenAI's gpt-4o-transcribe model
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from dotenv import load_dotenv
import os
import tempfile
import uvicorn

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize FastAPI app
app = FastAPI(title="SpeakEasy Transcriber API")

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "SpeakEasy Transcriber API is running"}


@app.post("/record")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file (WebM, WAV, or other formats) and returns transcription.
    
    Args:
        file: Audio file uploaded from the frontend
        
    Returns:
        JSON response with transcribed text
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("audio/"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an audio file."
            )
        
        # Read the uploaded file content
        content = await file.read()
        
        # Determine file extension from content type or filename
        # OpenAI accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm
        file_extension = ".webm"  # Default for browser recordings
        if file.filename:
            # Extract extension from filename
            if "." in file.filename:
                file_extension = "." + file.filename.rsplit(".", 1)[1].lower()
        elif file.content_type:
            # Map content type to extension
            content_type_map = {
                "audio/webm": ".webm",
                "audio/wav": ".wav",
                "audio/wave": ".wav",
                "audio/x-wav": ".wav",
                "audio/mpeg": ".mp3",
                "audio/mp3": ".mp3",
                "audio/mp4": ".m4a",
            }
            file_extension = content_type_map.get(file.content_type, ".webm")
        
        # Create a temporary file with appropriate extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_path = temp_file.name
            temp_file.write(content)
            temp_file.flush()
        
        try:
            # Open the audio file and transcribe
            # OpenAI API accepts the file directly and auto-detects format
            with open(temp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="gpt-4o-transcribe",
                    file=audio_file
                )
            
            transcript_text = transcription.text
            
            return JSONResponse(
                content={"transcript": transcript_text},
                status_code=200
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        # Handle errors gracefully
        error_message = str(e)
        if "API key" in error_message or "authentication" in error_message.lower():
            raise HTTPException(
                status_code=401,
                detail="OpenAI API authentication failed. Please check your API key."
            )
        elif "file" in error_message.lower() or "format" in error_message.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Error processing audio file: {error_message}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Transcription error: {error_message}"
            )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

