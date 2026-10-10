# ShopAssist AI — E-commerce Customer Support Chatbot

## 1. Project Overview

ShopAssist AI is an AI-powered e-commerce customer-support chatbot developed using Python, Flask, and the OpenAI ChatGPT API. It enables customers to interact naturally with an AI assistant and receive help with common shopping-related questions.

The chatbot maintains conversation context, validates user input, and handles API errors gracefully.

## 2. Problem Statement

E-commerce businesses receive repetitive customer-support queries related to products, orders, shipping, returns, refunds, and payments. Handling every query manually can increase response times and customer-support workloads.

ShopAssist AI aims to provide an interactive, AI-powered chatbot that answers customer questions naturally and offers customer-support assistance around the clock.

## 3. Project Objectives

- Develop a conversational AI chatbot using the OpenAI API.
- Provide a simple, responsive web-based chat interface.
- Maintain conversation context during a session.
- Validate user input and manage conversation history.
- Handle API failures and unexpected errors gracefully.
- Protect API credentials using environment variables.

## 4. Features

- AI-powered customer conversations
- E-commerce customer-support assistance
- Conversation history management
- Clear-chat functionality
- User input validation
- API error handling
- Configurable OpenAI model
- Responsive web interface
- Secure API-key configuration

## 5. Technology Stack

| Technology | Purpose |
|---|---|
| Python | Core programming language |
| Flask | Web application backend |
| OpenAI API | AI-generated chatbot responses |
| HTML5 | Webpage structure |
| CSS3 | Interface styling |
| JavaScript | Chat interactions |
| python-dotenv | Environment variable management |
| Gunicorn | Production WSGI server |

## 6. Project Structure

```text
ChatGPT API - Chatbot Project/
│
├── app.py
├── requirements.txt
├── .env
├── .gitignore
├── README.md
│
├── ShopAssist_AI_Ecommerce_Customer_Support_Chatbot.ipynb
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

## 7. Installation and Setup

### Prerequisites

- Python 3.11 or compatible version
- pip package manager
- OpenAI API key
- Visual Studio Code or another Python IDE

### Step 1: Clone the repository

```bash
git clone <your-github-repository-url>
cd <your-project-folder>
```

Alternatively, open your existing project folder in VS Code.

### Step 2: Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install dependencies

```bash
python -m pip install -r requirements.txt
```

### Step 4: Configure environment variables

Create a `.env` file in the project root:

```text
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Replace the placeholder with your actual API key and use a model available to your API account.

**Security:** Never commit your `.env` file or expose your API key publicly.

### Step 5: Run the application

```bash
python app.py
```

### Step 6: Open the chatbot

Visit the following address in your browser:

```text
http://127.0.0.1:5000
```

## 8. How It Works

1. The customer enters a message in the web interface.
2. JavaScript sends the message to the Flask backend.
3. Flask validates the input and retrieves the session's conversation history.
4. The backend sends the conversation to the OpenAI ChatGPT API.
5. The API generates a response.
6. Flask returns the response to the browser.
7. JavaScript displays the response in the chat interface.

## 9. Basic Checks and Constraints

- API key availability is checked during application startup.
- Empty messages are rejected.
- Input length is limited.
- Conversation history is limited.
- API connection, timeout, and rate-limit errors are handled.
- Empty AI responses are handled.
- The chatbot does not access live customer accounts or order systems.
- The chatbot must not claim to complete transactions it cannot perform.
- Sensitive credentials must not be requested or exposed.

## 10. Project Limitations

- No RAG or external knowledge-base retrieval.
- No live order-tracking integration.
- No real payment, cancellation, or refund processing.
- Conversation history is stored in application memory and may be lost when the server restarts.
- AI-generated responses may occasionally be inaccurate and should be verified when necessary.

## 11. Future Enhancements

- Deploy the application to Render.
- Add persistent conversation storage.
- Implement authentication and user-specific sessions.
- Add automated chatbot tests.
- Introduce monitoring for API usage and response times.
- Integrate a real order-management system when required.

## 12. Author

**Project:** ShopAssist AI — E-commerce Customer Support Chatbot

**Category:** Generative AI / Conversational AI

**Primary Technologies:** Python, Flask, OpenAI API, HTML, CSS, JavaScript

## 13. License

This project is intended for educational and portfolio purposes. Add an appropriate open-source license if you plan to distribute it publicly.
