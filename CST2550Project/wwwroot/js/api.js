// api service layer - uses localStorage via localdb.js instead of a server

// token & user data helpers
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
}

function getUserId() {
    return parseInt(localStorage.getItem('userId')) || 0;
}

function getUsername() {
    return localStorage.getItem('username') || '';
}

function setUserData(data) {
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    if (data.token) {
        setToken(data.token);
    }
}

function isAuthenticated() {
    return !!getToken();
}

// redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// auth - powered by localdb
async function login(username, password) {
    const data = dbLogin(username, password);
    if (data) {
        setUserData(data);
    }
    return data;
}

async function register(userData) {
    const data = dbRegister(userData);
    if (data) {
        setUserData(data);
    }
    return data;
}

function logout() {
    removeToken();
    window.location.href = '/login.html';
}

// profile - reads from localStorage
async function getMyProfile() {
    return dbGetMyProfile(getUserId());
}

async function getProfile(profileId) {
    return dbGetProfileById(profileId);
}

async function updateProfile(profileData) {
    return dbUpdateProfile(getUserId(), profileData);
}

// discovery - filters handled by localdb
async function getDiscoveryProfiles(count = 10, filters = {}) {
    filters.count = count;
    return dbGetDiscoveryProfiles(getUserId(), filters);
}

// match & swipe
async function swipeProfile(targetUserId, isLike, isSuperLike = false) {
    return dbSwipe(getUserId(), targetUserId, isLike, isSuperLike);
}

async function getMatches() {
    return dbGetMatches(getUserId());
}

async function getLikesReceived() {
    return dbGetLikesReceived(getUserId());
}

async function unmatch(matchId) {
    return dbUnmatch(getUserId(), matchId);
}

// messaging
async function sendMessage(matchId, content) {
    return dbSendMessage(getUserId(), matchId, content);
}

async function getMessages(matchId) {
    return dbGetMessages(getUserId(), matchId);
}

async function getUnreadCount() {
    return dbGetUnreadCount(getUserId());
}

async function deleteMessage(messageId) {
    return dbDeleteMessage(getUserId(), messageId);
}

// time formatting helpers
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'Just now';
    }
    
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
    }
    
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
    
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }
    
    return date.toLocaleDateString();
}

// format time as hh:mm for chat messages
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// nav toggle for mobile
function toggleNav() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

// updates the unread messages badge on the matches tab
async function updateUnreadBadge() {
    try {
        const count = await getUnreadCount();
        const badge = document.getElementById('matchBadge');
        if (badge) {
            badge.textContent = count > 0 ? count : '';
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

// toast notification popup - slides in from top-right, smooth exit
// notifications store to power the notifications panel and dot
const _notifications = [];

// Add a notification and update UI (dot, panel list)
function _pushNotification(message, type = 'info') {
    const item = { id: Date.now(), message, type, ts: new Date().toISOString(), read: false };
    _notifications.unshift(item);
    // keep small history
    if (_notifications.length > 50) _notifications.pop();
    _updateNotificationDot();
    renderNotifications();
}

// update the small red dot on the notification button
function _updateNotificationDot() {
    const dot = document.getElementById('notificationDot');
    if (!dot) return;
    const unread = _notifications.filter(n => !n.read).length;
    if (unread > 0) {
        dot.classList.add('show');
        dot.setAttribute('data-count', unread);
    } else {
        dot.classList.remove('show');
        dot.removeAttribute('data-count');
    }
}

// show notifications in panel
function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    list.innerHTML = '';
    
    // show empty message if no notifications
    if (_notifications.length === 0) {
        list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
        return;
    }
    
    // add each notification to the list
    for (const n of _notifications) {
        const el = document.createElement('div');
        el.className = 'notification-item';
        const iconName = n.type === 'success' ? 'check-circle' : n.type === 'error' ? 'exclamation-circle' : n.type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        el.innerHTML = `
            <i class="fas fa-${iconName}"></i>
            <div class="n-content">
                <div class="n-title">${n.message}</div>
                <div class="n-meta">${formatRelativeTime(n.ts)}</div>
            </div>
        `;
        list.appendChild(el);
    }
}

// open/close notifications panel
function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    // mark as read when opened
    if (!panel.classList.contains('hidden')) {
        for (const n of _notifications) n.read = true;
        _updateNotificationDot();
    }
}

// show toast popup
function showToast(message, type = 'info') {
    // save to notifications
    try { _pushNotification(message, type); } catch (e) { }

    // remove old toast
    document.querySelectorAll('.toast').forEach(t => {
        t.classList.add('hide');
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    });
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // small delay for animation to work
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });
    
    // hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// confetti for matches
function createConfetti() {
    const colors = ['#FF4B6E', '#FF7B94', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// haptic feedback on supported devices
function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// simple audio feedback using web audio api
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'like':
                oscillator.frequency.value = 880;
                oscillator.type = 'sine';
                break;
            case 'match':
                oscillator.frequency.value = 1046;
                oscillator.type = 'sine';
                break;
            case 'message':
                oscillator.frequency.value = 660;
                oscillator.type = 'triangle';
                break;
            default:
                oscillator.frequency.value = 440;
        }
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
    }
}

// relative time like "2h ago", "Yesterday" etc
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
    });
}

// check if user is on a phone
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// delays function execution until user stops typing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Wire notification button and close button after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const notifBtn = document.getElementById('notificationBtn');
    const closeBtn = document.getElementById('closeNotifsBtn');
    if (notifBtn) notifBtn.addEventListener('click', toggleNotificationsPanel);
    if (closeBtn) closeBtn.addEventListener('click', toggleNotificationsPanel);
    // initial render and dot state
    _updateNotificationDot();
    renderNotifications();
});