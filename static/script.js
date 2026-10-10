
"use strict";

/* =====================================================
   SHOPASSIST AI — CHAT FRONTEND
   Flask API: POST /chat
   ===================================================== */

document.addEventListener("DOMContentLoaded", initializeChat);

function initializeChat() {
    const chatForm = document.getElementById("chat-form");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatContainer = document.getElementById("chat-container");
    const newChatButton = document.getElementById("new-chat-btn");

    if (
        !chatForm ||
        !messageInput ||
        !sendButton ||
        !chatContainer ||
        !newChatButton
    ) {
        console.error(
            "ShopAssist AI: Required HTML elements are missing."
        );
        return;
    }

    const MAX_LENGTH = 2000;
    const MAX_HISTORY = 20;

    let history = [];
    let isSending = false;
    let typingElement = null;

    // Render Lucide icons when the library is available.
    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    }

    refreshIcons();

    // Safely create elements using textContent, not innerHTML
    // for user-provided text.
    function createMessage(role, content, options = {}) {
        const article = document.createElement("article");
        article.className = "message";

        if (role === "user") {
            article.classList.add("user");
        } else {
            article.classList.add("assistant-message");
        }

        if (options.error) {
            article.classList.add("error-message");
        }

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";

        if (role === "user") {
            avatar.classList.add("user-avatar");
            avatar.setAttribute("aria-label", "You");
            avatar.textContent = "You";
        } else {
            avatar.classList.add("assistant-avatar");

            const icon = document.createElement("i");
            icon.setAttribute("data-lucide", "shopping-bag");
            avatar.appendChild(icon);
        }

        const body = document.createElement("div");
        body.className = "message-body";

        const meta = document.createElement("div");
        meta.className = "message-meta";

        const name = document.createElement("strong");
        name.textContent = role === "user" ? "You" : "ShopAssist AI";

        const label = document.createElement("span");
        label.textContent = role === "user"
            ? getCurrentTime()
            : options.error
                ? "Notice"
                : "AI Assistant";

        meta.append(name, label);

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = content;

        body.append(meta, bubble);
        article.append(avatar, body);

        chatContainer.appendChild(article);

        refreshIcons();
        scrollToLatest();

        return article;
    }

    function getCurrentTime() {
        return new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function scrollToLatest() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTyping() {
        removeTyping();

        const article = document.createElement("article");
        article.className = "message assistant-message";
        article.setAttribute("aria-label", "ShopAssist AI is responding");

        const avatar = document.createElement("div");
        avatar.className = "message-avatar assistant-avatar";

        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", "shopping-bag");
        avatar.appendChild(icon);

        const body = document.createElement("div");
        body.className = "message-body";

        const meta = document.createElement("div");
        meta.className = "message-meta";

        const name = document.createElement("strong");
        name.textContent = "ShopAssist AI";

        const label = document.createElement("span");
        label.textContent = "Thinking...";

        meta.append(name, label);

        const bubble = document.createElement("div");
        bubble.className = "message-bubble typing-indicator";
        bubble.setAttribute("aria-label", "Generating response");

        for (let i = 0; i < 3; i++) {
            bubble.appendChild(document.createElement("span"));
        }

        body.append(meta, bubble);
        article.append(avatar, body);

        chatContainer.appendChild(article);
        typingElement = article;

        refreshIcons();
        scrollToLatest();
    }

    function removeTyping() {
        if (typingElement) {
            typingElement.remove();
            typingElement = null;
        }
    }

    function setSending(sending) {
        isSending = sending;
        sendButton.disabled = sending;
        messageInput.disabled = sending;

        sendButton.setAttribute(
            "aria-label",
            sending ? "Sending message" : "Send message"
        );

        if (sending) {
            sendButton.innerHTML = '<i data-lucide="loader-circle"></i>';
        } else {
            sendButton.innerHTML = '<i data-lucide="arrow-up"></i>';
        }

        refreshIcons();
    }

    function resizeInput() {
        messageInput.style.height = "auto";

        const maximumHeight = 140;
        messageInput.style.height =
            Math.min(messageInput.scrollHeight, maximumHeight) + "px";
    }

    async function sendMessage(rawMessage) {
        if (isSending) {
            return;
        }

        const message = rawMessage.trim();

        if (!message) {
            messageInput.focus();
            return;
        }

        if (message.length > MAX_LENGTH) {
            createMessage(
                "assistant",
                `Please keep your message under ${MAX_LENGTH} characters.`,
                { error: true }
            );
            return;
        }

        // Keep a copy of the previous conversation for this request.
        const previousHistory = history.slice(-MAX_HISTORY);

        createMessage("user", message);

        // Clear immediately so the message cannot be submitted twice.
        messageInput.value = "";
        resizeInput();
        setSending(true);
        showTyping();

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    message: message,
                    history: previousHistory
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    `The server returned an error (${response.status}).`
                );
            }

            if (
                typeof data.reply !== "string" ||
                !data.reply.trim()
            ) {
                throw new Error("The server returned an empty response.");
            }

            const reply = data.reply.trim();

            // Only update history after a successful API response.
            history = [
                ...previousHistory,
                { role: "user", content: message },
                { role: "assistant", content: reply }
            ].slice(-MAX_HISTORY);

            removeTyping();
            createMessage("assistant", reply);

        } catch (error) {
            removeTyping();

            console.error("ShopAssist AI chat error:", error);

            createMessage(
                "assistant",
                error.message ||
                    "Unable to connect to ShopAssist AI. Please try again.",
                { error: true }
            );

        } finally {
            setSending(false);
            messageInput.focus();
            scrollToLatest();
        }
    }

    // Submit messages.
    chatForm.addEventListener("submit", function (event) {
        event.preventDefault();
        sendMessage(messageInput.value);
    });

    // Enter sends; Shift + Enter adds a new line.
    messageInput.addEventListener("keydown", function (event) {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {
            event.preventDefault();

            if (!isSending) {
                chatForm.requestSubmit();
            }
        }
    });

    messageInput.addEventListener("input", resizeInput);

    // Suggested prompts.
    document.querySelectorAll("[data-prompt]").forEach(function (button) {
        button.addEventListener("click", function () {
            if (isSending) {
                return;
            }

            const prompt = button.getAttribute("data-prompt");

            if (prompt) {
                messageInput.value = prompt;
                resizeInput();
                messageInput.focus();
            }
        });
    });

    // Sidebar navigation inserts a relevant question.
    document.querySelectorAll("[data-topic]").forEach(function (button) {
        button.addEventListener("click", function () {
            if (isSending) {
                return;
            }

            document.querySelectorAll("[data-topic]").forEach(function (item) {
                item.classList.toggle("active", item === button);
            });

            const prompts = {
                general: "",
                order: "How can I track my order?",
                returns: "What is the general returns and refunds process?",
                payments: "What payment methods are commonly used for online shopping?"
            };

            const prompt = prompts[button.getAttribute("data-topic")];

            if (prompt) {
                messageInput.value = prompt;
                resizeInput();
                messageInput.focus();
            }
        });
    });

    // Start a fresh client-side conversation.
    newChatButton.addEventListener("click", function () {
        if (isSending) {
            return;
        }

        history = [];
        removeTyping();

        chatContainer.replaceChildren();

        createMessage(
            "assistant",
            "Welcome! 👋 I'm here to help with your shopping questions. What can I help you with today?"
        );

        messageInput.value = "";
        resizeInput();
        messageInput.focus();

        document.querySelectorAll("[data-topic]").forEach(function (item) {
            item.classList.toggle(
                "active",
                item.getAttribute("data-topic") === "general"
            );
        });
    });

    resizeInput();
}
