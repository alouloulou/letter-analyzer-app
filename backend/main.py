from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import base64
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, List

# Load environment variables
load_dotenv()

app = FastAPI(title="Letter Analyzer API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisResponse(BaseModel):
    summary: str
    highlights: List[str]
    what_to_do: List[str]
    important_dates: List[str]
    email_prompt: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "summary": "This is a sample letter summary",
                    "highlights": ["Important point 1", "Important point 2"],
                    "what_to_do": ["Action 1", "Action 2"],
                    "important_dates": ["2024-01-01: Due date"],
                    "email_prompt": "Would you like me to write an email to someone@example.com?"
                }
            ]
        }
    }

@app.get("/")
async def root():
    return {"message": "Letter Analyzer API is running!"}

@app.post("/analyze-letter", response_model=AnalysisResponse)
async def analyze_letter(file: UploadFile = File(...)):
    """
    Analyze a letter image and extract key information
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Convert to base64
        base64_image = base64.b64encode(contents).decode('utf-8')
        data_url = f"data:{file.content_type};base64,{base64_image}"
        
        # Get API key from environment
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
        
        # Make request to OpenRouter API
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "https://letter-analyzer.vercel.app"),
                "X-Title": os.getenv("OPENROUTER_SITE_NAME", "Letter Analyzer"),
            },
            data=json.dumps({
                "model": "mistralai/mistral-small-3.2-24b-instruct:free",
                "messages": [
                    {
                        "role": "system",
                        "content": """You are an AI assistant that reads letters from images and helps users quickly understand and act on them.

                        Your task is to extract and summarize the key information from the input letter image and return a structured response with the following sections:
                        
                        1. Summary: A concise, plain-language summary of the letter (maximum 2 lines).
                        2. Highlights: A bullet list of the most important facts or statements extracted from the letter.
                        3. What To Do: A list of actions the user needs to take, based on the letter's content (if any).
                        4. Important Dates: Extract any dates mentioned in the letter. For each, add a very short (1-line) description of its significance.
                        5. Email Prompt (if relevant): If the letter mentions someone the user should reply to via email, include:
                           > "Would you like me to write an email to [name/email]?"
                        
                        Use plain, helpful language. Be precise, but avoid copying long text from the letter.
                        
                        If the image is unclear or not a letter, say so politely.
                        
                        Structure your response exactly as follows:
                        
                        **Summary:**  
                        <2-line plain-language summary>
                        
                        **Highlights:**  
                        - <fact 1>  
                        - <fact 2>  
                        ...
                        
                        **What To Do:**  
                        - <action 1>  
                        ...
                        
                        **Important Dates:**  
                        - <Date>: <short description>
                        
                        **Email Prompt:**  
                        Would you like me to write an email to [name/email]?
                        
                        If a section does not apply, simply omit it.
                        """
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please analyze this letter and give a clear summary, important info, and actions needed."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": data_url
                                }
                            }
                        ]
                    }
                ],
            })
        )
        
        if response.status_code == 200:
            message = response.json()["choices"][0]["message"]["content"]
            
            # Parse the response into structured format
            return parse_ai_response(message)
        else:
            raise HTTPException(status_code=response.status_code, detail=f"OpenRouter API error: {response.text}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing letter: {str(e)}")

def parse_ai_response(response_text: str) -> AnalysisResponse:
    """
    Parse the AI response into structured format
    """
    lines = response_text.split('\n')
    
    summary = ""
    highlights = []
    what_to_do = []
    important_dates = []
    email_prompt = None
    
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if "**Summary:**" in line:
            current_section = "summary"
        elif "**Highlights:**" in line:
            current_section = "highlights"
        elif "**What To Do:**" in line:
            current_section = "what_to_do"
        elif "**Important Dates:**" in line:
            current_section = "important_dates"
        elif "**Email Prompt:**" in line:
            current_section = "email_prompt"
        elif line.startswith("- ") and current_section in ["highlights", "what_to_do", "important_dates"]:
            content = line[2:].strip()
            if current_section == "highlights":
                highlights.append(content)
            elif current_section == "what_to_do":
                what_to_do.append(content)
            elif current_section == "important_dates":
                important_dates.append(content)
        elif current_section == "summary" and line and not line.startswith("**"):
            summary = line
        elif current_section == "email_prompt" and line and not line.startswith("**"):
            email_prompt = line
    
    return AnalysisResponse(
        summary=summary,
        highlights=highlights,
        what_to_do=what_to_do,
        important_dates=important_dates,
        email_prompt=email_prompt
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 