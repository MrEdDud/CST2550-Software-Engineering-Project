// localdb.js - localStorage JSON database so the app works without the .NET server
// stores users, profiles, matches, messages and likes in the browser

const DB_KEYS = {
    users: 'zelove_users',
    profiles: 'zelove_profiles',
    likes: 'zelove_likes',
    matches: 'zelove_matches',
    messages: 'zelove_messages',
    nextId: 'zelove_next_id',
    seeded: 'zelove_seeded'
};

// get a table from localStorage
function dbGet(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        return [];
    }
}

// save a table to localStorage
function dbSet(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// auto-incrementing id
function dbNextId() {
    let id = parseInt(localStorage.getItem(DB_KEYS.nextId)) || 100;
    id++;
    localStorage.setItem(DB_KEYS.nextId, id.toString());
    return id;
}

// simple hash for passwords (not secure, just for local demo)
function simpleHash(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'local_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function verifyHash(password, stored) {
    return simpleHash(password) === stored;
}

// register a new user and create their profile
function dbRegister(userData) {
    const users = dbGet(DB_KEYS.users);
    const profiles = dbGet(DB_KEYS.profiles);

    // check for duplicates
    if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        throw new Error('Username already taken');
    }
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Email already registered');
    }

    // validate fields
    if (!userData.username || userData.username.length < 3) {
        throw new Error('Username must be at least 3 characters');
    }
    if (!userData.password || userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new Error('Please enter a valid email');
    }
    if (!userData.age || userData.age < 18) {
        throw new Error('You must be 18 or older');
    }

    const userId = dbNextId();

    const user = {
        id: userId,
        username: userData.username,
        email: userData.email,
        passwordHash: simpleHash(userData.password),
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isActive: true
    };
    users.push(user);
    dbSet(DB_KEYS.users, users);

    // grey default avatar (svg encoded as base64)
    const defaultPhoto = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiBmaWxsPSIjYzRjNGM0Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2VlZWVlZSIvPjxjaXJjbGUgY3g9IjY0IiBjeT0iNDUiIHI9IjIyIi8+PHBhdGggZD0iTTY0IDc1YzI4IDAgNDIgMTUgNDIgMzV2MThIMjJWMTEwYzAtMjAgMTQtMzUgNDItMzV6Ii8+PC9zdmc+';

    const profileId = dbNextId();
    const profile = {
        id: profileId,
        userId: userId,
        username: userData.username,
        name: userData.name || userData.username,
        age: userData.age || 18,
        gender: userData.gender || '',
        lookingFor: userData.lookingFor || 'Everyone',
        bio: '',
        location: '',
        profilePhotoUrl: defaultPhoto,
        photos: [defaultPhoto],
        interests: [],
        hobbies: [],
        hairColor: '',
        skinTone: '',
        eyeColor: '',
        bodyType: '',
        ethnicity: '',
        heightCm: null,
        smoking: '',
        drinking: '',
        education: '',
        occupation: '',
        minAge: 18,
        maxAge: 100,
        maxDistance: 50,
        updatedAt: new Date().toISOString()
    };
    profiles.push(profile);
    dbSet(DB_KEYS.profiles, profiles);

    // fake jwt token for local use
    const token = 'local_token_' + userId + '_' + Date.now();

    return {
        token: token,
        userId: userId,
        username: user.username,
        name: profile.name
    };
}

// login with username and password
function dbLogin(username, password) {
    const users = dbGet(DB_KEYS.users);
    const user = users.find(u => u.username === username);

    if (!user) {
        throw new Error('Invalid username or password');
    }

    if (!verifyHash(password, user.passwordHash)) {
        throw new Error('Invalid username or password');
    }

    // update last active
    user.lastActive = new Date().toISOString();
    dbSet(DB_KEYS.users, users);

    const profiles = dbGet(DB_KEYS.profiles);
    const profile = profiles.find(p => p.userId === user.id);

    const token = 'local_token_' + user.id + '_' + Date.now();

    return {
        token: token,
        userId: user.id,
        username: user.username,
        name: profile?.name || user.username
    };
}

