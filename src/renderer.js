
let currentAssistantDiv = null;
document.getElementById('send-button').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        renderMessage(message, 'user');
        messageInput.value = '';
        await window.DealwithMessage.sendMessage(message);
        currentAssistantDiv = null; // 這輪結束了，重置，準備接下一輪的新泡泡
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
    return messageDiv;
}

window.DealwithMessage.onChunk((chunkText) => {
  if (currentAssistantDiv === null) {
    // 這是這則回覆的第一段文字，還沒有泡泡，先建立一個
    currentAssistantDiv = renderMessage(chunkText, 'assistant');
  } else {
    // 已經有泡泡了，把新文字接到後面
    currentAssistantDiv.textContent += chunkText;
  }
});