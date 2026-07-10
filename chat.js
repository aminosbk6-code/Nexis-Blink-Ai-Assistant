const GROQ_API_KEY = "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";

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const historyList = document.querySelector('.history-list');
const modelSelect = document.getElementById('modelSelect');

let currentChatId = null;
let lastUserMessage = "";

// 🚀 1. Page Load Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderHistorySidebar();
  startNewChat(); 
});

// 🚀 2. LocalStorage Handler
function getChatHistory() {
  const history = localStorage.getItem("bk_chat_history");
  return history ? JSON.parse(history) : {};
}

function saveChatHistory(history) {
  localStorage.setItem("bk_chat_history", JSON.stringify(history));
}

// 🚀 3. Reset Engine for New Chats
function startNewChat() {
  currentChatId = "chat_" + Date.now();
  lastUserMessage = "";
  
  chatBox.innerHTML = `<div class="message bot-message"> <div class="message-text">Hello! Welcome to Nexis Blink AI, Kifach najem n3awnek lyom?😃</div> </div>`;
  
  document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
}

// 🚀 4. Wipe Out Local History
function clearAllHistory() {
  if (confirm("T7ebb tfassa5 el-historique mta3 el-chats l-kol?")) {
    localStorage.removeItem("bk_chat_history");
    renderHistorySidebar();
    startNewChat();
  }
}

// 🚀 5. Core Message Delivery Engine with Dynamic Fallback Routing
async function sendMessage(customMessage = null) {
  const message = customMessage ? customMessage.trim() : userInput.value.trim();
  if (!message) return;

  let selectedModel = modelSelect.value;
  const history = getChatHistory();
  let isBrandNewChat = false;

  if (!history[currentChatId]) {
    isBrandNewChat = true;
    const words = message.split(" ");
    const autoTitle = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
    
    history[currentChatId] = {
      title: autoTitle,
      messages: []
    };
  }

  if (!customMessage) {
    appendMessage(message, 'user');
    history[currentChatId].messages.push({ sender: 'user', text: message });
    lastUserMessage = message;
    userInput.value = '';
  }

  saveChatHistory(history);
  if (isBrandNewChat) renderHistorySidebar();

  appendMessage("Estanna Njewbek...", 'bot');
  const typingMessage = chatBox.lastChild;
  const bubble = typingMessage.querySelector('.message-text');
  
  bubble.innerHTML = `Estanna Njewbek <div class="typing-indicator"><span></span><span></span><span></span></div>`;

  let response;
  try {
    // 🎯 Attempt 1: Try using the user's selected model from the list
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: message }]
      })
    });

    // 🔄 Dynamic Fallback: If selected model throws an error, switch instantly to stable Llama 3.3
    if (!response.ok && selectedModel !== "llama-3.3-70b-versatile") {
      console.warn(`Model ${selectedModel} failed. Switching over automatically to stable Llama 3.3...`);
      selectedModel = "llama-3.3-70b-versatile";
      modelSelect.value = "llama-3.3-70b-versatile"; // Update the selection UI as well
      
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: message }]
        })
      });
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const botReply = data.choices[0].message.content;

    typingMessage.remove();
    appendMessage(botReply, 'bot');

    const updatedHistory = getChatHistory();
    if (updatedHistory[currentChatId]) {
      updatedHistory[currentChatId].messages.push({ sender: 'bot', text: botReply });
      saveChatHistory(updatedHistory);
    }

  } catch (error) {
    typingMessage.remove();
    appendMessage("Samahni, Famma error fi l-connexion bel API walla l-model hadha tawa overload.", 'bot');
    console.error(error);
  }
}

// 🚀 6. Message Bubble Visual Renderer
function appendMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${sender}-message`);

  const textDiv = document.createElement('div');
  textDiv.classList.add('message-text');
  textDiv.innerText = text;
  messageDiv.appendChild(textDiv);

  if (sender === 'bot' && !text.includes("Estanna Njewbek")) {
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('msg-actions');
    
    actionsDiv.innerHTML = `<button class="action-btn" onclick="copyMessage(this)" title="Copy text"><i class="far fa-copy"></i> Copy</button> <button class="action-btn" onclick="regenerateMessage()" title="Regenerate response"><i class="fas fa-redo-alt"></i> Retry</button>`;
    
    messageDiv.appendChild(actionsDiv);
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🚀 7. Sidebar Render Engine
function renderHistorySidebar() {
  historyList.innerHTML = "";
  const history = getChatHistory();

  Object.keys(history).reverse().forEach(chatId => {
    const chatData = history[chatId];
    
    const item = document.createElement('div');
    item.classList.add('history-item');
    if (chatId === currentChatId) item.classList.add('active');
    item.setAttribute('data-id', chatId);
    
    item.innerHTML = `<i class="far fa-comment-alt"></i> ${chatData.title}`;
    item.addEventListener('click', () => loadChat(chatId));
    
    historyList.appendChild(item);
  });
}

// 🚀 8. Session Restorer
function loadChat(chatId) {
  const history = getChatHistory();
  if (!history[chatId]) return;

  currentChatId = chatId;
  
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-id') === chatId) item.classList.add('active');
  });

  chatBox.innerHTML = "";
  const messages = history[chatId].messages;
  
  if (messages.length === 0) {
    chatBox.innerHTML = `<div class="message bot-message"> <div class="message-text">Hello! Welcome to Nexis Blink AI, Kifach najem n3awnek lyom?😃</div> </div>`;
  } else {
    messages.forEach(msg => {
      appendMessage(msg.text, msg.sender);
    });
  }
  
  const userMsgs = messages.filter(m => m.sender === 'user');
  lastUserMessage = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].text : "";
}

function copyMessage(button) {
  const textToCopy = button.closest('.message').querySelector('.message-text').innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    button.innerHTML = `<i class="fas fa-check" style="color: #00ffcc"></i> Copied!`;
    setTimeout(() => {
      button.innerHTML = `<i class="far fa-copy"></i> Copy`;
    }, 2000);
  });
}

function regenerateMessage() {
  if (lastUserMessage) {
    sendMessage(lastUserMessage);
  }
}

sendBtn.addEventListener('click', () => sendMessage());
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});