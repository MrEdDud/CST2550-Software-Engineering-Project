// matches.js - chat page with match list, messaging and polling

let matches = [];
let currentMatch = null;
let currentMessages = [];
let messagePollingInterval = null;
let isTyping = false;
let typingTimeout = null;
let lastTypingIndicator = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    try {
        await loadMatches();
        await updateUnreadBadge();
        
        startMessagePolling();
        
        setupTypingIndicator();
        
        document.body.style.opacity = '1';
        
    } catch (error) {
        console.error('Error initializing:', error);
        document.body.style.opacity = '1';
    }
});

// fetch matches list from api
async function loadMatches() {
    const matchesList = document.getElementById('matchesList');
    const noMatches = document.getElementById('noMatches');
    
    matchesList.innerHTML = `
        <div class="match-item skeleton-item">
            <div class="skeleton" style="width: 56px; height: 56px; border-radius: 50%;"></div>
            <div style="flex: 1; margin-left: 12px;">
                <div class="skeleton" style="width: 60%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 80%; height: 12px;"></div>
            </div>
        </div>
        <div class="match-item skeleton-item">
            <div class="skeleton" style="width: 56px; height: 56px; border-radius: 50%;"></div>
            <div style="flex: 1; margin-left: 12px;">
                <div class="skeleton" style="width: 50%; height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 70%; height: 12px;"></div>
            </div>
        </div>
    `;
    
    try {
        matches = await getMatches();
        
        if (matches.length === 0) {
            matchesList.innerHTML = '';
            noMatches.classList.remove('hidden');
        } else {
            noMatches.classList.add('hidden');
            renderMatches();
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        matchesList.innerHTML = `
            <div class="loading-matches">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #e74c3c;"></i>
                <p>Error loading matches</p>
                <button class="btn btn-sm btn-primary" onclick="loadMatches()" style="margin-top: 10px;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}

// display matches sorted by most recent activity
function renderMatches() {
    const matchesList = document.getElementById('matchesList');
    
    const sortedMatches = [...matches].sort((a, b) => {
        const timeA = new Date(a.lastMessage?.sentAt || a.matchedAt);
        const timeB = new Date(b.lastMessage?.sentAt || b.matchedAt);
        return timeB - timeA;
    });
    
    matchesList.innerHTML = sortedMatches.map(match => {
        const isOnline = Math.random() > 0.5; // Simulated online status
        const photo = match.matchedUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=56';
        
        return `
            <div class="match-item ${currentMatch?.id === match.id ? 'active' : ''}" 
                 onclick="selectMatch(${match.id})"
                 data-match-id="${match.id}">
                <div class="match-avatar-container">
                    <img src="${photo}" 
                         alt="${match.matchedUser.name}" 
                         class="match-avatar">
                    ${isOnline ? '<span class="online-indicator"></span>' : ''}
                </div>
                <div class="match-info">
                    <h4 class="match-name">
                        ${match.matchedUser.name}
                        ${match.matchedUser.isVerified ? '<i class="fas fa-check-circle verified-badge-sm"></i>' : ''}
                    </h4>
                    <p class="match-preview ${match.unreadCount > 0 ? 'unread' : ''}">
                        ${match.lastMessage ? 
                            (match.lastMessage.isMine ? '<i class="fas fa-check-double"></i> ' : '') + truncateText(match.lastMessage.content, 30) 
                            : '<span class="new-match">New match! Say hello 👋</span>'}
                    </p>
                </div>
                <div class="match-meta">
                    <span class="match-time">${formatRelativeTime(match.lastMessage?.sentAt || match.matchedAt)}</span>
                    ${match.unreadCount > 0 ? `<span class="match-unread">${match.unreadCount}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// opens a chat when clicking on a match
async function selectMatch(matchId) {
    currentMatch = matches.find(m => m.id === matchId);
    if (!currentMatch) return;
    
    vibrate([30]);
    
    document.querySelectorAll('.match-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.matchId) === matchId);
    });
    
    const placeholder = document.getElementById('chatPlaceholder');
    const container = document.getElementById('chatContainer');
    
    placeholder.classList.add('hidden');
    container.classList.remove('hidden');
    container.style.animation = 'fadeIn 0.3s ease-out';
    
    const photo = currentMatch.matchedUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=48';
    document.getElementById('chatAvatar').src = photo;
    document.getElementById('chatUserName').textContent = currentMatch.matchedUser.name;
    
    const statusEl = document.querySelector('.chat-status');
    if (statusEl) {
        const isOnline = Math.random() > 0.5;
        statusEl.innerHTML = isOnline 
            ? '<span class="status-online"><i class="fas fa-circle"></i> Online</span>'
            : '<span class="status-offline">Last seen recently</span>';
    }
    
    await loadMessages();
    
    currentMatch.unreadCount = 0;
    renderMatches();
    updateUnreadBadge();
    
    document.getElementById('messageInput')?.focus();
}

async function loadMessages() {
    if (!currentMatch) return;
    
    const messagesContainer = document.getElementById('chatMessages');
    
    messagesContainer.innerHTML = `
        <div class="loading-messages">
            <div class="typing-indicator" style="opacity: 1;">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    try {
        currentMessages = await getMessages(currentMatch.id);
        renderMessages();
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #e74c3c;"></i>
                <p>Error loading messages</p>
                <button class="btn btn-sm btn-primary" onclick="loadMessages()" style="margin-top: 10px;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}

// render chat bubbles for the current conversation
function renderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    const userId = getUserId();
    
    if (currentMessages.length === 0) {
        const photo = currentMatch.matchedUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100';
        messagesContainer.innerHTML = `
            <div class="chat-start">
                <img src="${photo}" alt="${currentMatch.matchedUser.name}" class="chat-start-avatar">
                <h3>You matched with ${currentMatch.matchedUser.name}!</h3>
                <p>Say something nice to start the conversation 💕</p>
                <div class="conversation-starters">
                    <button class="starter-btn" onclick="sendQuickMessage('Hey ${currentMatch.matchedUser.name}! 👋')">
                        Hey! 👋
                    </button>
                    <button class="starter-btn" onclick="sendQuickMessage('I love your profile!')">
                        Love your profile! 😍
                    </button>
                    <button class="starter-btn" onclick="sendQuickMessage('What are you looking for here?')">
                        What brings you here?
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    let lastDate = null;
    let html = '';
    
    currentMessages.forEach((msg, index) => {
        const msgDate = new Date(msg.sentAt).toDateString();
        
        if (msgDate !== lastDate) {
            html += `<div class="message-date-separator">${formatDateSeparator(msg.sentAt)}</div>`;
            lastDate = msgDate;
        }
        
        const prevMsg = currentMessages[index - 1];
        const isConsecutive = prevMsg && prevMsg.isMine === msg.isMine && 
            (new Date(msg.sentAt) - new Date(prevMsg.sentAt)) < 60000;
        
        html += `
            <div class="message ${msg.isMine ? 'sent' : 'received'} ${isConsecutive ? 'consecutive' : ''}" 
                 data-message-id="${msg.id}">
                <div class="message-content">
                    ${formatMessageContent(msg.content)}
                </div>
                <div class="message-time">
                    ${formatMessageTime(msg.sentAt)}
                    ${msg.isMine ? `<i class="fas fa-check-double ${msg.isRead ? 'read' : ''}"></i>` : ''}
                </div>
            </div>
        `;
    });
    
    html += `<div id="typingIndicator" class="message received typing-message" style="display: none;">
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    </div>`;
    
    messagesContainer.innerHTML = html;
}

// send message with optimistic UI update
async function handleSendMessage(event) {
    event.preventDefault();
    
    if (!currentMatch) return;
    
    const input = document.getElementById('messageInput');
    const sendBtn = document.querySelector('.send-btn');
    const content = input.value.trim();
    
    if (!content) return;
    
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    input.value = '';
    
    const tempMessage = {
        id: 'temp-' + Date.now(),
        content: content,
        isMine: true,
        sentAt: new Date().toISOString(),
        isRead: false
    };
    currentMessages.push(tempMessage);
    renderMessages();
    scrollToBottom();
    
    vibrate([20]);
    
    try {
        const message = await sendMessage(currentMatch.id, content);
        
        if (message) {
            const tempIndex = currentMessages.findIndex(m => m.id === tempMessage.id);
            if (tempIndex >= 0) {
                currentMessages[tempIndex] = message;
            }
            renderMessages();
            scrollToBottom();
            
            currentMatch.lastMessage = message;
            renderMatches();
            
            playSound('send');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        
        currentMessages = currentMessages.filter(m => m.id !== tempMessage.id);
        renderMessages();
        input.value = content;
        
        showToast('Failed to send message. Please try again.', 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

async function sendQuickMessage(content) {
    const input = document.getElementById('messageInput');
    input.value = content;
    document.querySelector('.message-form').dispatchEvent(new Event('submit'));
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function setupTypingIndicator() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    
    input.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        isTyping = true;
        
        typingTimeout = setTimeout(() => {
            isTyping = false;
        }, 2000);
    });
}

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
        scrollToBottom();
        
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }
}

// opens a modal showing the matched user's profile
function viewProfile() {
    if (!currentMatch) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'chatProfileModal';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    const photo = currentMatch.matchedUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400';
    const interests = currentMatch.matchedUser.interests || [];
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <button class="modal-close" onclick="this.closest('.modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${photo}" alt="${currentMatch.matchedUser.name}" style="width: 100%; height: 300px; object-fit: cover; border-radius: var(--radius-lg) var(--radius-lg) 0 0;">
            <div style="padding: 24px;">
                <h2 style="margin-bottom: 8px;">
                    ${currentMatch.matchedUser.name}, ${currentMatch.matchedUser.age}
                    <i class="fas fa-check-circle verified-badge"></i>
                </h2>
                <p style="color: var(--text-muted); margin-bottom: 16px;">
                    <i class="fas fa-map-marker-alt"></i>
                    ${currentMatch.matchedUser.location || 'Nearby'}
                </p>
                <p style="margin-bottom: 16px;">${currentMatch.matchedUser.bio || 'No bio yet'}</p>
                ${interests.length > 0 ? `
                    <div class="interest-tags">
                        ${interests.map(i => `<span class="interest-tag">${i}</span>`).join('')}
                    </div>
                ` : ''}
                <p style="text-align: center; color: var(--text-muted); margin-top: 16px; font-size: 14px;">
                    <i class="fas fa-heart" style="color: var(--primary);"></i>
                    Matched ${formatRelativeTime(currentMatch.matchedAt)}
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// unmatch confirmation dialog
async function handleUnmatch() {
    if (!currentMatch) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'unmatchConfirmModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 350px; text-align: center; padding: 32px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">💔</div>
            <h3 style="margin-bottom: 8px;">Unmatch with ${currentMatch.matchedUser.name}?</h3>
            <p style="color: var(--text-muted); margin-bottom: 24px;">
                This will remove your match and delete all messages. This cannot be undone.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                    Cancel
                </button>
                <button class="btn btn-primary" style="background: #e74c3c;" onclick="confirmUnmatch()">
                    <i class="fas fa-heart-broken"></i> Unmatch
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

async function confirmUnmatch() {
    const modal = document.getElementById('unmatchConfirmModal');
    if (modal) modal.remove();
    
    if (!currentMatch) return;
    
    try {
        await unmatch(currentMatch.id);
        
        showToast(`You've unmatched with ${currentMatch.matchedUser.name}`, 'info');
        
        matches = matches.filter(m => m.id !== currentMatch.id);
        currentMatch = null;
        
        document.getElementById('chatPlaceholder').classList.remove('hidden');
        document.getElementById('chatContainer').classList.add('hidden');
        
        if (matches.length === 0) {
            document.getElementById('noMatches').classList.remove('hidden');
            document.getElementById('matchesList').innerHTML = '';
        } else {
            renderMatches();
        }
    } catch (error) {
        console.error('Error unmatching:', error);
        showToast('Failed to unmatch. Please try again.', 'error');
    }
}

// polls for new messages every 3 seconds
function startMessagePolling() {
    messagePollingInterval = setInterval(async () => {
        if (currentMatch) {
            try {
                const newMessages = await getMessages(currentMatch.id);
                
                if (newMessages.length !== currentMessages.length) {
                    const hasNewIncoming = newMessages.some(nm => 
                        !nm.isMine && !currentMessages.find(cm => cm.id === nm.id)
                    );
                    
                    currentMessages = newMessages;
                    renderMessages();
                    scrollToBottom();
                    
                    if (hasNewIncoming) {
                        playSound('receive');
                        vibrate([50, 50, 50]);
                    }
                }
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        }
        
        try {
            const newMatches = await getMatches();
            if (JSON.stringify(newMatches) !== JSON.stringify(matches)) {
                matches = newMatches;
                renderMatches();
                updateUnreadBadge();
            }
        } catch (error) {
            console.error('Error polling matches:', error);
        }
    }, 3000);
}

window.addEventListener('beforeunload', () => {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
});

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// sanitise user text before rendering
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// format message text - linkify urls and convert text emoticons
function formatMessageContent(text) {
    let escaped = escapeHtml(text);
    
    escaped = escaped.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    
    const emojis = {
        ':)': '😊', ':D': '😄', ';)': '😉', '<3': '❤️',
        ':P': '😛', ':(': '😢', ':o': '😮', 'xD': '😂'
    };
    Object.entries(emojis).forEach(([code, emoji]) => {
        escaped = escaped.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
    });
    
    return escaped;
}

function formatDateSeparator(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
}

// keyboard shortcuts - enter to send, esc to go back
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && document.activeElement.id === 'messageInput') {
        e.preventDefault();
        document.querySelector('.message-form').dispatchEvent(new Event('submit'));
    }
    
    if (e.key === 'Escape' && currentMatch && isMobile()) {
        backToList();
    }
});

function backToList() {
    currentMatch = null;
    document.getElementById('chatPlaceholder').classList.remove('hidden');
    document.getElementById('chatContainer').classList.add('hidden');
    document.querySelectorAll('.match-item').forEach(item => item.classList.remove('active'));
}

window.handleSendMessage = handleSendMessage;
window.handleUnmatch = handleUnmatch;
window.confirmUnmatch = confirmUnmatch;
window.selectMatch = selectMatch;
window.viewProfile = viewProfile;
window.sendQuickMessage = sendQuickMessage;
window.backToList = backToList;