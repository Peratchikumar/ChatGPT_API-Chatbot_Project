
/* =========================================================
   ShopAssist AI
   AI-Powered E-commerce Customer Support Chatbot
   Frontend chat controller
   Flask endpoint: POST /chat
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // 1. DOM elements
    // -----------------------------------------------------

    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const chatMessages = document.getElementById("chatMessages");
    const welcomeScreen = document.getElementById("welcomeScreen");

    const newChatBtn = document.getElementById("newChatBtn");
    const headerNewChatBtn = document.getElementById("headerNewChatBtn");

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!chatForm || !messageInput || !chatMessages) {
        console.error(
            "ShopAssist AI: Required chat elements were not found. " +
            "Check templates/index.html."
        );
        return;
    }

    // -----------------------------------------------------
    // 2. Chat state
    // -----------------------------------------------------

    const ASSISTANT_NAME = "ShopAssist AI";
    const MAX_HISTORY_MESSAGES = 20;

    let conversationHistory = [];
    let isSending = false;
    let typingElement = null;

    // -----------------------------------------------------
    // 3. General helpers
    // -----------------------------------------------------

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function setSendingState(sending) {
        isSending = sending;

        if (sendButton) {
            sendButton.disabled = sending;
            sendButton.setAttribute("aria-busy", String(sending));
        }

        messageInput.disabled = sending;

        if (sending) {
            chatForm.setAttribute("aria-busy", "true");
        } else {
            chatForm.removeAttribute("aria-busy");
            messageInput.focus();
        }
    }

    function hideWelcomeScreen() {
        const welcome = document.getElementById("welcomeScreen");

        if (welcome) {
            welcome.hidden = true;
        }
    }

    function showWelcomeScreen() {
        const welcome = document.getElementById("welcomeScreen");

        if (welcome) {
            welcome.hidden = false;
        }
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("visible");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
        }
    }

    // -----------------------------------------------------
    // 4. Create chat messages safely
    // -----------------------------------------------------

    function addMessage(role, content) {
        hideWelcomeScreen();

        const isUser = role === "user";

        const message = document.createElement("div");
        message.className = isUser
            ? "message user"
            : "message assistant";

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = isUser ? "You" : "AI";
        avatar.setAttribute(
            "aria-label",
            isUser ? "Your message" : ASSISTANT_NAME
        );

        const messageContent = document.createElement("div");
        messageContent.className = "message-content";

        const messageName = document.createElement("span");
        messageName.className = "message-name";
        messageName.textContent = isUser ? "You" : ASSISTANT_NAME;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        // Use textContent to prevent user messages or API replies
        // from being interpreted as executable HTML.
        bubble.textContent = String(content ?? "");

        const time = document.createElement("span");
        time.className = "message-time";
        time.textContent = new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit"
        }).format(new Date());

        messageContent.append(messageName, bubble, time);
        message.append(avatar, messageContent);

        chatMessages.appendChild(message);
        scrollToBottom();

        return message;
    }

    // -----------------------------------------------------
    // 5. Typing indicator
    // -----------------------------------------------------

    function showTypingIndicator() {
        hideWelcomeScreen();

        removeTypingIndicator();

        typingElement = document.createElement("div");
        typingElement.className = "message assistant";
        typingElement.setAttribute("aria-label", "AI is responding");

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "AI";

        const content = document.createElement("div");
        content.className = "message-content";

        const name = document.createElement("span");
        name.className = "message-name";
        name.textContent = ASSISTANT_NAME;

        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";
        indicator.setAttribute("role", "status");
        indicator.setAttribute("aria-label", "Generating response");

        for (let i = 0; i < 3; i += 1) {
            indicator.appendChild(document.createElement("span"));
        }

        content.append(name, indicator);
        typingElement.append(avatar, content);

        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        if (typingElement) {
            typingElement.remove();
            typingElement = null;
        }
    }

    // -----------------------------------------------------
    // 6. Error messages
    // -----------------------------------------------------

    function showError(message) {
        const errorElement = document.createElement("div");
        errorElement.className = "chat-error";
        errorElement.setAttribute("role", "alert");
        errorElement.textContent = message;

        chatMessages.appendChild(errorElement);
        scrollToBottom();
    }

    // -----------------------------------------------------
    // 7. Send message to Flask
    // -----------------------------------------------------

    async function sendMessage(rawMessage) {
        const message = String(rawMessage ?? "").trim();

        if (!message || isSending) {
            return;
        }

        // Display the user's message immediately.
        addMessage("user", message);

        // Save the current conversation history before the request.
        const previousHistory = conversationHistory.slice();

        conversationHistory.push({
            role: "user",
            content: message
        });

        // Keep recent context within a reasonable size.
        conversationHistory = conversationHistory.slice(
            -MAX_HISTORY_MESSAGES
        );

        messageInput.value = "";
        messageInput.style.height = "auto";

        setSendingState(true);
        showTypingIndicator();

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    message: message,
                    history: previousHistory.slice(-MAX_HISTORY_MESSAGES)
                })
            });

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response. " +
                    "Check your Flask terminal."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    `The AI service returned HTTP ${response.status}.`
                );
            }

            if (typeof data.reply !== "string" || !data.reply.trim()) {
                throw new Error(
                    "The server returned an empty reply. " +
                    "Check your Flask /chat endpoint."
                );
            }

            removeTypingIndicator();

            addMessage("assistant", data.reply);

            conversationHistory.push({
                role: "assistant",
                content: data.reply
            });

            conversationHistory = conversationHistory.slice(
                -MAX_HISTORY_MESSAGES
            );

        } catch (error) {
            removeTypingIndicator();

            console.error("ShopAssist AI chat error:", error);

            showError(
                error.message ||
                "Unable to connect to ShopAssist AI. Please try again."
            );

            // Remove the unsuccessful user turn from the history.
            conversationHistory = previousHistory;

        } finally {
            setSendingState(false);
        }
    }

    // -----------------------------------------------------
    // 8. Form submission
    // -----------------------------------------------------

    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (isSending) {
            return;
        }

        sendMessage(messageInput.value);
    });

    // Enter sends; Shift + Enter creates a new line.
    messageInput.addEventListener("keydown", (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {
            event.preventDefault();

            if (chatForm.requestSubmit) {
                chatForm.requestSubmit();
            } else {
                sendMessage(messageInput.value);
            }
        }
    });

    // Automatically expand the message box as text is entered.
    messageInput.addEventListener("input", () => {
        messageInput.style.height = "auto";

        messageInput.style.height =
            Math.min(messageInput.scrollHeight, 150) + "px";
    });

    // -----------------------------------------------------
    // 9. Suggested questions and sidebar prompts
    // -----------------------------------------------------

    document.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.getAttribute("data-prompt");

            if (!prompt || isSending) {
                return;
            }

            closeSidebar();
            sendMessage(prompt);
        });
    });

    // -----------------------------------------------------
    // 10. Start a new conversation
    // -----------------------------------------------------

    function startNewChat() {
        if (isSending) {
            return;
        }

        conversationHistory = [];

        removeTypingIndicator();

        // Remove generated messages and errors, but preserve
        // the original welcome screen.
        chatMessages.querySelectorAll(
            ".message, .chat-error, .user-message, " +
            ".assistant-message, .bot-message"
        ).forEach((element) => {
            element.remove();
        });

        showWelcomeScreen();

        messageInput.value = "";
        messageInput.style.height = "auto";

        closeSidebar();
        messageInput.focus();
    }

    if (newChatBtn) {
        newChatBtn.addEventListener("click", startNewChat);
    }

    if (headerNewChatBtn) {
        headerNewChatBtn.addEventListener("click", startNewChat);
    }

    // -----------------------------------------------------
    // 11. Mobile sidebar
    // -----------------------------------------------------

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("open");

            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle("visible", isOpen);
            }

            sidebarToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    // -----------------------------------------------------
    // 12. Correct the chat header branding
    // -----------------------------------------------------

    // This explicitly updates the heading in the current HTML.
    // The CSS and icon are left unchanged.
    const assistantHeading = document.querySelector(
        ".chat-panel-header .assistant-identity h2"
    );

    if (assistantHeading) {
        assistantHeading.textContent = ASSISTANT_NAME;
    }

    // Keep the welcome screen and input ready on initial load.
    showWelcomeScreen();

    console.info(`${ASSISTANT_NAME} frontend initialized.`);
});