// get the current user's profile
function dbGetMyProfile(userId) {
    const profiles = dbGet(DB_KEYS.profiles);
    return profiles.find(p => p.userId === userId) || null;
}

// get any profile by its id
function dbGetProfileById(profileId) {
    const profiles = dbGet(DB_KEYS.profiles);
    return profiles.find(p => p.id === profileId) || null;
}

// update profile fields
function dbUpdateProfile(userId, updates) {
    const profiles = dbGet(DB_KEYS.profiles);
    const index = profiles.findIndex(p => p.userId === userId);
    if (index === -1) return null;

    // if username is being changed, check it's unique
    if (updates.username) {
        const users = dbGet(DB_KEYS.users);
        const taken = users.find(u => u.username === updates.username && u.id !== userId);
        if (taken) throw new Error('Username already taken');

        const userIdx = users.findIndex(u => u.id === userId);
        if (userIdx !== -1) {
            users[userIdx].username = updates.username.trim();
            dbSet(DB_KEYS.users, users);
        }
        profiles[index].username = updates.username.trim();
    }

    // apply all the fields that were sent
    const fields = ['name','bio','location','profilePhotoUrl','photos','interests',
        'hobbies','hairColor','skinTone','eyeColor','bodyType','ethnicity',
        'heightCm','smoking','drinking','education','occupation',
        'minAge','maxAge','maxDistance','lookingFor','age'];

    fields.forEach(f => {
        if (updates[f] !== undefined && updates[f] !== null) {
            profiles[index][f] = typeof updates[f] === 'string' ? updates[f].trim() : updates[f];
        }
    });

    profiles[index].updatedAt = new Date().toISOString();
    dbSet(DB_KEYS.profiles, profiles);

    return profiles[index];
}

// get discovery profiles - excludes self and already-swiped, applies filters
function dbGetDiscoveryProfiles(userId, filters = {}) {
    const profiles = dbGet(DB_KEYS.profiles);
    const likes = dbGet(DB_KEYS.likes);
    const myProfile = profiles.find(p => p.userId === userId);

    const swipedIds = likes.filter(l => l.fromUserId === userId).map(l => l.toUserId);

    let results = profiles.filter(p => {
        if (p.userId === userId) return false;
        if (swipedIds.includes(p.userId)) return false;

        // gender filter
        const genderFilter = filters.gender || myProfile?.lookingFor;
        if (genderFilter && genderFilter !== 'Everyone' && p.gender !== genderFilter) return false;

        // age filter
        const minAge = filters.minAge || myProfile?.minAge || 18;
        const maxAge = filters.maxAge || myProfile?.maxAge || 100;
        if (p.age < minAge || p.age > maxAge) return false;

        // appearance filters
        if (filters.hairColor && p.hairColor !== filters.hairColor) return false;
        if (filters.skinTone && p.skinTone !== filters.skinTone) return false;
        if (filters.eyeColor && p.eyeColor !== filters.eyeColor) return false;
        if (filters.bodyType && p.bodyType !== filters.bodyType) return false;
        if (filters.ethnicity && p.ethnicity !== filters.ethnicity) return false;
        if (filters.smoking && p.smoking !== filters.smoking) return false;
        if (filters.drinking && p.drinking !== filters.drinking) return false;

        return true;
    });

    // shuffle
    results.sort(() => Math.random() - 0.5);

    const count = filters.count || 10;
    return results.slice(0, count);
}

