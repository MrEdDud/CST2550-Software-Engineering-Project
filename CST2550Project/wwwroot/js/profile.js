// profile.js - profile editing page (photos, bio, interests, preferences)

let profile = null;
let originalProfile = null;
let interests = [];
let hobbies = [];
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    try {
        await loadProfile();
        await loadStats();
        await updateUnreadBadge();
        setupEventListeners();
        
        document.body.style.opacity = '1';
        
        showToast(`Welcome, ${profile.name}! 💕`, 'success');
        
    } catch (error) {
        console.error('Error initializing:', error);
        document.body.style.opacity = '1';
        showToast('Error loading profile. Please refresh.', 'error');
    }
});

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// fetch and display user profile data
async function loadProfile() {
    document.getElementById('profileAvatar').classList.add('skeleton');
    
    try {
        profile = await getMyProfile();
        originalProfile = JSON.parse(JSON.stringify(profile));
        interests = profile.interests || [];
        hobbies = profile.hobbies || [];
        
        populateForm();
        renderPhotos();
        
        document.getElementById('profileAvatar').classList.remove('skeleton');
    } catch (error) {
        console.error('Error loading profile:', error);
        throw error;
    }
}

// fill all form fields with the loaded profile data
function populateForm() {
    if (!profile) return;
    
    const avatarUrl = profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=140';
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('profileName').textContent = `${profile.name}, ${profile.age}`;
    document.getElementById('profileLocation').innerHTML = `
        <i class="fas fa-map-marker-alt"></i> ${profile.location || 'Location not set'}
    `;
    
    const verifiedBadge = document.querySelector('.profile-verified-badge');
    if (verifiedBadge) {
        verifiedBadge.style.display = profile.isVerified ? 'inline-flex' : 'none';
    }
    
    const fields = [
        { id: 'editUsername', value: profile.username || '' },
        { id: 'editName', value: profile.name || '' },
        { id: 'editAge', value: profile.age || '' },
        { id: 'editLocation', value: profile.location || '' },
        { id: 'editLookingFor', value: profile.lookingFor || 'Everyone' },
        { id: 'editBio', value: profile.bio || '' },
        { id: 'editProfilePhotoUrl', value: profile.profilePhotoUrl || '' },
        { id: 'editOccupation', value: profile.occupation || '' },
        { id: 'editHairColor', value: profile.hairColor || '' },
        { id: 'editSkinTone', value: profile.skinTone || '' },
        { id: 'editEyeColor', value: profile.eyeColor || '' },
        { id: 'editBodyType', value: profile.bodyType || '' },
        { id: 'editHeightCm', value: profile.heightCm || '' },
        { id: 'editEthnicity', value: profile.ethnicity || '' },
        { id: 'editSmoking', value: profile.smoking || '' },
        { id: 'editDrinking', value: profile.drinking || '' },
        { id: 'editEducation', value: profile.education || '' }
    ];
    
    fields.forEach((field, index) => {
        const el = document.getElementById(field.id);
        if (el) {
            setTimeout(() => {
                el.value = field.value;
                el.style.animation = 'fadeIn 0.3s ease-out';
            }, index * 30);
        }
    });
    
    updateBioCount();
    
    renderInterests();
    renderHobbies();
    
    document.getElementById('minAge').value = profile.minAge || 18;
    document.getElementById('maxAge').value = profile.maxAge || 50;
    document.getElementById('maxDistance').value = profile.maxDistance || 50;
    document.getElementById('distanceValue').textContent = `${profile.maxDistance || 50} km`;
    
    updateAgeRangeDisplay();
}

function updateAgeRangeDisplay() {
    const minAge = document.getElementById('minAge').value;
    const maxAge = document.getElementById('maxAge').value;
    const ageRangeEl = document.getElementById('ageRangeDisplay');
    if (ageRangeEl) {
        ageRangeEl.textContent = `${minAge} - ${maxAge} years`;
    }
}

