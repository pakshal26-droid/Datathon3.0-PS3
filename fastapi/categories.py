from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List,Optional, Union , Dict
from datetime import datetime, timedelta  # Fix import statement
from collections import defaultdict
import base64
import google.generativeai as genai
import PIL.Image


# Load environment variables
load_dotenv(override=True)

os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
# Gemini 1.5 Flash
vision_model = genai.GenerativeModel('gemini-1.5-flash')

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
llm = ChatOpenAI(model="gpt-4o")
output_parser = StrOutputParser()

# Prompt templates
ticket_type_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", ''' Classify the user's support query into **exactly one** of these Level 1 ticket categories:  
                        1. **Access** (e.g., password resets, login failures, MFA issues)  
                        2. **Usage** (e.g., navigation help, feature guidance, FAQs)  
                        3. **Verification** (e.g., hardware/software checks, compatibility)  
                        4. **Installation** (e.g., setup, configuration, troubleshooting)  
                        5. **Cloud** (e.g., mobile app issues, cloud service access)  
                        6. **Analytics** (e.g., report/dashboard access, visualization errors)  
                        7. **QA** (e.g., QA tool issues, test execution problems)  
                        8. **Security** (e.g., account security, compliance procedures)  
                        9. **General** (e.g., service info, non-technical inquiries)  

                        **Rules:**  
                        - Return **only the category name** (e.g., "Access").  
                        - Prioritize specificity (e.g., a login failure is "Access," not "General").  
                        - Default to "General" if unsure.  

                        **Example Query:**  
                        "I can't log in to the app despite resetting my password."  
                        **Response:**  
                        Access  '''),
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
        ("system", '''**Role**: Act as a Level 1 Support Agent for OpenAI. Your task is to:  
1. **Resolve** user issues falling under Level 1 categories (listed below).  
2. **Escalate** to Level 2 if the issue is complex, outside OpenAI’s scope, or requires specialized expertise.  

**Level 1 Scope**:  
- **Account & Security**:  
  - Password resets, login issues, API key management.  
  - Suspicious activity, MFA troubleshooting.  
  - Basic security guidance (e.g., "How do I rotate my API keys?").  

- **Product Support**:  
  - API usage errors (e.g., `429 rate limits`, `401 authentication`).  
  - Guidance on ChatGPT, GPT-4, DALL·E, or Assistants API.  
  - Troubleshooting model outputs (e.g., "Why is the API returning gibberish?").  

- **Technical Setup**:  
  - SDK/API integration (Python, Node.js).  
  - Billing/payment issues, subscription management.  
  - Environment setup (e.g., dependency conflicts, pip install errors).  

- **Cloud Services**:  
  - API endpoint connectivity (`api.openai.com` downtime).  
  - Latency/performance issues with OpenAI-hosted models.  

- **General**:  
  - FAQs about OpenAI’s services, pricing, or documentation.  
  - Non-technical inquiries (e.g., "What is DALL·E?").  

**Instructions**:  
1. **If resolvable under Level 1**:  
   - Provide **step-by-step solutions** in simple language.  
   - Example:  
     - *"1. Navigate to [OpenAI Login Page].  
      2. Click ‘Forgot Password’.  
      3. Enter your registered email.  
      4. Follow the reset link sent to your inbox."*  
   - Include troubleshooting (e.g., "Check your API key permissions" or "Reduce your request rate").  
   - End with reassurance: *"Let us know if you need more help! 🚀"*  

2. **If outside Level 1 scope**:  
   - Escalate: *"This requires specialized attention. Submit a ticket [here], and our team will respond within 2 hours."*  
   - **Reject off-topic queries** (e.g., food, unrelated tech):  
     *"This question isn’t related to OpenAI’s services. Please contact the relevant support team."*  

**Rules**:  
- **Never hallucinate**: Do not invent solutions for unverified issues (e.g., unreleased features like "GPT-5").  
- **Avoid jargon**: Explain technical terms (e.g., "rate limits" → "too many requests").  
- **Prioritize security**: Flag API key leaks or data breaches as critical.  

**Examples**:  
**Query**: *"I’m getting a ‘429: Rate Limit Exceeded’ error."*  
**Response**:  
1. Review your API request volume in the [OpenAI Dashboard].  
2. Reduce your requests to stay within your tier’s limits.  
3. Consider upgrading your plan if needed.  
Let us know if this resolves the issue!  

**Query**: *"My API key was accidentally exposed on GitHub'''),
        ("user","Ticket: {ticket}")
    ]
)

