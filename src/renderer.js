document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        console.log('Sending message:', message);
        const messageboxDiv = document.createElement('div');
        const messageDiv = document.createElement('div');
        messageboxDiv.classList.add('messagebox', 'from-user');
        messageDiv.classList.add('message','user-message');
        messageboxDiv.appendChild(messageDiv);
        messageDiv.textContent = message;
        document.getElementById('messages').appendChild(messageboxDiv);
        // Handle sending the message (e.g., append to messages container)
        messageInput.value = '';
    }
});