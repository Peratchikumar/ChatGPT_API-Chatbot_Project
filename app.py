
import os
import logging

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from openai import (
    OpenAI,
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    RateLimitError,
)

load_dotenv()

# --------------------------------------------------
# 1. APPLICATION CONFIGURATION
# --------------------------------------------------

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024  # 32 KB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_MESSAGES = 20
MAX_OUTPUT_TOKENS = 500

SYSTEM_PROMPT = """
You are ShopAssist AI, a friendly and professional
e-commerce customer support chatbot.

You can provide general guidance about:
- Orders and delivery
- Shipping
- Returns and exchanges
- Refund procedures
- Payment methods
- Product questions
- Order cancellations
- General shopping assistance

Rules:
1. Be polite, clear, helpful, and concise.
2. Ask follow-up questions when necessary.
3. Never invent order numbers, delivery dates, prices,
   product availability, refund status, or retailer policies.
4. You do not have access to live orders, inventory,
   customer accounts, or payment systems.
5. Explain that customers must contact their retailer
   for account-specific or transaction-specific assistance.
6. Never request passwords, OTPs, CVVs, or full card numbers.
7. Do not claim that a refund, cancellation, or transaction
   has been completed.
8. Give general information when exact store policies
   are not provided.
9. Respond to unrelated questions briefly and politely,
   then guide the user back to shopping support.
10. Never claim to perform actions you cannot perform.
"""

client = OpenAI(api_key=API_KEY) if API_KEY else None


# --------------------------------------------------
# 2. HOME PAGE
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


# --------------------------------------------------
# 3. HEALTH CHECK
# --------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "application": "ShopAssist AI",
        "api_configured": client is not None,
    }), 200


# --------------------------------------------------
# 4. CHAT API
# --------------------------------------------------

@app.route("/chat", methods=["POST"])
def chat():
    if not request.is_json:
        return jsonify({
            "error": "Please send a valid JSON request."
        }), 415

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid request body."
        }), 400

    message = data.get("message")

    if not isinstance(message, str):
        return jsonify({
            "error": "Message must be text."
        }), 400

    message = message.strip()

    if not message:
        return jsonify({
            "error": "Please enter a message."
        }), 400

    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify({
            "error": (
                f"Your message must not exceed "
                f"{MAX_MESSAGE_LENGTH} characters."
            )
        }), 400

    if client is None:
        return jsonify({
            "error": (
                "The OpenAI API key is not configured. "
                "Add OPENAI_API_KEY to your .env file."
            )
        }), 503

    # Validate conversation history supplied by the frontend.
    history = data.get("history", [])

    if not isinstance(history, list):
        return jsonify({
            "error": "Conversation history must be a list."
        }), 400

    if len(history) > MAX_HISTORY_MESSAGES:
        history = history[-MAX_HISTORY_MESSAGES:]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for item in history:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        # Only accept user and assistant messages.
        if role not in ("user", "assistant"):
            continue

        if not isinstance(content, str):
            continue

        content = content.strip()

        if not content or len(content) > MAX_MESSAGE_LENGTH:
            continue

        messages.append({
            "role": role,
            "content": content,
        })

    # Add the latest message exactly once.
    messages.append({
        "role": "user",
        "content": message,
    })

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            max_tokens=MAX_OUTPUT_TOKENS,
            temperature=0.5,
        )

        reply = response.choices[0].message.content

        if not reply or not reply.strip():
            return jsonify({
                "error": "The AI returned an empty response. Please retry."
            }), 502

        return jsonify({
            "reply": reply.strip(),
        }), 200

    except RateLimitError:
        logger.warning("OpenAI API rate limit reached.")
        return jsonify({
            "error": (
                "The chatbot is temporarily busy. "
                "Please wait a moment and try again."
            )
        }), 429

    except APITimeoutError:
        logger.warning("OpenAI API request timed out.")
        return jsonify({
            "error": "The request timed out. Please try again."
        }), 504

    except APIConnectionError:
        logger.exception("Could not connect to the OpenAI API.")
        return jsonify({
            "error": (
                "Could not connect to the AI service. "
                "Check your internet connection and try again."
            )
        }), 503

    except APIStatusError as exc:
        logger.error(
            "OpenAI API returned status %s", exc.status_code
        )

        if exc.status_code in (401, 403):
            error_message = (
                "The API key is invalid or does not have "
                "permission to use the selected model."
            )
            status_code = 502
        else:
            error_message = (
                "The AI service encountered an error. "
                "Please try again later."
            )
            status_code = 502

        return jsonify({"error": error_message}), status_code

    except Exception:
        logger.exception("Unexpected error while processing chat.")
        return jsonify({
            "error": "An unexpected error occurred. Please try again."
        }), 500


# --------------------------------------------------
# 5. APPLICATION ENTRY POINT
# --------------------------------------------------

if __name__ == "__main__":
    # Debug mode is disabled by default.
    debug_mode = (
        os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )

    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
        debug=debug_mode,
    )
