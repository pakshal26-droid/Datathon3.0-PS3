from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List,Optional, Union , Any
from datetime import datetime  # Fix import statement
from enum import Enum

# Load environment variables
load_dotenv(override=True)

os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize LangChain LLM
llm = ChatOpenAI(model="gpt-3.5-turbo")
output_parser = StrOutputParser()

# Prompt templates
ticket_type_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", ''' Classify the user's support query into **exactly one** of these Level 1 ticket categories:  
                        1. **Account & Security** (e.g., password resets, login failures, MFA issues, account security, compliance)  
                        2. **Product Support** (e.g., navigation help, feature guidance, FAQs, dashboard/report access, visualization errors)  
                        3. **Technical Setup** (e.g., software/hardware checks, compatibility, installation, configuration, QA tool issues)  
                        4. **Cloud Services** (e.g., mobile app issues, cloud access, AWS/Azure/GCP errors)  
                        5. **General** (e.g., service info, non-technical inquiries, unclassifiable issues)  

                        **Rules:**  
                        - Return **only the category name** (e.g., "Account & Security").  
                        - Prioritize specificity (e.g., "I can’t access AWS" → **Cloud Services**, not "General").  
                        - Default to "General" if unsure.  

                        **Example Query:**  
                        "I can't log in to the app despite resetting my password."  
                        **Response:**  
                        Account & Security    '''),
        ("user", "Ticket: {ticket}")
    ]
)

urgency_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", '''Evaluate the urgency of this support ticket **based on**:  
                    - Severity of the user’s inability to use the product/service (e.g., blocked workflows, emotional distress).  
                    - Scale of impact (number of users affected).  
                    - Indirect business risk (e.g., reputational harm, churn likelihood).  

                    Use **only one** of these urgency levels:  
                    1. **Critical** (e.g., *total system outage*, *data breach*, *user cannot perform any core actions*).  
                    2. **High** (e.g., *critical feature broken for a single user*, *security vulnerability*, *payment failure*).  
                    3. **Medium** (e.g., *partial feature disruption with a workaround*, *minor data inaccuracies*).  
                    4. **Low** (e.g., *cosmetic bugs*, *non-urgent feature requests*).  

                    **Rules:**  
                    - Return **only the urgency level** (e.g., "High").  
                    - Prioritize user frustration and blocked workflows.  
                    - If multiple users are impacted, escalate urgency (e.g., 100 users = Critical; 1 user = High/Medium).  
                    - Security/privacy issues default to **Critical** or **High**.  
                    - Default to "Medium" if uncertain.  

                    **Example Query:**  
                    "My payment failed 3 times, and I cant complete my purchase. This is urgent!"  
                    **Response:**  
                    High '''),
        ("user", "Ticket: {ticket}")
    ]
)

response_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", '''**Role**: Act as a Level 1 Support Agent for Motivity Labs. Your task is to:  
                    1. **Resolve** user issues falling under Level 1 categories (listed below).  
                    2. **Escalate** to Level 2 if the issue is complex or outside Level 1 scope.  

                    **Level 1 Scope**:  
                    - **Account & Security**: Password resets, login troubleshooting, account unlocks, MFA issues.  
                    - **Product Support**: Feature explanations, dashboard navigation, FAQs, analytics/report access.  
                    - **Technical Setup**: App/software installation, compatibility checks, basic troubleshooting (crashes, slow performance).  
                    - **Cloud Services**: Cloud access (AWS/Azure/GCP), mobile app issues, dashboard configuration.  
                    - **General**: Non-technical inquiries, service information, issue escalation.  

                    **Instructions**:  
                    1. **If resolvable under Level 1**:  
                        - Provide a **step-by-step solution** in simple, non-technical language.  
                        - Include troubleshooting tips (e.g., "Clear cache," "Restart the app").  
                        - Use numbered lists for clarity.  
                        - End with reassurance: "Let us know if you need more help!"  

                    2. **If outside Level 1 scope**:  
                        - Respond: "This requires further investigation. Your ticket has been assigned to a specialist, and they will contact you shortly."  
                        - Do **not** speculate or provide incomplete fixes.  

                    **Rules**:  
                    - Prioritize brevity and empathy.  
                    - Avoid jargon; use everyday language.  
                    - Never invent solutions for unverifiable issues (e.g., server outages, API errors).  

                    **Examples**:  

                    **Query**: "I forgot my password and can't log in."  
                    **Response**:  
                    1. Go to [Motivity Labs Login Page].  
                    2. Click "Forgot Password."  
                    3. Enter your registered email.  
                    4. Check your inbox for the reset link.  
                    5. Create a new password.  
                    Let us know if you need further assistance!  

                    **Query**: "The app crashes when exporting data."  
                    **Response**:  
                    This requires further investigation. Your ticket has been assigned to a specialist, and they will contact you shortly.   '''),
        ("user","Ticket: {ticket}")
    ]
)

chatbot_prompt = ChatPromptTemplate.from_messages(
    [
        ("system",''' **Role**: Act as a friendly, empathetic support chatbot for Motivity Labs. Your goal is to **instantly resolve Level 1 issues** or guide users to submit a ticket for complex problems.  

                    **Level 1 Support Scope** (Solve these directly):  
                    - Password resets, login issues, or account unlocks.  
                    - App crashes, slow performance, or basic setup guidance.  
                    - Explaining product features, dashboard navigation, or FAQs.  
                    - Software installation steps or compatibility checks.  
                    - Basic cloud/data access issues (e.g., AWS/Azure/GCP login errors).  
                    - General questions about Motivity Labs' services.  

                    **How to Respond**:  
                    1. **Empathize First**:  
                    - Start with kindness: *"I'm sorry you're dealing with this! Let's fix it together."*  
                    - Acknowledge frustration: *"That sounds stressful! Here's how to resolve this…"*  

                    2. **Resolve Level 1 Issues**:  
                    - Provide **simple, numbered steps** (e.g., *"1. Go to the login page > 2. Click 'Reset Password'"*).  
                    - Use plain language (no jargon).  
                    - End with reassurance: *"Let me know if this helps! 😊"*  

                    3. **Escalate Complex Queries**:  
                    - Say: *"This needs special attention! Please submit a ticket in the support section. Our team will reach out in some time to resolve this!"*  
                    - Never leave users without a next step.  

                    **Rules**:  
                    - **Stay Positive**: Use friendly emojis (e.g., 🚀, 💡) sparingly.  
                    - **Avoid Tech Terms**: Explain solutions like you're talking to a friend.  
                    - **Never Guess**: If unsure, escalate immediately.  

                    **Examples**:  
                    **User**: *"I'm locked out of my account!"*  
                    **Response**:  
                    *"Oh no! Let's get you back in: '
                    1. Visit [Login Help Page].  
                    2. Click 'Unlock Account'.  
                    3. Enter your email.  
                    4. Follow the instructions sent to your inbox.  
                    Let me know if you're still stuck! 💻"*  

                    **User**: *"There's a critical bug in your API integration."*  
                    **Response**:  
                    *"I'm so sorry about this! Our engineering team needs to investigate. Could you submit a ticket [here]? They'll prioritize this and update you within 1 hour. Thank you for your patience! 🙏"*  
                                    '''),
        ("user","Question : {question}")
    ]
)

# Enhanced request and response schemas
class TicketRequest(BaseModel):
    name: str
    description: str
    user_email: str

class TicketResponse(BaseModel):
    description: str
    category: str
    urgency: str
    ticket_response: str

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    suggested_actions: Optional[List[str]] = None

class TicketCategory(str, Enum):
    ACCOUNT_SECURITY = "Account and Security"
    PRODUCT_SUPPORT = "Product Support"
    TECHNICAL_SUPPORT = "Technical Support"
    CLOUD_SERVICES = "Cloud Services"
    GENERAL = "General"
 
class TicketUrgency(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class TicketStatus(str, Enum):
    OPEN = "Open"
    RESOLVED = "Resolved"

class Ticket(BaseModel):
    id: int
    name: str
    description: str
    user_email: str
    category: TicketCategory
    urgency: TicketUrgency
    status: TicketStatus
    response: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

    class Config:
        use_enum_values = True

TICKET_METADATA = {
    "categories": [
        {
            "id": "Account and Security",
            "label": "Account and Security",
            "description": "Password resets, account access, security concerns, authentication issues"
        },
        {
            "id": "Product Support",
            "label": "Product Support",
            "description": "Product usage, features, functionality, user guides"
        },
        {
            "id": "Technical Support",
            "label": "Technical Support",
            "description": "Technical issues, bugs, system errors, installation problems"
        },
        {
            "id": "Cloud Services",
            "label": "Cloud Services",
            "description": "Cloud infrastructure, deployments, cloud-related issues"
        },
        {
            "id": "General",
            "label": "General",
            "description": "General inquiries, feedback, non-technical questions"
        }
    ],
    "urgency_levels": [
        {"id": "Critical", "label": "Critical", "description": "Total system outage, data breach"},
        {"id": "High", "label": "High", "description": "Critical feature broken, security vulnerability"},
        {"id": "Medium", "label": "Medium", "description": "Partial feature disruption with workaround"},
        {"id": "Low", "label": "Low", "description": "Cosmetic bugs, non-urgent requests"}
    ],
    "status_types": [
        {"id": "Open", "label": "Open", "description": "Ticket awaiting initial response"},
        {"id": "Resolved", "label": "Resolved", "description": "Issue has been resolved"}
    ]
}

# In-memory storage for demo purposes
tickets_db = []
chat_history = {}

@app.get("/api/metadata")
async def get_metadata():
    """Get all ticket categories, urgency levels, and status types"""
    return TICKET_METADATA

@app.post("/tickets/", response_model=Ticket)
async def create_ticket(request: TicketRequest):
    """Create a new support ticket"""
    try:
        # Classify ticket type and urgency using LLM
        ticket_type_chain = ticket_type_prompt | llm | output_parser
        category_str = ticket_type_chain.invoke({"ticket": request.description}).strip()
        
        urgency_chain = urgency_prompt | llm | output_parser
        urgency_str = urgency_chain.invoke({"ticket": request.description}).strip()
        
        response_chain = response_prompt | llm | output_parser
        ticket_response = response_chain.invoke({"ticket": request.description}).strip()

        # Create ticket with proper enum values
        ticket = Ticket(
            id=len(tickets_db) + 1,
            name=request.name,
            description=request.description,
            user_email=request.user_email,
            category=TicketCategory(category_str),  # Convert string to enum
            urgency=TicketUrgency(urgency_str),    # Convert string to enum
            status=TicketStatus.OPEN,           # Use enum directly
            response=ticket_response,
            created_at=datetime.now()
        )
        
        tickets_db.append(ticket)
        return ticket
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid category or urgency value: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: int):
    """Get a specific ticket by ID"""
    ticket = next((t for t in tickets_db if t.id == ticket_id), None)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.post("/chat/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Handle chat messages"""
    try:
        # Get chat response
        chat_chain = chatbot_prompt | llm | output_parser
        response = chat_chain.invoke({"question": request.message}).strip()

        # Store chat history (optional)
        if request.user_id not in chat_history:
            chat_history[request.user_id] = []
        chat_history[request.user_id].append({
            "user": request.message,
            "bot": response
        })

        # You can add logic here to determine suggested actions based on the message
        suggested_actions = []
        if "ticket" in request.message.lower() or "support" in request.message.lower():
            suggested_actions.append("Create Support Ticket")
        if "documentation" in request.message.lower():
            suggested_actions.append("View Documentation")

        return ChatResponse(
            response=response,
            suggested_actions=suggested_actions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/{user_id}/history", response_model=List[dict])
async def get_chat_history(user_id: str):
    """Get chat history for a specific user"""
    if user_id not in chat_history:
        return []
    return chat_history[user_id]

@app.get("/api/analytics")
async def get_analytics():
    if not tickets_db:
        return {
            "total_tickets": 0,
            "status_distribution": {status.value: 0 for status in TicketStatus},
            "category_distribution": {category.value: 0 for category in TicketCategory},
            "urgency_distribution": {urgency.value: 0 for urgency in TicketUrgency},
        }

    total_tickets = len(tickets_db)
    solved_tickets = len([t for t in tickets_db if t.status == TicketStatus.RESOLVED])
    
    # Initialize distributions with zeros
    status_distribution = {status.value: 0 for status in TicketStatus}
    category_distribution = {category.value: 0 for category in TicketCategory}
    urgency_distribution = {urgency.value: 0 for urgency in TicketUrgency}
    
    # Count actual distributions
    for ticket in tickets_db:
        status_distribution[ticket.status] += 1
        category_distribution[ticket.category] += 1
        urgency_distribution[ticket.urgency] += 1
    
    
    return {
        "total_tickets": total_tickets,
        "status_distribution": status_distribution,
        "category_distribution": category_distribution,
        "urgency_distribution": urgency_distribution,
        "tickets_by_category": {
            category.value: len([t for t in tickets_db if t.category == category.value])
            for category in TicketCategory
        }
    }