// process a swipe (like/dislike)
function dbSwipe(userId, targetUserId, isLike, isSuperLike = false) {
    const likes = dbGet(DB_KEYS.likes);

    // don't duplicate
    if (likes.find(l => l.fromUserId === userId && l.toUserId === targetUserId)) {
        return { isMatch: false };
    }

    // always record the swipe so profile doesn't reappear
    likes.push({
        id: dbNextId(),
        fromUserId: userId,
        toUserId: targetUserId,
        isLike: isLike,
        isSuperLike: isSuperLike,
        createdAt: new Date().toISOString()
    });
    dbSet(DB_KEYS.likes, likes);

    if (!isLike) return { isMatch: false };

    // check for mutual like (both must be actual likes)
    const mutual = likes.find(l => l.fromUserId === targetUserId && l.toUserId === userId && l.isLike !== false);
    if (mutual) {
        const matches = dbGet(DB_KEYS.matches);
        const matchId = dbNextId();
        matches.push({
            id: matchId,
            user1Id: Math.min(userId, targetUserId),
            user2Id: Math.max(userId, targetUserId),
            matchedAt: new Date().toISOString(),
            isActive: true
        });
        dbSet(DB_KEYS.matches, matches);

        const profiles = dbGet(DB_KEYS.profiles);
        const matchedProfile = profiles.find(p => p.userId === targetUserId);

        return {
            isMatch: true,
            match: {
                id: matchId,
                matchedAt: new Date().toISOString(),
                matchedUser: matchedProfile || {}
            }
        };
    }

    return { isMatch: false };
}

// get all active matches for a user
function dbGetMatches(userId) {
    const matches = dbGet(DB_KEYS.matches);
    const profiles = dbGet(DB_KEYS.profiles);
    const messages = dbGet(DB_KEYS.messages);

    return matches
        .filter(m => (m.user1Id === userId || m.user2Id === userId) && m.isActive)
        .map(m => {
            const matchedUserId = m.user1Id === userId ? m.user2Id : m.user1Id;
            const matchedProfile = profiles.find(p => p.userId === matchedUserId);

            const matchMessages = messages
                .filter(msg => msg.matchId === m.id)
                .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

            const lastMessage = matchMessages[0] || null;
            const unreadCount = matchMessages.filter(msg => !msg.isRead && msg.senderId !== userId).length;

            return {
                id: m.id,
                matchedAt: m.matchedAt,
                matchedUser: matchedProfile || {},
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    senderId: lastMessage.senderId,
                    content: lastMessage.content,
                    sentAt: lastMessage.sentAt,
                    isRead: lastMessage.isRead,
                    isMine: lastMessage.senderId === userId
                } : null,
                unreadCount: unreadCount
            };
        })
        .sort((a, b) => {
            const timeA = new Date(a.lastMessage?.sentAt || a.matchedAt);
            const timeB = new Date(b.lastMessage?.sentAt || b.matchedAt);
            return timeB - timeA;
        });
}

// unmatch
function dbUnmatch(userId, matchId) {
    const matches = dbGet(DB_KEYS.matches);
    const match = matches.find(m => m.id === matchId && (m.user1Id === userId || m.user2Id === userId));
    if (!match) return false;

    match.isActive = false;
    dbSet(DB_KEYS.matches, matches);
    return true;
}

// get likes received (people who liked you but aren't matched yet)
function dbGetLikesReceived(userId) {
    const likes = dbGet(DB_KEYS.likes);
    const matches = dbGet(DB_KEYS.matches);
    const profiles = dbGet(DB_KEYS.profiles);

    // only count actual likes, not dislikes
    const likerIds = likes.filter(l => l.toUserId === userId && l.isLike !== false).map(l => l.fromUserId);
    const matchedIds = matches
        .filter(m => m.user1Id === userId || m.user2Id === userId)
        .map(m => m.user1Id === userId ? m.user2Id : m.user1Id);

    return profiles.filter(p => likerIds.includes(p.userId) && !matchedIds.includes(p.userId));
}

// send a message
function dbSendMessage(senderId, matchId, content) {
    const matches = dbGet(DB_KEYS.matches);
    const match = matches.find(m => m.id === matchId && (m.user1Id === senderId || m.user2Id === senderId) && m.isActive);
    if (!match) return null;

    const trimmed = content?.trim();
    if (!trimmed || trimmed.length > 500) return null;

    const profiles = dbGet(DB_KEYS.profiles);
    const senderProfile = profiles.find(p => p.userId === senderId);

    const messages = dbGet(DB_KEYS.messages);
    const msg = {
        id: dbNextId(),
        matchId: matchId,
        senderId: senderId,
        senderName: senderProfile?.name || 'Unknown',
        content: trimmed,
        sentAt: new Date().toISOString(),
        isRead: false,
        isMine: true
    };
    messages.push(msg);
    dbSet(DB_KEYS.messages, messages);

    return msg;
}

