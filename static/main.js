class ChatApp {
    constructor() {
        this.currentSessionId = null;
        this.isProcessing = false;
        this.messageHistory = [];
        this.typingSpeed = 10; // Milliseconds between each character
        
        // Initialize UI elements
        this.initializeUI();
        // Bind event listeners
        this.bindEvents();
    }

    initializeUI() {
        this.elements = {
            channelInput: document.getElementById('channel-input'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            chatContainer: document.getElementById('chat-container'),
            processButton: document.getElementById('process-channel-btn'),
            output: document.getElementById('output')
        };

        // Disable chat interface initially
        this.elements.messageInput.disabled = true;
        this.elements.sendButton.disabled = true;
    }

    bindEvents() {
        // Handle Enter key in message input
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Handle channel processing
        this.elements.processButton.addEventListener('click', () => this.processChannel());
        
        // Handle send button click
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());
    }

    loadAndTypeText(text) {
        // Clear previous content
        this.elements.output.textContent = '';
        let currentChar = 0;
        
        // Function to type each character
        const typeChar = () => {
            if (currentChar < text.length) {
                this.elements.output.textContent += text[currentChar];
                currentChar++;
                setTimeout(typeChar, this.typingSpeed);
            }
        };
        
        // Start typing
        typeChar();
    }

    

    addMessage(sender, text, className = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender.toLowerCase()}-message ${className}`;
        messageDiv.textContent = text;
        this.elements.chatContainer.appendChild(messageDiv);
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;

        // If it's a bot message, type it out in the output area
        if (sender.toLowerCase() === "bot") {
            this.loadAndTypeText(text);
        }
    }
    

    // addMessage(sender, text, className = '') {
    //     const messageDiv = document.createElement('div');
    //     messageDiv.className = `message ${sender.toLowerCase()}-message ${className}`;
    //     messageDiv.textContent = text;
    //     this.elements.chatContainer.appendChild(messageDiv);
    //     this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;

    //     // If it's a bot message, type it out in the output area
    //     if (sender === "Bot") {
    //         this.loadAndTypeText(text);
    //     }
    // }

    async processChannel() {
        if (this.isProcessing) return;
        
        const channelName = this.elements.channelInput.value.trim();
        if (!channelName) {
            this.addMessage("System", "Please enter a channel name.", "error-message");
            return;
        }

        if (channelName != "NJFamilyChurch") {
            this.addMessage("System", "Please Enter NJFamilyChurch.", "error-message");
            return;
        }
        this.isProcessing = true;
        this.elements.processButton.disabled = true;
        this.addMessage("System", "Processing channel...", "loading");

        try {
            const response = await fetch('http://localhost:8000/api/channel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ channel_name: channelName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.currentSessionId = data.session_id;

            // Enable chat interface
            this.elements.messageInput.disabled = false;
            this.elements.sendButton.disabled = false;

            this.addMessage("System", "Channel processed successfully! You can now start chatting about the channel's content.", "success-message");
        } catch (error) {
            console.error('Error:', error);
            this.addMessage("System", `Error processing channel: ${error.message}`, "error-message");
        } finally {
            this.isProcessing = false;
            this.elements.processButton.disabled = false;
            // Remove loading message
            const loadingMessage = this.elements.chatContainer.querySelector('.loading');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        }
    }

    async sendMessage() {
        if (!this.currentSessionId || this.isProcessing) return;
    
        const message = this.elements.messageInput.value.trim();
        if (!message) return;
    
        // Add user message to chat
        this.addMessage("User", message);
        this.elements.messageInput.value = '';
        this.isProcessing = true;
        this.elements.sendButton.disabled = true;
        this.elements.messageInput.disabled = true;  // Also disable input while processing
    
        try {
            const response = await fetch(`http://localhost:8000/api/chat/${this.currentSessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });
    
            const data = await response.json();  // Parse response first
    
            if (!response.ok) {
                // If the server returns an error message, use it
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }
    
            // Only add bot message if we have a response
            if (data.response) {
                this.addMessage("Bot", data.response);
            } else {
                throw new Error("No response received from bot");
            }
    
        } catch (error) {
            console.error('Error:', error);
            this.addMessage("System", `Error: ${error.message}`, "error-message");
        } finally {
            this.isProcessing = false;
            this.elements.sendButton.disabled = false;
            this.elements.messageInput.disabled = false;  // Re-enable input
        }
    }

    // async sendMessage() {
    //     if (!this.currentSessionId || this.isProcessing) return;

    //     const message = this.elements.messageInput.value.trim();
    //     if (!message) return;

    //     // Add user message to chat
    //     this.addMessage("User", message, "user-message");
    //     this.elements.messageInput.value = '';
    //     this.isProcessing = true;
    //     this.elements.sendButton.disabled = true;

    //     try {
    //         const response = await fetch(`http://localhost:8000/api/chat/${this.currentSessionId}`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({ message: message })
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         this.addMessage("Bot", data.response, "bot-message");
    //     } catch (error) {
    //         console.error('Error:', error);
    //         this.addMessage("System", "Error sending message. Please try again.", "error-message");
    //     } finally {
    //         this.isProcessing = false;
    //         this.elements.sendButton.disabled = false;
    //     }
    // }

    
}



// Initialize the app when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});

