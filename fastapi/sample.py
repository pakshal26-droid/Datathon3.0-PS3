from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List,Optional, Union

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
        ("system",'''**Role**: Act as a Level 1 Support Agent for Motivity Labs. Your task is to:  
                    1. **Resolve** user issues falling under Level 1 categories (listed below).  
                    2. **Escalate** to Level 2 if the issue is complex or outside Level 1 scope.  

                    **Level 1 Scope**:  
                    - **Authentication & Access**: Password resets, login troubleshooting, account unlocks.  
                    - **Basic Troubleshooting**: App crashes, slow performance, initial setup guidance.  
                    - **Product Guidance**: Feature explanations, dashboard navigation, analytics tool help.  
                    - **Installation**: Standard software setup, prerequisite verification.  
                    - **Cloud/Data**: Cloud service access (AWS/Azure/GCP), dashboard configuration.  
                    - **Compatibility**: Confirming system specs meet requirements.  
                    - **General FAQs**: Answers about Motivity Labs’ services, basic escalations.  

                    **Instructions**:  
                    1. **If the query is resolvable under Level 1**:  
                        - Provide a **step-by-step solution** in simple, non-technical language.  
                        - Include troubleshooting tips (e.g., cache clearing, restarting apps).  
                        - Use numbered lists for clarity.  
                        - End with a friendly reassurance (e.g., "Let us know if you need more help!").  

                    2. **If the query is outside Level 1 scope**:  
                        - Respond: "This requires further investigation. Your ticket has been assigned to a specialist, and they will contact you within sometime."  
                        - Do not speculate or provide incomplete fixes.  

                    **Rules**:  
                    - Prioritize brevity and empathy.  
                    - Avoid jargon; use layman-friendly terms.  
                    - Never invent solutions for unverifiable issues (e.g., server outages, custom code errors).  

                    **Examples**:  

                    **Query**: "I forgot my password and cant log in."  
                    **Response**:  
                    1. Go to [Motivity Labs Login Page].  
                    2. Click "Forgot Password."  
                    3. Enter your registered email.  
                    4. Check your inbox for a reset link.  
                    5. Create a new password.  
                    Let us know if you need further assistance!  

                    **Query**: "The app keeps crashing when I open reports."  
                    **Response**:  
                    This requires further investigation. Your ticket has been assigned to a specialist, and they will contact you within some time.   
                    ''')
        ("user","Ticket:{ticket}")
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
                    - Provide **simple, numbered steps** (e.g., *"1. Go to [link] > 2. Click 'Reset Password'"*).  
                    - Use plain language (no jargon).  
                    - End with reassurance: *"Let me know if this helps! 😊"*  

                    3. **Escalate Complex Queries**:  
                    - Say: *"This needs special attention! Please submit a ticket [here]. Our team will reach out within [X hours] to resolve this!"*  
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
                                    ''')
        ("user","Question : {question}")
    ]
)