// get messages for a match, mark incoming as read
function dbGetMessages(userId, matchId) {
    const messages = dbGet(DB_KEYS.messages);

    const matchMessages = messages
        .filter(m => m.matchId === matchId)
        .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

    // mark incoming messages as read
    let changed = false;
    matchMessages.forEach(m => {
        if (!m.isRead && m.senderId !== userId) {
            m.isRead = true;
            changed = true;
        }
    });
    if (changed) dbSet(DB_KEYS.messages, messages);

    return matchMessages.map(m => ({
        ...m,
        isMine: m.senderId === userId
    }));
}

// count unread messages across all matches
function dbGetUnreadCount(userId) {
    const matches = dbGet(DB_KEYS.matches);
    const messages = dbGet(DB_KEYS.messages);

    const myMatchIds = matches
        .filter(m => (m.user1Id === userId || m.user2Id === userId) && m.isActive)
        .map(m => m.id);

    return messages.filter(m => myMatchIds.includes(m.matchId) && m.senderId !== userId && !m.isRead).length;
}

// delete a message
function dbDeleteMessage(userId, messageId) {
    const messages = dbGet(DB_KEYS.messages);
    const idx = messages.findIndex(m => m.id === messageId && m.senderId === userId);
    if (idx === -1) return false;

    messages.splice(idx, 1);
    dbSet(DB_KEYS.messages, messages);
    return true;
}

