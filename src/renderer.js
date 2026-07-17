let currentAssistantDiv = null;
let currentTokenCountDiv = null;     // 新增：跟 currentAssistantDiv 平行存在
let totalTokenCount = 0;             // 用來累計「從程式啟動到現在」的總 token 數

document.getElementById('send-button').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        renderMessage(message, 'user');
        messageInput.value = '';
        await window.DealwithMessage.sendMessage(message);
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

    const tokenCountDiv = document.createElement('div');
    tokenCountDiv.classList.add('token-count');
    messageboxDiv.appendChild(tokenCountDiv);

    return { messageDiv, tokenCountDiv };   // 修正：兩個都回傳，不再只回傳 messageDiv
}

window.DealwithMessage.onChunk((chunkText) => {
    if (currentAssistantDiv === null) {
        // 修正：解構賦值同時接住兩個 div
        const { messageDiv, tokenCountDiv } = renderMessage(chunkText, 'assistant');
        currentAssistantDiv = messageDiv;
        currentTokenCountDiv = tokenCountDiv;
    } else {
        currentAssistantDiv.textContent += chunkText;
    }
});

window.DealwithMessage.onTokenCount((tokenCount) => {
    // 修正：直接用手上握著的 currentTokenCountDiv，不用 getElementById 去找
    totalTokenCount += tokenCount;
    if (currentTokenCountDiv) {
        currentTokenCountDiv.textContent =
            `這則訊息消耗：${tokenCount} token\n累積消耗：${totalTokenCount} token`;
    }
});

window.DealwithMessage.onDone(() => {
    currentAssistantDiv = null;
    currentTokenCountDiv = null;   // 兩個都要重置，準備給下一輪用
});