chatbot_prompt = ChatPromptTemplate.from_messages(
    [
        ("system",''' **Role**: Act as a friendly, empathetic support chatbot for OpenAI. Your goal is to **resolve Level 1 issues instantly** or guide users to submit tickets for complex or off-topic queries.  

**Level 1 Support Scope** (Solve these directly):  
- **Account & Security**: Password resets, login issues, API key management, MFA troubleshooting.  
- **Product Support**: API errors (e.g., `429 rate limits`, `401 authentication`), ChatGPT/GPT-4 usage guidance, DALL·E troubleshooting.  
- **Technical Setup**: SDK/API integration (Python, Node.js), billing/payment issues, dependency conflicts.  
- **Cloud Services**: API endpoint downtime (`api.openai.com`), latency issues with OpenAI-hosted models.  
- **General**: FAQs about OpenAI’s services, pricing, or documentation.  

**How to Respond**:  
1. **Empathize First**:  
   - *"I’m sorry you’re facing this issue! Let’s resolve it together."*  
   - *"That sounds frustrating! Here’s how to fix this…"*  

2. **Resolve Level 1 Issues**:  
   - Provide **simple, numbered steps** (e.g., *"1. Go to [OpenAI Account Settings] > 2. Click ‘Reset Password’"*).  
   - Use plain language (e.g., "too many requests" instead of "429 errors").  
   - End with reassurance: *"Let me know if this helps! 🚀"*  

3. **Escalate or Reject**:  
   - **Complex issues**: *"This needs deeper investigation. Submit a ticket [here], and our team will respond within 2 hours!"*  
   - **Off-topic queries** (e.g., food, non-OpenAI tech): *"This isn’t related to OpenAI’s services. Please contact the relevant support team."*  

**Rules**:  
- **Never hallucinate**: Do not invent solutions for unverified issues (e.g., "GPT-5" or unreleased features).  
- **Avoid jargon**: Explain technical terms in everyday language.  
- **Stay positive**: Use emojis sparingly .  

---  

### **Examples**:  
**User**: *"I’m getting a ‘rate limit exceeded’ error!"*  
**Response**:  
*"Oh no! Let’s fix this:  
1. Check your usage in the [OpenAI Dashboard].  
2. Reduce your API requests to stay within limits.  
3. Upgrade your plan if needed.  
Let me know if this works! *  

**User**: *"My API key was leaked!"*  
**Response**:  
*"I’m sorry this happened! Here’s what to do:  
1. Revoke the key in [Account Settings] immediately.  
2. Generate a new key and update your integrations.  
3. Monitor usage for odd activity.  
Need more help? Ask away! *  

**User**: *"Why is my Netflix not working?"*  
**Response**:  
*"This isn’t related to OpenAI’s services. Please contact Netflix support for assistance!*  

**User**: *"The API returns garbled text."*  
**Response**:  
*"This needs specialized attention. Submit a ticket [here], and our engineers will investigate within 2 hours!*  

---  

### **Key Features**:  
1. **OpenAI Focus**: Aligns with API keys, model errors, and developer workflows.  
2. **Anti-Hallucination**: Rejects speculation (e.g., "Will GPT-5 release next month?") and off-topic queries.  
3. **User Safety**: Guides users to secure leaked keys and report breaches.  
4. **Empathy-Driven**: Balances technical accuracy with friendly, jargon-free language.  

Test with edge cases like ambiguous API errors or unsupported features! 
         Reject non-OpenAI queries* (e.g., food delivery, unrelated tech): Respond "Query unrelated to OpenAI. 
                                    '''),
        ("user","Question : {question}")
    ]
)

# Req , res schemas
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

class Ticket(BaseModel):
    id: int
    name: str
    description: str
    user_email: str
    category: str
    urgency: str
    status: str
    response: str
    created_at: datetime 

class AnalyticsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    avg_resolution_time: float
    tickets_by_category: Dict[str, int]
    tickets_by_status: Dict[str, int]
    response_times: List[dict]

class TicketUpdate(BaseModel):
    status: str



# In-memory storage for demo purposes
tickets_db = []
chat_history = {}
@app.put("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: int, update_data: TicketUpdate):
    """Update a ticket's status"""
    try:
        # Find the ticket
        ticket = next((t for t in tickets_db if t.id == ticket_id), None)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Update the status
        ticket.status = update_data.status
        return ticket
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tickets/", response_model=List[Ticket])
async def get_tickets():
    """Get all tickets"""
    return tickets_db

@app.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: int):
    """Get a specific ticket by ID"""
    ticket = next((t for t in tickets_db if t.id == ticket_id), None)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.post("/tickets/", response_model=Ticket)