// seed demo data on first load
function seedDemoData() {
    if (localStorage.getItem(DB_KEYS.seeded)) return;

    const demoHash = simpleHash('Password123!');

    const users = [
        { id: 1, username: 'alex_adventure', email: 'alex@example.com', passwordHash: demoHash, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true },
        { id: 2, username: 'emma_sunset', email: 'emma@example.com', passwordHash: demoHash, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true },
        { id: 3, username: 'mike_music', email: 'mike@example.com', passwordHash: demoHash, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true },
        { id: 4, username: 'sophie_books', email: 'sophie@example.com', passwordHash: demoHash, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true },
        { id: 5, username: 'james_fitness', email: 'james@example.com', passwordHash: demoHash, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true },
        { id: 6, username: 'olivia_art', email: 'olivia@example.com', passwordHash: demoHash, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), isActive: true },
    ];

    const profiles = [
        {
            id: 11, userId: 1, username: 'alex_adventure', name: 'Alex', age: 24, gender: 'Male', lookingFor: 'Female',
            bio: 'Adventure seeker 🌍 Love hiking, photography, and trying new cuisines. Always planning my next trip!',
            location: 'London, UK',
            profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
            interests: ['Photography', 'Travel', 'Cooking'],
            hobbies: ['Hiking', 'Photography', 'Cooking', 'Travelling'],
            hairColor: 'Brown', skinTone: 'Light', eyeColor: 'Blue', bodyType: 'Athletic',
            ethnicity: '', heightCm: 180, smoking: 'Never', drinking: 'Socially',
            education: 'University', occupation: 'Photographer',
            minAge: 20, maxAge: 30, maxDistance: 50, updatedAt: new Date().toISOString()
        },
        {
            id: 12, userId: 2, username: 'emma_sunset', name: 'Emma', age: 22, gender: 'Female', lookingFor: 'Male',
            bio: 'Sunset chaser 🌅 Coffee enthusiast ☕ Dog mom. Looking for someone to share adventures with!',
            location: 'Manchester, UK',
            profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400',
            photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400'],
            interests: ['Dogs', 'Coffee', 'Yoga'],
            hobbies: ['Coffee', 'Dogs', 'Yoga', 'Reading'],
            hairColor: 'Blonde', skinTone: 'Fair', eyeColor: 'Green', bodyType: 'Slim',
            ethnicity: '', heightCm: 165, smoking: 'Never', drinking: 'Socially',
            education: 'University', occupation: 'Marketing Manager',
            minAge: 21, maxAge: 32, maxDistance: 50, updatedAt: new Date().toISOString()
        },
        {
            id: 13, userId: 3, username: 'mike_music', name: 'Mike', age: 26, gender: 'Male', lookingFor: 'Female',
            bio: 'Music producer by day, chef by night 🎵🍳 Let me cook you dinner and play you a song!',
            location: 'Birmingham, UK',
            profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
            photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
            interests: ['Music', 'Cooking', 'Guitar'],
            hobbies: ['Music', 'Cooking', 'Guitar', 'Gaming'],
            hairColor: 'Black', skinTone: 'Medium', eyeColor: 'Brown', bodyType: 'Average',
            ethnicity: '', heightCm: 175, smoking: 'Occasionally', drinking: 'Socially',
            education: 'College', occupation: 'Music Producer',
            minAge: 22, maxAge: 30, maxDistance: 50, updatedAt: new Date().toISOString()
        },
        {
            id: 14, userId: 4, username: 'sophie_books', name: 'Sophie', age: 23, gender: 'Female', lookingFor: 'Male',
            bio: 'Bookworm 📚 Tea lover ☕ Yoga enthusiast 🧘‍♀️ Looking for deep conversations and cozy movie nights.',
            location: 'Edinburgh, UK',
            profilePhotoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
            photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
            interests: ['Books', 'Yoga', 'Movies'],
            hobbies: ['Reading', 'Yoga', 'Movies', 'Tea'],
            hairColor: 'Red', skinTone: 'Fair', eyeColor: 'Hazel', bodyType: 'Slim',
            ethnicity: '', heightCm: 163, smoking: 'Never', drinking: 'Rarely',
            education: 'Masters', occupation: 'Teacher',
            minAge: 23, maxAge: 35, maxDistance: 50, updatedAt: new Date().toISOString()
        },
        {
            id: 15, userId: 5, username: 'james_fitness', name: 'James', age: 27, gender: 'Male', lookingFor: 'Female',
            bio: 'Personal trainer 💪 Weekend hiker ⛰️ Amateur chef. Let\'s grab coffee and talk about our goals!',
            location: 'Leeds, UK',
            profilePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
            photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
            interests: ['Fitness', 'Hiking', 'Cooking'],
            hobbies: ['Fitness', 'Hiking', 'Cooking', 'Football'],
            hairColor: 'Brown', skinTone: 'Medium', eyeColor: 'Brown', bodyType: 'Athletic',
            ethnicity: '', heightCm: 183, smoking: 'Never', drinking: 'Socially',
            education: 'University', occupation: 'Personal Trainer',
            minAge: 21, maxAge: 30, maxDistance: 50, updatedAt: new Date().toISOString()
        },
        {
            id: 16, userId: 6, username: 'olivia_art', name: 'Olivia', age: 25, gender: 'Female', lookingFor: 'Male',
            bio: 'Artist 🎨 Gallery hopper. I\'ll probably want to draw you. Looking for my muse and best friend.',
            location: 'Bristol, UK',
            profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
            photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
            interests: ['Art', 'Museums', 'Photography'],
            hobbies: ['Painting', 'Drawing', 'Museums', 'Photography'],
            hairColor: 'Black', skinTone: 'Dark', eyeColor: 'Brown', bodyType: 'Curvy',
            ethnicity: '', heightCm: 170, smoking: 'Never', drinking: 'Occasionally',
            education: 'University', occupation: 'Artist',
            minAge: 24, maxAge: 34, maxDistance: 50, updatedAt: new Date().toISOString()
        }
    ];

    dbSet(DB_KEYS.users, users);
    dbSet(DB_KEYS.profiles, profiles);
    dbSet(DB_KEYS.likes, []);
    dbSet(DB_KEYS.matches, []);
    dbSet(DB_KEYS.messages, []);
    localStorage.setItem(DB_KEYS.nextId, '100');
    localStorage.setItem(DB_KEYS.seeded, 'true');

    console.log('Zelove: demo data seeded into localStorage');
}

// seed on load
seedDemoData();
