
const API_BASE_URL = '/api';

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

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            const isAuthEndpoint = endpoint.startsWith('/auth/');
            if (!isAuthEndpoint) {
                removeToken();
                window.location.href = '/login.html';
                return null;
            }
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        let data = null;

        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                console.warn('apiRequest: failed to parse JSON response for', url, e);
                data = null;
            }
        } else {
            try {
                const text = await response.text();
                data = text || null;
            } catch (e) {
                data = null;
            }
        }

        if (!response.ok) {
            const message = (data && data.message) ? data.message : (typeof data === 'string' ? data : 'Request failed');
            throw new Error(message);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}


async function login(username, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    if (data) {
        setUserData(data);
    }
    
    return data;
}

async function register(userData) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (data) {
        setUserData(data);
    }
    
    return data;
}

function logout() {
    removeToken();
    window.location.href = '/login.html';
}


async function getMyProfile() {
    return await apiRequest('/profiles/me');
}

async function getProfile(profileId) {
    return await apiRequest(`/profiles/${profileId}`);
}

async function updateProfile(profileData) {
    return await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
}

async function getDiscoveryProfiles(count = 10, filters = {}) {
    const params = new URLSearchParams({ count: count.toString() });
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.minAge) params.set('minAge', filters.minAge.toString());
    if (filters.maxAge) params.set('maxAge', filters.maxAge.toString());
    if (filters.hairColor) params.set('hairColor', filters.hairColor);
    if (filters.skinTone) params.set('skinTone', filters.skinTone);
    if (filters.eyeColor) params.set('eyeColor', filters.eyeColor);
    if (filters.bodyType) params.set('bodyType', filters.bodyType);
    if (filters.ethnicity) params.set('ethnicity', filters.ethnicity);
    if (filters.smoking) params.set('smoking', filters.smoking);
    if (filters.drinking) params.set('drinking', filters.drinking);
    if (filters.hobby) params.set('hobby', filters.hobby);
    if (filters.interest) params.set('interest', filters.interest);
    return await apiRequest(`/profiles/discover?${params.toString()}`);
}


async function swipeProfile(targetUserId, isLike, isSuperLike = false) {
    return await apiRequest('/matches/swipe', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, isLike, isSuperLike })
    });
}

async function getMatches() {
    return await apiRequest('/matches');
}

async function getLikesReceived() {
    return await apiRequest('/matches/likes');
}

async function unmatch(matchId) {
    return await apiRequest(`/matches/${matchId}`, {
        method: 'DELETE'
    });
}


async function sendMessage(matchId, content) {
    return await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({ matchId, content })
    });
}

async function getMessages(matchId) {
    return await apiRequest(`/messages/match/${matchId}`);
}

async function getUnreadCount() {
    const data = await apiRequest('/messages/unread-count');
    return data?.count || 0;
}

async function deleteMessage(messageId) {
    return await apiRequest(`/messages/${messageId}`, {
        method: 'DELETE'
    });
}


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

function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toggleNav() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

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

function showToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
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
    
    toast.offsetHeight;
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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

function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

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

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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