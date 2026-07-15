document.getElementById('send-button').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        renderMessage(message, 'user');
        const assistantResponse = await window.DealwithMessage.sendMessage(message);
        renderMessage(assistantResponse, 'assistant');
        // Handle sending the message (e.g., append to messages container)
        messageInput.value = '';
    }
});


function renderMessage(message, sender) {
    const messageboxDiv = document.createElement('div');
    const messageDiv = document.createElement('div');
    messageboxDiv.classList.add('messagebox', sender === 'user' ? 'from-user' : 'from-assistant');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'assistant-message');
    messageboxDiv.appendChild(messageDiv);
    messageDiv.textContent = message;
    document.getElementById('messages').appendChild(messageboxDiv);
}

