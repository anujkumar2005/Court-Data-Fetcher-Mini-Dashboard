function sanitizeOutput(text) {
  // Remove unwanted characters and clean up the text
  return text
    .replace(/[\*\$#@&]/g, '') // Remove *, $, #, @, & characters
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
    .replace(/###\s?(.*?)(\n|$)/g, '<h3>$1</h3>') // H3 Headers
    .replace(/##\s?(.*?)(\n|$)/g, '<h2>$1</h2>') // H2 Headers
    .replace(/#\s?(.*?)(\n|$)/g, '<h1>$1</h1>') // H1 Headers
    .replace(/\n\n/g, '<br><br>') // Double newlines to double breaks
    .replace(/\n/g, '<br>'); // Single newlines to breaks
}

async function submitCase() {
  const service = document.getElementById('service').value;
  const subject = document.getElementById('subject').value.trim();
  const description = document.getElementById('description').value.trim();
  const responseContainer = document.getElementById("responseContainer");
  const responseDiv = document.getElementById("response");
  const chatSection = document.getElementById("chatSection");

  if (!subject || !description) {
    alert("Please fill in both subject and description.");
    return;
  }

  // Hide chat section and reset
  chatSection.style.display = "none";
  document.getElementById("quickQuestions").innerHTML = "";
  document.getElementById("chatConversation").innerHTML = "";

  responseContainer.style.display = "block";
  responseDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Analyzing your case...</div>';

  try {
    const res = await fetch("http://localhost:8000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, subject, description })
    });
    const data = await res.json();
    
    // Display the cleaned response
    responseDiv.innerHTML = sanitizeOutput(data.response);
    
    // After displaying response, show chat section and load questions
    setTimeout(async () => {
      await loadQuickQuestions(subject, description);
      chatSection.style.display = "block";
    }, 1000);
    
  } catch (err) {
    console.error(err);
    responseDiv.innerHTML = "⚠️ Error: Unable to get a response from the server.";
  }
}

async function loadQuickQuestions(subject, description) {
  const quickQuestionsDiv = document.getElementById("quickQuestions");
  
  quickQuestionsDiv.innerHTML = '<div class="loading-questions">💡 Loading suggested questions...</div>';
  
  try {
    const res = await fetch("http://localhost:8000/suggest_questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description })
    });
    const data = await res.json();
    
    let questionsHTML = '<h5 class="questions-title">💡 Quick Questions:</h5><div class="questions-grid">';
    
    data.questions.forEach((question, index) => {
      // Clean and format the question for display
      const cleanQuestion = question
        .replace(/^["']|["']$/g, '') // Remove quotes at start/end
        .replace(/'/g, "&#39;")      // Escape single quotes
        .replace(/"/g, "&quot;")     // Escape double quotes
        .replace(/`/g, "&#96;")      // Escape backticks
        .trim();
      
      // Only add non-empty questions
      if (cleanQuestion) {
        questionsHTML += `
          <button class="question-btn" onclick="askQuestion(\`${cleanQuestion}\`)">
            <span class="question-icon">❓</span>
            <span class="question-text">${cleanQuestion}</span>
          </button>
        `;
      }
    });
    
    questionsHTML += '</div>';
    quickQuestionsDiv.innerHTML = questionsHTML;
    
    // Add custom question input after questions are loaded
    addCustomQuestionInput();
    
  } catch (err) {
    console.error(err);
    quickQuestionsDiv.innerHTML = '<div class="error-questions">❌ Failed to load questions</div>';
  }
}

async function askQuestion(question) {
  const subject = document.getElementById('subject').value.trim();
  const description = document.getElementById('description').value.trim();
  const chatConversation = document.getElementById("chatConversation");
  
  // Clean the question text for display
  const displayQuestion = question
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#96;/g, '`')
    .trim();
  
  // Don't process empty questions
  if (!displayQuestion) {
    return;
  }
  
  // Add user question to conversation
  const userMessage = `
    <div class="chat-message user-message">
      <div class="message-avatar">👤</div>
      <div class="message-content">
        <div class="message-header">
          <strong>You</strong>
          <span class="message-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="message-text">${displayQuestion}</div>
      </div>
    </div>
  `;
  
  chatConversation.innerHTML += userMessage;
  
  // Add loading for AI response
  const loadingId = 'aiLoading_' + Date.now();
  const loadingMessage = `
    <div class="chat-message ai-message" id="${loadingId}">
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="message-header">
          <strong>AI Legal Assistant</strong>
          <span class="message-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="message-text">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
          <span class="typing-text">Analyzing your question...</span>
        </div>
      </div>
    </div>
  `;
  
  chatConversation.innerHTML += loadingMessage;
  chatConversation.scrollTop = chatConversation.scrollHeight;
  
  try {
    // Send question along with original case context
    const contextualPrompt = `
      Original Case Subject: ${subject}
      Original Case Description: ${description}
      
      Follow-up Question: ${displayQuestion}
      
      Please provide a detailed answer to this follow-up question in the context of the original case. Be specific and helpful.
    `;
    
    const res = await fetch("http://localhost:8000/chat_followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question: contextualPrompt,
        subject: subject,
        description: description
      })
    });
    const data = await res.json();
    
    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Add AI response
    const aiMessage = `
      <div class="chat-message ai-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-header">
            <strong>AI Legal Assistant</strong>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="message-text">${sanitizeOutput(data.response)}</div>
        </div>
      </div>
    `;
    
    chatConversation.innerHTML += aiMessage;
    chatConversation.scrollTop = chatConversation.scrollHeight;
    
  } catch (err) {
    console.error(err);
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
    
    const errorMessage = `
      <div class="chat-message ai-message error-message">
        <div class="message-avatar">❌</div>
        <div class="message-content">
          <div class="message-header">
            <strong>Error</strong>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="message-text">Unable to get response. Please try again.</div>
        </div>
      </div>
    `;
    
    chatConversation.innerHTML += errorMessage;
    chatConversation.scrollTop = chatConversation.scrollHeight;
  }
}

// Add function to handle custom question input
function addCustomQuestionInput() {
  const quickQuestionsDiv = document.getElementById("quickQuestions");
  const customInputHTML = `
    <div class="custom-question-input" style="margin-top: 1rem;">
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input 
          type="text" 
          id="customQuestion" 
          placeholder="Type your own question..."
          class="form-input"
          style="flex: 1; margin: 0;"
          onkeypress="handleCustomQuestionKeypress(event)"
        />
        <button 
          onclick="askCustomQuestion()" 
          class="submit-btn" 
          style="width: auto; padding: 0.75rem 1.5rem; margin: 0;"
        >
          Ask 💬
        </button>
      </div>
    </div>
  `;
  
  if (!quickQuestionsDiv.innerHTML.includes('custom-question-input')) {
    quickQuestionsDiv.innerHTML += customInputHTML;
  }
}

function handleCustomQuestionKeypress(event) {
  if (event.key === 'Enter') {
    askCustomQuestion();
  }
}

function askCustomQuestion() {
  const customQuestionInput = document.getElementById('customQuestion');
  const question = customQuestionInput.value.trim();
  
  if (question) {
    askQuestion(question);
    customQuestionInput.value = '';
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const matchingLink = Array.from(document.querySelectorAll('.nav-link')).find(link =>
    link.textContent.toLowerCase().includes(pageId)
  );
  if (matchingLink) matchingLink.classList.add('active');
}

function selectService(serviceName, element) {
  document.getElementById('service').value = serviceName;
  document.querySelectorAll('.service-card').forEach(card => card.classList.remove('selected'));
  element.classList.add('selected');
}

// Automatically go to the Services page on "Get Started Now"
document.addEventListener("DOMContentLoaded", () => {
  const getStartedBtn = document.querySelector(".btn-primary");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      showPage('services');
    });
  }
});