async function loadStats() {
    try {
        const matches = await getMatches();
        const likes = await getLikesReceived();
        
        animateCounter('statLikes', likes.length);
        animateCounter('statMatches', matches.length);
        animateCounter('statChats', matches.filter(m => m.lastMessage).length);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    let current = 0;
    const increment = Math.ceil(target / 20);
    const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 50);
}

// wire up form inputs, photo buttons, save/discard etc
function setupEventListeners() {
    const bioEl = document.getElementById('editBio');
    if (bioEl) {
        bioEl.addEventListener('input', updateBioCount);
    }
    
    const distanceEl = document.getElementById('maxDistance');
    if (distanceEl) {
        distanceEl.addEventListener('input', (e) => {
            document.getElementById('distanceValue').textContent = `${e.target.value} km`;
            markUnsaved();
        });
    }
    
    ['minAge', 'maxAge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                updateAgeRangeDisplay();
                markUnsaved();
            });
        }
    });
    
    const interestInput = document.getElementById('newInterest');
    if (interestInput) {
        interestInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addInterest();
            }
        });
    }
    
    const hobbyInput = document.getElementById('newHobby');
    if (hobbyInput) {
        hobbyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addHobby();
            }
        });
    }
    
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('input', markUnsaved);
    }
}

function markUnsaved() {
    hasUnsavedChanges = true;
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && !saveBtn.classList.contains('has-changes')) {
        saveBtn.classList.add('has-changes');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes *';
    }
}

function updateBioCount() {
    const bio = document.getElementById('editBio').value;
    const countEl = document.getElementById('bioCount');
    const maxLength = 500;
    
    countEl.textContent = bio.length;
    
    if (bio.length > maxLength * 0.9) {
        countEl.style.color = '#e74c3c';
    } else if (bio.length > maxLength * 0.7) {
        countEl.style.color = '#f39c12';
    } else {
        countEl.style.color = 'var(--text-muted)';
    }
}

