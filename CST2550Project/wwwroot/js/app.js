// app.js - main discovery page (swiping, explore, matches preview, settings)

// global state
let profiles = [];
let currentIndex = 0;
let currentProfile = null;
let myProfile = null;
let matchedProfile = null;
let isAnimating = false;
let currentPhotoIndex = 0;
let exploreProfiles = [];
let currentFilters = {
    query: '',
    category: null,
    minAge: 18,
    maxAge: 35,
    distance: 50,
    chips: []
};

// page init - load profile data and set up the UI
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    try {
        myProfile = await getMyProfile();
        
        await loadProfiles();
        
        await updateUnreadBadge();
        
    const sidebarNameEl = document.getElementById('sidebarName');
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    if (sidebarNameEl && myProfile) sidebarNameEl.textContent = myProfile.name || 'You';
    if (sidebarAvatar && myProfile && myProfile.profilePhotoUrl) sidebarAvatar.src = myProfile.profilePhotoUrl;
        
        document.body.style.opacity = '1';
        
        showToast(`Welcome back, ${myProfile.name}! 💕`, 'success');
        
    } catch (error) {
        console.error('Error initializing:', error);
        document.body.style.opacity = '1';
    }
});

// fetch profiles from the api with current filters
async function loadProfiles() {
    const cardStack = document.getElementById('cardStack');
    const emptyState = document.getElementById('emptyState');
    const actionButtons = document.getElementById('actionButtons');
    
    cardStack.innerHTML = `
        <div class="profile-card">
            <div class="skeleton" style="width: 100%; height: 380px;"></div>
            <div style="padding: 24px;">
                <div class="skeleton" style="width: 60%; height: 28px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 40%; height: 16px; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 100%; height: 40px;"></div>
            </div>
        </div>
    `;
    
    try {
        profiles = await getDiscoveryProfiles(10);
        currentIndex = 0;
        
        if (profiles.length === 0) {
            cardStack.innerHTML = '';
            emptyState.classList.remove('hidden');
            actionButtons.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            actionButtons.classList.remove('hidden');
            renderCards();
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
        cardStack.innerHTML = `
            <div class="loading-card">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e74c3c;"></i>
                <p>Error loading profiles. Please try again.</p>
                <button class="btn btn-primary" onclick="loadProfiles()">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}

// builds the tinder-style card stack
function renderCards() {
    const cardStack = document.getElementById('cardStack');
    cardStack.innerHTML = '';
    
    const cardsToShow = profiles.slice(currentIndex, currentIndex + 3);
    
    cardsToShow.forEach((profile, index) => {
        const card = createProfileCard(profile, index);
        cardStack.appendChild(card);
    });
    
    if (cardsToShow.length > 0) {
        currentProfile = cardsToShow[0];
        currentPhotoIndex = 0;
        setupSwipeGestures(cardStack.firstChild);
    }
}

// generates html for a single profile card
function createProfileCard(profile, stackIndex) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.style.zIndex = 10 - stackIndex;
    card.style.transform = `scale(${1 - stackIndex * 0.05}) translateY(${stackIndex * 10}px)`;
    card.style.opacity = stackIndex === 0 ? '1' : '0.7';
    
    const interests = profile.interests || [];
    const interestTags = interests.slice(0, 3).map(i => `<span class="card-tag">${i}</span>`).join('');
    
    const photos = profile.photos && profile.photos.length > 0 
        ? profile.photos 
        : [profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400'];
    
    const galleryDots = photos.length > 1 
        ? `<div class="gallery-dots">
            ${photos.map((_, i) => `<div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
           </div>` 
        : '';
    
    const distance = Math.floor(Math.random() * 15) + 1;
    
    card.innerHTML = `
        <div class="card-photos" data-photo-index="0">
            <img src="${photos[0]}" alt="${profile.name}" class="card-photo">
            ${photos.length > 1 ? `
                <div class="photo-nav photo-nav-left" onclick="prevPhoto(event)">
                    <i class="fas fa-chevron-left"></i>
                </div>
                <div class="photo-nav photo-nav-right" onclick="nextPhoto(event)">
                    <i class="fas fa-chevron-right"></i>
                </div>
            ` : ''}
            ${galleryDots}
        </div>
        <div class="card-gradient"></div>
        <div class="card-info">
            <div class="card-header">
                <h2 class="card-name">
                    ${profile.name}, ${profile.age}
                    <i class="fas fa-check-circle verified-badge"></i>
                </h2>
                <span class="distance-badge">
                    <i class="fas fa-map-marker-alt"></i>
                    ${distance} km away
                </span>
            </div>
            <p class="card-location">
                <i class="fas fa-briefcase"></i>
                ${profile.location || 'Somewhere nearby'}
            </p>
            <p class="card-bio">${profile.bio || 'Swipe right to find out more about me! 💕'}</p>
            ${interestTags ? `<div class="card-tags">${interestTags}</div>` : ''}
        </div>
        <button class="card-expand" onclick="showProfileDetail(${profile.id})" title="View full profile">
            <i class="fas fa-chevron-up"></i>
        </button>
        <div class="swipe-indicator like">
            <i class="fas fa-heart"></i>
            LIKE
        </div>
        <div class="swipe-indicator nope">
            <i class="fas fa-times"></i>
            NOPE
        </div>
        <div class="swipe-indicator superlike">
            <i class="fas fa-star"></i>
            SUPER LIKE
        </div>
    `;
    
    card.dataset.profileId = profile.id;
    card.dataset.userId = profile.userId;
    card.dataset.photos = JSON.stringify(photos);
    
    return card;
}

// photo gallery navigation on cards
function nextPhoto(event) {
    event.stopPropagation();
    const card = event.target.closest('.profile-card');
    navigatePhoto(card, 1);
}

function prevPhoto(event) {
    event.stopPropagation();
    const card = event.target.closest('.profile-card');
    navigatePhoto(card, -1);
}

function navigatePhoto(card, direction) {
    if (!card) return;
    
    const photos = JSON.parse(card.dataset.photos || '[]');
    if (photos.length <= 1) return;
    
    const photosContainer = card.querySelector('.card-photos');
    let index = parseInt(photosContainer.dataset.photoIndex) || 0;
    
    index += direction;
    if (index < 0) index = photos.length - 1;
    if (index >= photos.length) index = 0;
    
    photosContainer.dataset.photoIndex = index;
    
    const img = card.querySelector('.card-photo');
    img.style.opacity = '0';
    
    setTimeout(() => {
        img.src = photos[index];
        img.style.opacity = '1';
    }, 150);
    
    card.querySelectorAll('.gallery-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// touch/mouse drag for swiping cards left or right
function setupSwipeGestures(card) {
    if (!card) return;
    
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    const onStart = (e) => {
        if (isAnimating) return;
        if (e.target.closest('.photo-nav') || e.target.closest('.card-expand')) return;
        
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        card.style.transition = 'none';
        card.classList.add('dragging');
    };
    
    const onMove = (e) => {
        if (!isDragging || isAnimating) return;
        
        e.preventDefault();
        currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        const diffX = currentX - startX;
        const diffY = currentY - startY;
        const rotation = diffX * 0.08;
        
        card.style.transform = `translateX(${diffX}px) translateY(${diffY * 0.3}px) rotate(${rotation}deg)`;
        
        const likeIndicator = card.querySelector('.swipe-indicator.like');
        const nopeIndicator = card.querySelector('.swipe-indicator.nope');
        const superLikeIndicator = card.querySelector('.swipe-indicator.superlike');
        
        likeIndicator.style.opacity = '0';
        nopeIndicator.style.opacity = '0';
        superLikeIndicator.style.opacity = '0';
        
        if (diffY < -80) {
            superLikeIndicator.style.opacity = Math.min((-diffY - 80) / 60, 1);
        } else if (diffX > 50) {
            likeIndicator.style.opacity = Math.min((diffX - 50) / 80, 1);
        } else if (diffX < -50) {
            nopeIndicator.style.opacity = Math.min((-diffX - 50) / 80, 1);
        }
    };
    
    const onEnd = () => {
        if (!isDragging || isAnimating) return;
        isDragging = false;
        
        card.classList.remove('dragging');
        card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        const diffX = currentX - startX;
        const diffY = currentY - startY;
        
        if (diffY < -100) {
            swipe(true, true);
        } else if (diffX > 100) {
            swipe(true);
        } else if (diffX < -100) {
            swipe(false);
        } else {
            card.style.transform = 'scale(1) translateY(0)';
            const indicators = card.querySelectorAll('.swipe-indicator');
            indicators.forEach(i => i.style.opacity = 0);
        }
    };
    
    card.addEventListener('mousedown', onStart);
    card.addEventListener('touchstart', onStart, { passive: true });
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}

// process a like/dislike/superlike action
async function swipe(isLike, isSuperLike = false) {
    if (!currentProfile || isAnimating) return;
    
    isAnimating = true;
    
    const cardStack = document.getElementById('cardStack');
    const card = cardStack.firstChild;
    
    if (!card) {
        isAnimating = false;
        return;
    }
    
    lastSwipedProfile = currentProfile;
    
    vibrate(isLike ? [50] : [30, 30]);
    
    if (isLike) {
        playSound('like');
    }
    
    if (isSuperLike) {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s';
        card.style.transform = 'translateY(-150vh) scale(0.8)';
        card.style.opacity = '0';
    } else if (isLike) {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s';
        card.style.transform = 'translateX(150%) rotate(30deg)';
        card.style.opacity = '0';
    } else {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s';
        card.style.transform = 'translateX(-150%) rotate(-30deg)';
        card.style.opacity = '0';
    }
    
    const btnClass = isSuperLike ? '.superlike' : (isLike ? '.like' : '.dislike');
    const btn = document.querySelector(`.action-btn${btnClass}`);
    if (btn) {
        btn.style.transform = 'scale(1.3)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);
    }
    
    try {
        const result = await swipeProfile(currentProfile.userId, isLike, isSuperLike);
        
        if (result && result.isMatch) {
            matchedProfile = result.match;
            playSound('match');
            createConfetti();
            setTimeout(() => {
                showMatchModal(currentProfile);
            }, 300);
        }
    } catch (error) {
        console.error('Error swiping:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
    
    setTimeout(() => {
        currentIndex++;
        
        if (currentIndex >= profiles.length) {
            loadProfiles();
        } else {
            renderCards();
        }
        
        isAnimating = false;
    }, 400);
}

// popup when two users like each other
function showMatchModal(profile) {
    const modal = document.getElementById('matchModal');
    const matchName = document.getElementById('matchName');
    const myPhoto = document.getElementById('myPhoto');
    const theirPhoto = document.getElementById('theirPhoto');
    
    matchName.textContent = profile.name;
    myPhoto.src = myProfile?.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100';
    theirPhoto.src = profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100';
    
    myPhoto.style.animation = 'bounceIn 0.6s ease-out 0.2s both';
    theirPhoto.style.animation = 'bounceIn 0.6s ease-out 0.4s both';
    
    modal.classList.add('active');
    
    setTimeout(() => createConfetti(), 500);
    
    updateUnreadBadge();
}

function closeMatchModal() {
    const modal = document.getElementById('matchModal');
    modal.classList.remove('active');
}

function goToChat() {
    closeMatchModal();
    window.location.href = '/matches.html';
}

function keepSwiping() {
    closeMatchModal();
}

// expanded profile view with all details
async function showProfileDetail(profileId) {
    // check discovery, explore, and own profile
    let profile = profiles.find(p => p.id === profileId) 
        || exploreProfiles.find(p => p.id === profileId);
    
    if (!profile && myProfile && myProfile.id === profileId) {
        profile = myProfile;
    }
    
    // last resort — fetch by id from localdb
    if (!profile) {
        profile = await getProfile(profileId);
    }
    
    if (!profile) return;
    
    const modal = document.getElementById('profileModal');
    const content = document.getElementById('profileDetailContent');
    
    const interests = profile.interests || [];
    const interestTags = interests.map(i => `<span class="interest-tag"><i class="fas fa-heart"></i> ${i}</span>`).join('');
    
    const photos = profile.photos && profile.photos.length > 0 
        ? profile.photos 
        : [profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400'];
    
    const photoGallery = photos.map((photo, index) => `
        <img src="${photo}" alt="${profile.name}" class="profile-detail-photo ${index === 0 ? 'active' : ''}" 
             style="${index > 0 ? 'display: none;' : ''}" data-index="${index}">
    `).join('');
    
    const photoDots = photos.length > 1 ? `
        <div class="photo-dots">
            ${photos.map((_, i) => `<span class="photo-dot ${i === 0 ? 'active' : ''}" onclick="showDetailPhoto(${i})"></span>`).join('')}
        </div>
    ` : '';
    
    const distance = Math.floor(Math.random() * 15) + 1;
    
    content.innerHTML = `
        <div class="profile-detail-gallery">
            ${photoGallery}
            ${photos.length > 1 ? `
                <button class="gallery-nav gallery-prev" onclick="navigateDetailPhoto(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="gallery-nav gallery-next" onclick="navigateDetailPhoto(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            ` : ''}
            ${photoDots}
        </div>
        <div class="profile-detail-info">
            <div class="profile-detail-header">
                <h2>
                    ${profile.name}, ${profile.age}
                    <i class="fas fa-check-circle verified-badge"></i>
                </h2>
                <span class="profile-distance">
                    <i class="fas fa-map-marker-alt"></i>
                    ${distance} km away
                </span>
            </div>
            
            <p class="profile-location">
                <i class="fas fa-briefcase"></i>
                ${profile.occupation || profile.location || 'Somewhere nearby'}
            </p>
            
            <div class="profile-section">
                <h3><i class="fas fa-user"></i> About Me</h3>
                <p>${profile.bio || 'Swipe right to learn more about me! 💕'}</p>
            </div>
            
            ${(profile.hairColor || profile.eyeColor || profile.bodyType || profile.heightCm) ? `
                <div class="profile-section">
                    <h3><i class="fas fa-palette"></i> Appearance</h3>
                    <div class="detail-chips">
                        ${profile.hairColor ? `<span class="detail-chip"><i class="fas fa-paint-brush"></i> ${profile.hairColor} Hair</span>` : ''}
                        ${profile.eyeColor ? `<span class="detail-chip"><i class="fas fa-eye"></i> ${profile.eyeColor} Eyes</span>` : ''}
                        ${profile.bodyType ? `<span class="detail-chip"><i class="fas fa-child"></i> ${profile.bodyType}</span>` : ''}
                        ${profile.heightCm ? `<span class="detail-chip"><i class="fas fa-ruler-vertical"></i> ${profile.heightCm} cm</span>` : ''}
                        ${profile.skinTone ? `<span class="detail-chip"><i class="fas fa-circle"></i> ${profile.skinTone}</span>` : ''}
                        ${profile.ethnicity ? `<span class="detail-chip"><i class="fas fa-globe"></i> ${profile.ethnicity}</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${(profile.smoking || profile.drinking || profile.education) ? `
                <div class="profile-section">
                    <h3><i class="fas fa-cocktail"></i> Lifestyle</h3>
                    <div class="detail-chips">
                        ${profile.smoking ? `<span class="detail-chip"><i class="fas fa-smoking"></i> Smoking: ${profile.smoking}</span>` : ''}
                        ${profile.drinking ? `<span class="detail-chip"><i class="fas fa-wine-glass"></i> Drinking: ${profile.drinking}</span>` : ''}
                        ${profile.education ? `<span class="detail-chip"><i class="fas fa-graduation-cap"></i> ${profile.education}</span>` : ''}
                    </div>
                </div>
            ` : ''}

            ${interests.length > 0 ? `
                <div class="profile-section">
                    <h3><i class="fas fa-heart"></i> Interests</h3>
                    <div class="interest-tags">${interestTags}</div>
                </div>
            ` : ''}

            ${(profile.hobbies && profile.hobbies.length > 0) ? `
                <div class="profile-section">
                    <h3><i class="fas fa-gamepad"></i> Hobbies</h3>
                    <div class="interest-tags">${profile.hobbies.map(h => `<span class="interest-tag"><i class="fas fa-star"></i> ${h}</span>`).join('')}</div>
                </div>
            ` : ''}
            
            <div class="profile-detail-actions">
                <button class="action-btn dislike" onclick="swipeFromDetail(false)">
                    <i class="fas fa-times"></i>
                </button>
                <button class="action-btn superlike" onclick="swipeFromDetail(true, true)">
                    <i class="fas fa-star"></i>
                </button>
                <button class="action-btn like" onclick="swipeFromDetail(true)">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

let detailPhotoIndex = 0;

function navigateDetailPhoto(direction) {
    const photos = document.querySelectorAll('.profile-detail-photo');
    const dots = document.querySelectorAll('.photo-dot');
    
    photos[detailPhotoIndex].style.display = 'none';
    photos[detailPhotoIndex].classList.remove('active');
    
    detailPhotoIndex += direction;
    if (detailPhotoIndex < 0) detailPhotoIndex = photos.length - 1;
    if (detailPhotoIndex >= photos.length) detailPhotoIndex = 0;
    
    photos[detailPhotoIndex].style.display = 'block';
    photos[detailPhotoIndex].classList.add('active');
    
    dots.forEach((dot, i) => dot.classList.toggle('active', i === detailPhotoIndex));
}

function showDetailPhoto(index) {
    const photos = document.querySelectorAll('.profile-detail-photo');
    const dots = document.querySelectorAll('.photo-dot');
    
    photos[detailPhotoIndex].style.display = 'none';
    photos[detailPhotoIndex].classList.remove('active');
    
    detailPhotoIndex = index;
    
    photos[detailPhotoIndex].style.display = 'block';
    photos[detailPhotoIndex].classList.add('active');
    
    dots.forEach((dot, i) => dot.classList.toggle('active', i === detailPhotoIndex));
}

function swipeFromDetail(isLike, isSuperLike = false) {
    closeProfileModal();
    swipe(isLike, isSuperLike);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.remove('active');
    detailPhotoIndex = 0;
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const profileModal = document.getElementById('profileModal');
    const matchModal = document.getElementById('matchModal');
    if (profileModal?.classList.contains('active') || matchModal?.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeProfileModal();
            closeMatchModal();
        }
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            swipe(false);
            break;
        case 'ArrowRight':
            e.preventDefault();
            swipe(true);
            break;
        case 'ArrowUp':
            e.preventDefault();
            swipe(true, true); // Super like
            break;
        case ' ':
            e.preventDefault();
            if (currentProfile) {
                showProfileDetail(currentProfile.id);
            }
            break;
    }
});

// overrides api.js version to also handle the notification dot
async function updateUnreadBadge() {
    try {
        const unreadCount = await getUnreadCount();
        
        const badge = document.getElementById('matchBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.textContent = '';
                badge.style.display = 'none';
            }
        }
        
        const notificationDot = document.getElementById('notificationDot');
        if (notificationDot) {
            notificationDot.classList.toggle('active', unreadCount > 0);
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

function refreshProfiles() {
    currentIndex = 0;
    profiles = [];
    loadProfiles();
    showToast('Finding new people nearby...', 'info');
}

function reportProfile() {
    if (currentProfile) {
        showToast('Profile reported. Thank you for helping keep Zelove safe.', 'success');
    }
}

// switches between home/search/matches/profile/settings tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.sidebar-link').forEach(btn => {
        try { btn.classList.toggle('active', btn.textContent.trim().toLowerCase().startsWith(tabName)); } catch (e) {}
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetContent = document.getElementById(`${tabName}Content`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    switch(tabName) {
        case 'search':
            loadExploreContent();
            break;
        case 'matches':
            loadMatchesPreview();
            break;
        case 'profile':
            loadProfilePreview();
            break;
        case 'settings':
            loadSettings();
            break;
    }
    
    vibrate([10]);
}

// loads the explore/search tab with profile grid
async function loadExploreContent() {
    try {
        const topPicksGrid = document.getElementById('topPicksGrid');
        const recentlyActiveGrid = document.getElementById('recentlyActiveGrid');

        const serverFilters = {};
        if (currentFilters.gender) serverFilters.gender = currentFilters.gender;
        if (currentFilters.minAge) serverFilters.minAge = currentFilters.minAge;
        if (currentFilters.maxAge) serverFilters.maxAge = currentFilters.maxAge;
        if (currentFilters.hairColor) serverFilters.hairColor = currentFilters.hairColor;
        if (currentFilters.skinTone) serverFilters.skinTone = currentFilters.skinTone;
        if (currentFilters.eyeColor) serverFilters.eyeColor = currentFilters.eyeColor;
        if (currentFilters.bodyType) serverFilters.bodyType = currentFilters.bodyType;
        if (currentFilters.ethnicity) serverFilters.ethnicity = currentFilters.ethnicity;
        if (currentFilters.smoking) serverFilters.smoking = currentFilters.smoking;
        if (currentFilters.drinking) serverFilters.drinking = currentFilters.drinking;

        const allProfiles = await getDiscoveryProfiles(20, serverFilters);
        exploreProfiles = allProfiles || [];

        const filtered = filterProfiles(exploreProfiles);

        if (topPicksGrid) {
            topPicksGrid.innerHTML = filtered.slice(0, 4).map(profile => renderExploreCard(profile)).join('');
        }

        if (recentlyActiveGrid) {
            recentlyActiveGrid.innerHTML = filtered.slice(4, 12).map(profile => renderExploreCard(profile, true)).join('');
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput && !searchInput._filterBound) {
            searchInput._filterBound = true;
            searchInput.addEventListener('input', debounce((e) => {
                currentFilters.query = e.target.value.trim().toLowerCase();
                const f = filterProfiles(exploreProfiles);
                if (topPicksGrid) topPicksGrid.innerHTML = f.slice(0,4).map(p=>renderExploreCard(p)).join('');
                if (recentlyActiveGrid) recentlyActiveGrid.innerHTML = f.slice(4,12).map(p=>renderExploreCard(p,true)).join('');
            }, 260));
        }
    } catch (error) {
        console.error('Error loading explore content:', error);
    }
}

function renderExploreCard(profile, small = false) {
    const photo = profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400';
    const distance = profile._distance || (profile._distance = Math.floor(Math.random() * 50) + 1);
    const onlineBadge = Math.random() > 0.6 ? '<div class="online-badge"></div>' : '';
    return `
        <div class="explore-card" onclick="showProfileDetail(${profile.id})">
            <img src="${photo}" alt="${profile.name}">
            ${onlineBadge}
            <div class="explore-card-info">
                <div class="explore-card-name">${profile.name}, ${profile.age}</div>
                <div class="explore-card-meta">${distance} km away</div>
            </div>
        </div>
    `;
}

function filterProfiles(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(p => {
        if (p.age) {
            if (p.age < currentFilters.minAge || p.age > currentFilters.maxAge) return false;
        }

        if (!p._distance) p._distance = Math.floor(Math.random() * 50) + 1;
        if (p._distance > currentFilters.distance) return false;

        if (currentFilters.query) {
            const q = currentFilters.query;
            const hay = (`${p.name} ${p.bio || ''} ${(p.interests || []).join(' ')}`).toLowerCase();
            if (!hay.includes(q)) return false;
        }

        if (currentFilters.chips && currentFilters.chips.length > 0) {
            const interests = (p.interests || []).map(x => x.toLowerCase());
            const matches = currentFilters.chips.some(c => interests.includes(c.toLowerCase()));
            if (!matches) return false;
        }

        if (currentFilters.category) {
            const c = currentFilters.category;
            if (c === 'online') {
                if (Math.random() > 0.6) return false; // some appear offline
            }
        }

        return true;
    });
}

// shows recent matches and message previews
async function loadMatchesPreview() {
    try {
        const matches = await getMatches();
        const newMatchesScroll = document.getElementById('newMatchesScroll');
        const messagesList = document.getElementById('messagesList');
        
        if (newMatchesScroll) {
            if (matches.length > 0) {
                newMatchesScroll.innerHTML = matches.slice(0, 8).map(match => `
                    <div class="new-match-item" onclick="window.location.href='matches.html?match=${match.id}'">
                        <img src="${match.matchedUser?.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150'}" alt="${match.matchedUser?.name || 'Match'}" class="new-match-avatar">
                        <span class="new-match-name">${match.matchedUser?.name || 'Match'}</span>
                    </div>
                `).join('');
            } else {
                newMatchesScroll.innerHTML = '<p style="color: var(--gray-500); padding: 20px; text-align: center;">No matches yet. Keep swiping!</p>';
            }
        }
        
        if (messagesList) {
            const existingH3 = messagesList.querySelector('h3');
            messagesList.innerHTML = '';
            if (existingH3) messagesList.appendChild(existingH3);
            
            if (matches.length > 0) {
                for (const match of matches.slice(0, 5)) {
                    const lastMessage = match.lastMessage;
                    const unreadCount = match.unreadCount || 0;
                    
                    const itemHtml = `
                        <div class="message-preview-item" onclick="window.location.href='matches.html?match=${match.id}'">
                            <img src="${match.matchedUser?.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150'}" alt="${match.matchedUser?.name || 'Match'}" class="message-avatar">
                            <div class="message-info">
                                <div class="message-name">${match.matchedUser?.name || 'Match'}</div>
                                <div class="message-text">${lastMessage ? lastMessage.content.substring(0, 40) + '...' : 'Say hello! 👋'}</div>
                            </div>
                            <div class="message-time-badge">
                                <time>${lastMessage ? formatTime(lastMessage.sentAt) : 'New'}</time>
                                ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
                            </div>
                        </div>
                    `;
                    messagesList.insertAdjacentHTML('beforeend', itemHtml);
                }
            } else {
                messagesList.insertAdjacentHTML('beforeend', '<p style="color: var(--gray-500); padding: 20px; text-align: center;">No messages yet.</p>');
            }
        }
    } catch (error) {
        console.error('Error loading matches preview:', error);
    }
}

// profile card preview in the profile tab
async function loadProfilePreview() {
    try {
        const profile = myProfile || await getMyProfile();
        const profileCardPreview = document.getElementById('profileCardPreview');
        
        if (profileCardPreview) {
            profileCardPreview.innerHTML = `
                <img src="${profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400'}" alt="${profile.name}" class="profile-preview-photo">
                <div class="profile-preview-info">
                    <h3 class="profile-preview-name">${profile.name}, ${profile.age}</h3>
                    <p class="profile-preview-bio">${profile.bio || 'Add a bio to let others know about you!'}</p>
                </div>
            `;
        }
        
        document.getElementById('profileLikes').textContent = Math.floor(Math.random() * 50) + 10;
        document.getElementById('profileViews').textContent = Math.floor(Math.random() * 200) + 50;
        
        const matches = await getMatches();
        document.getElementById('profileMatches').textContent = matches.length;
        
        let completion = 40; // Base
        if (profile.bio) completion += 15;
        if (profile.profilePhotoUrl) completion += 20;
        if (profile.interests?.length > 0) completion += 15;
        if (profile.location) completion += 10;
        
        document.getElementById('completionPercent').textContent = `${completion}%`;
        document.getElementById('completionFill').style.width = `${completion}%`;
        
    } catch (error) {
        console.error('Error loading profile preview:', error);
    }
}

function loadSettings() {
    const savedDistance = localStorage.getItem('maxDistance') || '50';
    const savedMinAge = localStorage.getItem('minAge') || '18';
    const savedMaxAge = localStorage.getItem('maxAge') || '35';
    
    document.getElementById('distanceSlider').value = savedDistance;
    document.getElementById('distanceValue').textContent = `${savedDistance} km`;
    
    document.getElementById('minAgeSlider').value = savedMinAge;
    document.getElementById('maxAgeSlider').value = savedMaxAge;
    document.getElementById('ageRangeValue').textContent = `${savedMinAge}-${savedMaxAge}`;
}

function updateDistanceValue() {
    const value = document.getElementById('distanceSlider').value;
    document.getElementById('distanceValue').textContent = `${value} km`;
    localStorage.setItem('maxDistance', value);
}

function updateAgeRange() {
    const minAge = document.getElementById('minAgeSlider').value;
    const maxAge = document.getElementById('maxAgeSlider').value;
    
    if (parseInt(minAge) > parseInt(maxAge)) {
        document.getElementById('minAgeSlider').value = maxAge;
    }
    
    const finalMin = Math.min(minAge, maxAge);
    const finalMax = Math.max(minAge, maxAge);
    
    document.getElementById('ageRangeValue').textContent = `${finalMin}-${finalMax}`;
    localStorage.setItem('minAge', finalMin);
    localStorage.setItem('maxAge', finalMax);
}

let lastSwipedProfile = null;

function rewindProfile() {
    if (lastSwipedProfile) {
        profiles.unshift(lastSwipedProfile);
        currentIndex = 0;
        renderCards();
        lastSwipedProfile = null;
        showToast('Rewinded to previous profile!', 'success');
    } else {
        showToast('No profile to rewind. This is a premium feature!', 'info');
    }
}

function activateBoost() {
    showToast('🚀 Boost activated! Your profile is now being shown to more people for 30 minutes.', 'success');
    
    const boostBtn = document.querySelector('.action-btn.boost');
    if (boostBtn) {
        boostBtn.classList.add('boosting');
        setTimeout(() => boostBtn.classList.remove('boosting'), 2000);
    }
}

function showPremium() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// builds the filter modal with all the filter options
function openFilters() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.add('active');
        const ranges = modal.querySelectorAll('input[type="range"]');
        if (ranges && ranges.length >= 1) {
            ranges.forEach((r, i) => {
                r.addEventListener('input', () => {
                    if (i === 0 || i === 1) {
                        const a = ranges[0].value;
                        const b = ranges[1].value;
                        const label = document.getElementById('filterAgeValue');
                        if (label) label.textContent = `${Math.min(a,b)}-${Math.max(a,b)}`;
                    } else if (i === 2) {
                        const label = document.getElementById('filterDistanceValue');
                        if (label) label.textContent = `${r.value} km`;
                    }
                });
            });
        }
    }
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function resetFilters() {
    currentFilters = { query: '', category: null, minAge: 18, maxAge: 50, distance: 50, chips: [] };

    document.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
    const everyoneBtn = document.querySelector('.filter-option[data-value=""]');
    if (everyoneBtn) everyoneBtn.classList.add('active');

    const selects = ['filterHairColor', 'filterSkinTone', 'filterEyeColor', 'filterBodyType', 'filterEthnicity', 'filterSmoking', 'filterDrinking'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const modal = document.getElementById('filterModal');
    if (modal) {
        const minAgeEl = document.getElementById('filterMinAge');
        const maxAgeEl = document.getElementById('filterMaxAge');
        if (minAgeEl) minAgeEl.value = 18;
        if (maxAgeEl) maxAgeEl.value = 50;
        const ageLabel = document.getElementById('filterAgeValue');
        if (ageLabel) ageLabel.textContent = '18-50';
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    localStorage.removeItem('exploreFilters');
    closeFilterModal();
    showToast('Filters reset to default', 'info');
    loadExploreContent();
}

// reads filter values and reloads cards
function applyFilters() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        const activeOption = modal.querySelector('.filter-option.active');
        const genderValue = activeOption ? (activeOption.dataset.value || '') : '';

        const minAge = parseInt(document.getElementById('filterMinAge')?.value) || 18;
        const maxAge = parseInt(document.getElementById('filterMaxAge')?.value) || 50;

        currentFilters.minAge = Math.min(minAge, maxAge);
        currentFilters.maxAge = Math.max(minAge, maxAge);
        currentFilters.gender = genderValue;
        currentFilters.hairColor = document.getElementById('filterHairColor')?.value || '';
        currentFilters.skinTone = document.getElementById('filterSkinTone')?.value || '';
        currentFilters.eyeColor = document.getElementById('filterEyeColor')?.value || '';
        currentFilters.bodyType = document.getElementById('filterBodyType')?.value || '';
        currentFilters.ethnicity = document.getElementById('filterEthnicity')?.value || '';
        currentFilters.smoking = document.getElementById('filterSmoking')?.value || '';
        currentFilters.drinking = document.getElementById('filterDrinking')?.value || '';
    }

    try { localStorage.setItem('exploreFilters', JSON.stringify(currentFilters)); } catch (e) {}

    closeFilterModal();
    showToast('Filters applied!', 'success');
    loadExploreContent();
}

function updateFilterAgeLabel() {
    const minAge = document.getElementById('filterMinAge')?.value || 18;
    const maxAge = document.getElementById('filterMaxAge')?.value || 50;
    const label = document.getElementById('filterAgeValue');
    if (label) label.textContent = `${Math.min(minAge, maxAge)}-${Math.max(minAge, maxAge)}`;
}

function searchByCategory(category) {
    showToast(`Searching for ${category} profiles...`, 'info');
    currentFilters.category = category;
    loadExploreContent();
}

function openPhotoEditor() {
    showToast('Photo editor coming soon!', 'info');
}

function previewProfile() {
    if (myProfile) {
        showProfileDetail(myProfile.id);
    }
}

function showHelp() {
    showToast('Help & Support - Contact: support@zelove.app', 'info');
}

// settings tab click handlers for gender/filter buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            localStorage.setItem('showMe', this.dataset.gender);
        });
    });
    
    document.querySelectorAll('.filter-option').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
});
