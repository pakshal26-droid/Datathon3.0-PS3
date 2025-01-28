from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI app
app = FastAPI()

# Initialize LangChain LLM
llm = ChatOpenAI(model="gpt-3.5-turbo")
output_parser = StrOutputParser()

# Prompt templates
ticket_type_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You will receive tickets from a system. Identify the type of each ticket as either 'billing' or 'login'. Respond with only one word: 'billing' or 'login'."),
        ("user", "Ticket: {ticket}")
    ]
)

urgency_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You will receive tickets from a system. Based on the content of each ticket, classify the urgency as one of the following: 'very urgent', 'urgent', or 'not urgent'. Respond with only one of these three options."),
        ("user", "Ticket: {ticket}")
    ]
)

# Define request and response schemas
class TicketRequest(BaseModel):
    ticket: str

class TicketResponse(BaseModel):
    ticket: str
    category: str
    urgency: str

# API endpoint
@app.post("/classify-ticket", response_model=TicketResponse)
async def classify_ticket(request: TicketRequest):
    try:
        # Get ticket text from the request
        ticket_text = request.ticket

        # Classify ticket type
        ticket_type_chain = ticket_type_prompt | llm | output_parser
        category = ticket_type_chain.invoke({"ticket": ticket_text}).strip()

        # Classify urgency
        urgency_chain = urgency_prompt | llm | output_parser
        urgency = urgency_chain.invoke({"ticket": ticket_text}).strip()

        # Return classification
        return TicketResponse(
            ticket=ticket_text,
            category=category,
            urgency=urgency
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