// render interest tags with remove buttons
function renderInterests() {
    const container = document.getElementById('interestsTags');
    
    if (interests.length === 0) {
        container.innerHTML = `
            <span class="no-interests">No interests added yet. Add some to help find better matches!</span>
        `;
        return;
    }
    
    container.innerHTML = interests.map((interest, index) => `
        <span class="interest-chip" style="animation: fadeIn 0.3s ease-out ${index * 0.05}s both;">
            <i class="fas fa-heart"></i>
            ${escapeHtml(interest)}
            <button type="button" onclick="removeInterest(${index})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

function addInterest() {
    const input = document.getElementById('newInterest');
    const interest = input.value.trim();
    
    if (!interest) {
        showToast('Please enter an interest', 'warning');
        return;
    }
    
    if (interest.length > 30) {
        showToast('Interest must be 30 characters or less', 'warning');
        return;
    }
    
    if (interests.length >= 10) {
        showToast('Maximum 10 interests allowed', 'warning');
        return;
    }
    
    if (interests.map(i => i.toLowerCase()).includes(interest.toLowerCase())) {
        showToast('Interest already added', 'warning');
        input.value = '';
        return;
    }
    
    interests.push(interest);
    renderInterests();
    input.value = '';
    markUnsaved();
    
    vibrate([30]);
    
    showToast(`Added "${interest}" to your interests!`, 'success');
}

function removeInterest(index) {
    const chips = document.querySelectorAll('#interestsTags .interest-chip');
    
    if (chips[index]) {
        chips[index].style.animation = 'fadeOut 0.2s ease-out forwards';
        setTimeout(() => {
            interests.splice(index, 1);
            renderInterests();
            markUnsaved();
        }, 200);
    } else {
        interests.splice(index, 1);
        renderInterests();
        markUnsaved();
    }
}

// render hobby chips with remove buttons
function renderHobbies() {
    const container = document.getElementById('hobbiesTags');
    if (!container) return;
    
    if (hobbies.length === 0) {
        container.innerHTML = `
            <span class="no-interests">No hobbies added yet. Share what you enjoy!</span>
        `;
        return;
    }
    
    container.innerHTML = hobbies.map((hobby, index) => `
        <span class="interest-chip" style="animation: fadeIn 0.3s ease-out ${index * 0.05}s both;">
            <i class="fas fa-star"></i>
            ${escapeHtml(hobby)}
            <button type="button" onclick="removeHobby(${index})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

function addHobby() {
    const input = document.getElementById('newHobby');
    const hobby = input.value.trim();
    
    if (!hobby) {
        showToast('Please enter a hobby', 'warning');
        return;
    }
    
    if (hobby.length > 30) {
        showToast('Hobby must be 30 characters or less', 'warning');
        return;
    }
    
    if (hobbies.length >= 10) {
        showToast('Maximum 10 hobbies allowed', 'warning');
        return;
    }
    
    if (hobbies.map(h => h.toLowerCase()).includes(hobby.toLowerCase())) {
        showToast('Hobby already added', 'warning');
        input.value = '';
        return;
    }
    
    hobbies.push(hobby);
    renderHobbies();
    input.value = '';
    markUnsaved();
    vibrate([30]);
    showToast(`Added "${hobby}" to your hobbies!`, 'success');
}

function removeHobby(index) {
    const chips = document.querySelectorAll('#hobbiesTags .interest-chip');
    
    if (chips[index]) {
        chips[index].style.animation = 'fadeOut 0.2s ease-out forwards';
        setTimeout(() => {
            hobbies.splice(index, 1);
            renderHobbies();
            markUnsaved();
        }, 200);
    } else {
        hobbies.splice(index, 1);
        renderHobbies();
        markUnsaved();
    }
}

// photo gallery management
function renderPhotos() {
    const container = document.getElementById('photoGrid');
    const photos = profile.photos || [];
    
    let html = photos.map((url, index) => `
        <div class="photo-item" style="animation: fadeIn 0.3s ease-out ${index * 0.1}s both;">
            <img src="${url}" alt="Photo ${index + 1}" onerror="this.src='https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200'">
            <div class="photo-overlay">
                <span class="photo-number">${index + 1}</span>
            </div>
            <div class="photo-actions">
                ${index > 0 ? `
                    <button onclick="movePhoto(${index}, -1)" title="Move left">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                ` : ''}
                ${index === 0 ? `
                    <span class="main-badge" title="Main photo">
                        <i class="fas fa-star"></i>
                    </span>
                ` : ''}
                <button onclick="removePhoto(${index})" title="Remove photo" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
                ${index < photos.length - 1 ? `
                    <button onclick="movePhoto(${index}, 1)" title="Move right">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    if (photos.length < 6) {
        html += `
            <div class="photo-add" onclick="addPhoto()">
                <i class="fas fa-camera"></i>
                <span>Add Photo</span>
                <span class="photo-count">${photos.length}/6</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function movePhoto(index, direction) {
    const photos = profile.photos || [];
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= photos.length) return;
    
    [photos[index], photos[newIndex]] = [photos[newIndex], photos[index]];
    profile.photos = photos;
    
    if (index === 0 || newIndex === 0) {
        profile.profilePhotoUrl = photos[0];
        document.getElementById('profileAvatar').src = photos[0];
    }
    
    renderPhotos();
    markUnsaved();
    vibrate([20]);
}

function addPhoto() {
    const modal = document.getElementById('photoModal');
    modal.classList.add('active');
    
    const urlInput = document.getElementById('photoUrl');
    urlInput.value = '';
    urlInput.focus();
    
    urlInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitPhoto();
        }
    };
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
}

function submitPhoto() {
    const urlInput = document.getElementById('photoUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Please enter a photo URL', 'warning');
        urlInput.focus();
        return;
    }
    
    if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i) && 
        !url.includes('unsplash.com') && 
        !url.includes('images.unsplash.com')) {
        showToast('Please enter a valid image URL (jpg, png, gif, or webp)', 'warning');
        return;
    }
    
    const testImg = new Image();
    testImg.onload = () => {
        const photos = profile.photos || [];
        photos.push(url);
        profile.photos = photos;
        
        if (photos.length === 1) {
            profile.profilePhotoUrl = url;
            document.getElementById('profileAvatar').src = url;
        }
        
        renderPhotos();
        closePhotoModal();
        markUnsaved();
        
        showToast('Photo added successfully!', 'success');
        vibrate([30]);
    };
    
    testImg.onerror = () => {
        showToast('Could not load image. Please check the URL.', 'error');
    };
    
    testImg.src = url;
}

function removePhoto(index) {
    const photos = profile.photos || [];
    const isMainPhoto = index === 0;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'deletePhotoModal';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 350px; text-align: center; padding: 24px;">
            <img src="${photos[index]}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; margin-bottom: 16px;">
            <h3 style="margin-bottom: 8px;">Remove this photo?</h3>
            ${isMainPhoto ? '<p style="color: #f39c12; margin-bottom: 16px;"><i class="fas fa-exclamation-triangle"></i> This is your main profile photo!</p>' : ''}
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 16px;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn btn-primary" style="background: #e74c3c;" onclick="confirmRemovePhoto(${index})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function confirmRemovePhoto(index) {
    const modal = document.getElementById('deletePhotoModal');
    if (modal) modal.remove();
    
    profile.photos.splice(index, 1);
    
    if (index === 0 && profile.photos.length > 0) {
        profile.profilePhotoUrl = profile.photos[0];
        document.getElementById('profileAvatar').src = profile.photos[0];
    } else if (profile.photos.length === 0) {
        profile.profilePhotoUrl = null;
        document.getElementById('profileAvatar').src = 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=140';
    }
    
    renderPhotos();
    markUnsaved();
    showToast('Photo removed', 'info');
}

function changePhoto() {
    const photos = profile.photos || [];
    
    if (photos.length === 0) {
        addPhoto();
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'selectPhotoModal';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; padding: 24px;">
            <button class="modal-close" onclick="this.closest('.modal').remove()">
                <i class="fas fa-times"></i>
            </button>
            <h3 style="margin-bottom: 16px; text-align: center;">Choose Main Photo</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                ${photos.map((url, i) => `
                    <img src="${url}" 
                         onclick="setMainPhoto(${i})" 
                         style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 3px solid ${i === 0 ? 'var(--primary)' : 'transparent'};"
                         title="Click to set as main">
                `).join('')}
            </div>
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); addPhoto();" style="width: 100%; margin-top: 16px;">
                <i class="fas fa-plus"></i> Add New Photo
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function setMainPhoto(index) {
    const photos = profile.photos || [];
    if (index === 0 || index >= photos.length) return;
    
    const selected = photos.splice(index, 1)[0];
    photos.unshift(selected);
    profile.photos = photos;
    profile.profilePhotoUrl = photos[0];
    
    document.getElementById('profileAvatar').src = photos[0];
    
    const modal = document.getElementById('selectPhotoModal');
    if (modal) modal.remove();
    
    renderPhotos();
    markUnsaved();
    showToast('Main photo updated!', 'success');
}

// collects all form data and sends it to the api
async function saveProfile(event) {
    event.preventDefault();
    
    const saveBtn = document.getElementById('saveBtn');
    const successDiv = document.getElementById('saveSuccess');
    
    const updateData = {
        username: document.getElementById('editUsername').value.trim(),
        name: document.getElementById('editName').value.trim(),
        age: parseInt(document.getElementById('editAge').value),
        location: document.getElementById('editLocation').value.trim(),
        lookingFor: document.getElementById('editLookingFor').value,
        bio: document.getElementById('editBio').value.trim(),
        occupation: document.getElementById('editOccupation')?.value.trim() || '',
        interests: interests,
        hobbies: hobbies,
        hairColor: document.getElementById('editHairColor')?.value || '',
        skinTone: document.getElementById('editSkinTone')?.value || '',
        eyeColor: document.getElementById('editEyeColor')?.value || '',
        bodyType: document.getElementById('editBodyType')?.value || '',
        heightCm: parseInt(document.getElementById('editHeightCm')?.value) || null,
        ethnicity: document.getElementById('editEthnicity')?.value || '',
        smoking: document.getElementById('editSmoking')?.value || '',
        drinking: document.getElementById('editDrinking')?.value || '',
        education: document.getElementById('editEducation')?.value || '',
        minAge: parseInt(document.getElementById('minAge').value),
        maxAge: parseInt(document.getElementById('maxAge').value),
        maxDistance: parseInt(document.getElementById('maxDistance').value),
        photos: profile.photos,
        profilePhotoUrl: document.getElementById('editProfilePhotoUrl')?.value.trim() || profile.profilePhotoUrl
    };
    
    if (!updateData.name) {
        showToast('Please enter your name', 'error');
        document.getElementById('editName').focus();
        return;
    }
    
    if (updateData.name.length < 2) {
        showToast('Name must be at least 2 characters', 'error');
        document.getElementById('editName').focus();
        return;
    }
    
    if (updateData.age < 18 || updateData.age > 120 || isNaN(updateData.age)) {
        showToast('Please enter a valid age (18+)', 'error');
        document.getElementById('editAge').focus();
        return;
    }
    
    if (updateData.minAge > updateData.maxAge) {
        showToast('Minimum age cannot be greater than maximum age', 'error');
        return;
    }
    
    if (updateData.bio && updateData.bio.length > 500) {
        showToast('Bio must be 500 characters or less', 'error');
        document.getElementById('editBio').focus();
        return;
    }
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    successDiv.classList.add('hidden');
    
    try {
        profile = await updateProfile(updateData);
        originalProfile = JSON.parse(JSON.stringify(profile));
        hasUnsavedChanges = false;
        
        document.getElementById('profileName').textContent = `${profile.name}, ${profile.age}`;
        document.getElementById('profileLocation').innerHTML = `
            <i class="fas fa-map-marker-alt"></i> ${profile.location || 'Location not set'}
        `;
        
        successDiv.classList.remove('hidden');
        successDiv.style.animation = 'fadeIn 0.3s ease-out';
        
        createConfetti();
        
        saveBtn.classList.remove('has-changes');
        
        vibrate([50, 50, 100]);
        
        showToast('Profile saved successfully! 🎉', 'success');
        
        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 4000);
        
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Failed to save profile. Please try again.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
    }
}

function resetForm() {
    if (!hasUnsavedChanges) {
        showToast('No changes to discard', 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'resetConfirmModal';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 350px; text-align: center; padding: 24px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">🔄</div>
            <h3 style="margin-bottom: 8px;">Discard all changes?</h3>
            <p style="color: var(--text-muted); margin-bottom: 24px;">
                Your unsaved changes will be lost.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                    Cancel
                </button>
                <button class="btn btn-primary" onclick="confirmReset()">
                    <i class="fas fa-undo"></i> Discard
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function confirmReset() {
    const modal = document.getElementById('resetConfirmModal');
    if (modal) modal.remove();
    
    profile = JSON.parse(JSON.stringify(originalProfile));
    interests = [...(originalProfile.interests || [])];
    hobbies = [...(originalProfile.hobbies || [])];
    hasUnsavedChanges = false;
    
    populateForm();
    renderPhotos();
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.classList.remove('has-changes');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Profile';
    }
    
    showToast('Changes discarded', 'info');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('profileForm').dispatchEvent(new Event('submit'));
    }
    
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});