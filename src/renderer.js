
let currentAssistantDiv = null;
document.getElementById('send-button').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        renderMessage(message, 'user');
        messageInput.value = '';
        await window.DealwithMessage.sendMessage(message);
        // 這裡不要再重置 currentAssistantDiv 了
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
  console.log('[renderer] 收到 chunk:', JSON.stringify(chunkText), '目前 currentAssistantDiv 是否為 null:', currentAssistantDiv === null);
  if (currentAssistantDiv === null) {
    // 這是這則回覆的第一段文字，還沒有泡泡，先建立一個
    currentAssistantDiv = renderMessage(chunkText, 'assistant');
  } else {
    // 已經有泡泡了，把新文字接到後面
    currentAssistantDiv.textContent += chunkText;
  }
});

window.DealwithMessage.onDone(() => {
    currentAssistantDiv = null;
});