async def create_ticket(
    name: str = Form(...),
    description: str = Form(...),
    user_email: str = Form(...),
    image: UploadFile = File(None)
):
    """Create a new support ticket"""
    try:
        
        if image:
            # Read and process image with Gemini
            contents = await image.read()
            
            # save temporarily and open with PIL
            temp_path = f"temp_{image.filename}"
            with open(temp_path, "wb") as f:
                f.write(contents)
            
            img = PIL.Image.open(temp_path)
            
            # text extraction from image description using updated model
            response = vision_model.generate_content([
                "Please extract the text from this Image. Don't give the solution / suggestions or additional statements , just extract the text from the image and give the text as it is in the final response . Don't write *Image Analysis* or any such words"
                ,
                img
            ])
            
            os.remove(temp_path)
            full_description = (
                f"{description}\n\n"
                f"Image Analysis: {response.text}"
            )
        else:
            full_description = description

       
        ticket_type_chain = ticket_type_prompt | llm | output_parser
        category = ticket_type_chain.invoke({"ticket": full_description}).strip()

        urgency_chain = urgency_prompt | llm | output_parser
        urgency = urgency_chain.invoke({"ticket": full_description}).strip()

        response_chain = response_prompt | llm | output_parser
        ticket_response = response_chain.invoke({"ticket": full_description}).strip()

        # Create ticket object
        ticket = Ticket(
            id=len(tickets_db) + 1,
            name=name,
            description=full_description,
            user_email=user_email,
            category=category,
            urgency=urgency,
            created_at=datetime.now(),  
            status="Open",
            response=ticket_response
        )
        
        tickets_db.append(ticket)
        return ticket
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Handle chat messages"""
    try:
        # Get chat response
        chat_chain = chatbot_prompt | llm | output_parser
        response = chat_chain.invoke({"question": request.message}).strip()

        # Store chat history
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

@app.get("/analytics/", response_model=AnalyticsResponse)
async def get_analytics():
    """Get analytics data for the dashboard"""
    try:
        #  total tickets
        total_tickets = len(tickets_db)
        
        #  open tickets
        open_tickets = sum(1 for ticket in tickets_db if ticket.status == "Open")
        
        #  average resolution time
        resolution_times = []
        for ticket in tickets_db:
            if ticket.status == "Resolved":
                created = ticket.created_at
                resolution_time = created + timedelta(hours=float(ticket.id))
                time_diff = (resolution_time - created).total_seconds() / 3600  # Convert to hours
                resolution_times.append(time_diff)
        
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
        
        #  tickets by category and status
        tickets_by_category = defaultdict(int)
        tickets_by_status = defaultdict(int)
        
        for ticket in tickets_db:
            tickets_by_category[ticket.category] += 1
            tickets_by_status[ticket.status] += 1
        
        
        response_times = [
            {
                "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "time": round(float(i + 1) * 1.5, 1)  # Simulated data
            }
            for i in range(7)
        ]
        
        return AnalyticsResponse(
            total_tickets=total_tickets,
            open_tickets=open_tickets,
            avg_resolution_time=avg_resolution_time,
            tickets_by_category=dict(tickets_by_category),
            tickets_by_status=dict(tickets_by_status),
            response_times=response_times
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: int):
    """Delete a specific ticket"""
    try:
        ticket_index = next((index for (index, ticket) in enumerate(tickets_db) if ticket.id == ticket_id), None)
        if ticket_index is None:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        tickets_db.pop(ticket_index)
        return {"message": "Ticket deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tickets/filtered/", response_model=List[Ticket])
async def get_filtered_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    """Get filtered tickets based on criteria"""
    filtered_tickets = tickets_db
    
    if status:
        filtered_tickets = [t for t in filtered_tickets if t.status.lower() == status.lower()]
    
    if category:
        filtered_tickets = [t for t in filtered_tickets if t.category.lower() == category.lower()]
    
    if from_date:
        from_datetime = datetime.fromisoformat(from_date)
        filtered_tickets = [t for t in filtered_tickets if t.created_at >= from_datetime]
    
    if to_date:
        to_datetime = datetime.fromisoformat(to_date)
        filtered_tickets = [t for t in filtered_tickets if t.created_at <= to_datetime]
    
    return filtered_tickets

# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndmhveGZlcHBrYW53cGtpYW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDgxMjEsImV4cCI6MjA1Mzg4NDEyMX0.8caNA4GZ9SHaDuynSQ8AWF_7PEWV2JXM4z8MG4L32QM
# https://wgvhoxfeppkanwpkiany.supabase.co