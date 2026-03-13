// auth.js - login and registration

// redirect if already logged in
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        const currentPage = window.location.pathname;
        if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
            window.location.href = '/index.html';
        }
    }
});

// toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// check username is valid
function validateUsername(username) {
    if (!username || username.length == 0) {
        return { valid: false, message: 'Username is required' };
    }
    // only allow letters, numbers, underscore, dot
    for (var i = 0; i < username.length; i++) {
        var char = username[i];
        var isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
        var isNumber = char >= '0' && char <= '9';
        var isUnderscore = char == '_';
        var isDot = char == '.';
        
        if (!isLetter && !isNumber && !isUnderscore && !isDot) {
            return { valid: false, message: 'Username can only have letters, numbers, underscores and dots' };
        }
    }
    return { valid: true, message: '' };
}

// check password meets requirements
function validatePassword(password) {
    if (!password || password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }
    
    var hasLetter = false;
    var hasNumber = false;
    
    for (var i = 0; i < password.length; i++) {
        var char = password[i];
        var isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
        var isNumber = char >= '0' && char <= '9';
        var isAllowedSymbol = char == '!' || char == '$' || char == '@';
        
        if (isLetter) hasLetter = true;
        if (isNumber) hasNumber = true;
        
        // no quotes allowed
        if (char == '"' || char == "'") {
            return { valid: false, message: 'Password cannot contain " or \' characters' };
        }
        
        if (!isLetter && !isNumber && !isAllowedSymbol) {
            return { valid: false, message: 'Password can only use letters, numbers and symbols !, $, @' };
        }
    }
    
    if (!hasLetter) {
        return { valid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasNumber) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    
    return { valid: true, message: '' };
}

// check name only has letters
function validateName(name) {
    if (!name || name.length == 0) {
        return { valid: false, message: 'Name is required' };
    }
    for (var i = 0; i < name.length; i++) {
        var char = name[i];
        var isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
        var isSpace = char == ' ';
        
        if (!isLetter && !isSpace) {
            return { valid: false, message: 'Name can only contain letters' };
        }
    }
    return { valid: true, message: '' };
}

// check email format
function validateEmail(email) {
    if (!email || email.length == 0) {
        return { valid: false, message: 'Email is required' };
    }
    if (email.indexOf('@') == -1) {
        return { valid: false, message: 'Email must contain @' };
    }
    var parts = email.split('@');
    if (parts.length != 2) {
        return { valid: false, message: 'Email format is invalid' };
    }
    var beforeAt = parts[0];
    var afterAt = parts[1];
    
    if (beforeAt.length == 0) {
        return { valid: false, message: 'Email must have text before @' };
    }
    if (afterAt.length == 0) {
        return { valid: false, message: 'Email must have domain after @' };
    }
    if (afterAt.indexOf('.') == -1) {
        return { valid: false, message: 'Email domain must have a dot (like .com)' };
    }
    return { valid: true, message: '' };
}

// check age is 18+
function validateAge(age) {
    if (!age || isNaN(age)) {
        return { valid: false, message: 'Please enter your age' };
    }
    var ageNum = parseInt(age);
    if (ageNum < 18) {
        return { valid: false, message: 'You must be 18 or older to register' };
    }
    if (ageNum > 120) {
        return { valid: false, message: 'Please enter a valid age' };
    }
    return { valid: true, message: '' };
}

// login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
    // validate username
    var usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
        showError(usernameCheck.message);
        return;
    }
    
    // validate password
    var passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
        showError(passwordCheck.message);
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing in...</span> <i class="fas fa-spinner fa-spin"></i>';
    errorDiv.classList.add('hidden');
    
    try {
        const result = await login(username, password);
        
        if (result) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        let msg = error.message || 'Invalid username or password';
        if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
            msg = 'Cannot connect to server. Please make sure the app is running.';
        } else if (msg === 'Request failed') {
            msg = 'Invalid username or password';
        }

        if (typeof showToast === 'function') showToast(msg, 'error');

        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span> <i class="fas fa-arrow-right"></i>';
    }
}

// fills in demo credentials and submits
function useDemoAccount() {
    const demoUser = 'alex_adventure';
    const demoPass = 'Password123!';

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (usernameInput && passwordInput) {
        usernameInput.value = demoUser;
        passwordInput.value = demoPass;

        const fakeEvent = new Event('submit', { cancelable: true });
        handleLogin(fakeEvent);
    }
}

// wire up demo button
document.addEventListener('DOMContentLoaded', () => {
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            useDemoAccount();
        });
    }
});

// shows error via toast notification
function showError(message) {
    if (typeof showToast === 'function') showToast(message, 'error');
}

// registration form with validation
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    
    const registerBtn = document.getElementById('registerBtn');
    const errorDiv = document.getElementById('registerError');
    const errorText = document.getElementById('registerErrorText');
    
    // validate username first
    var usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
        showError(usernameCheck.message);
        return;
    }
    
    // validate email
    var emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
        showError(emailCheck.message);
        return;
    }
    
    // validate password
    var passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
        showError(passwordCheck.message);
        return;
    }
    
    // validate name (only letters)
    var nameCheck = validateName(name);
    if (!nameCheck.valid) {
        showError(nameCheck.message);
        return;
    }
    
    // validate age (18+)
    var ageCheck = validateAge(age);
    if (!ageCheck.valid) {
        showError(ageCheck.message);
        return;
    }
    
    if (!gender) {
        showError('Please select your gender');
        return;
    }
    
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span>Creating account...</span> <i class="fas fa-spinner fa-spin"></i>';
    errorDiv.classList.add('hidden');
    
    try {
        const result = await register({
            username,
            email,
            password,
            name,
            age: parseInt(age),
            gender
        });
        
        if (result) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
        
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<span>Create Account</span> <i class="fas fa-check"></i>';
    }
}

// password strength meter
const passwordInput = document.getElementById('reg-password');
if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
}

function updatePasswordStrength() {
    const password = document.getElementById('reg-password').value;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let text = '';
    let color = '';
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    if (strength <= 25) {
        text = 'Weak';
        color = '#e74c3c';
    } else if (strength <= 50) {
        text = 'Fair';
        color = '#f39c12';
    } else if (strength <= 75) {
        text = 'Good';
        color = '#3498db';
    } else {
        text = 'Strong';
        color = '#27ae60';
    }
    
    strengthBar.style.setProperty('--strength-width', strength + '%');
    strengthBar.style.background = `linear-gradient(to right, ${color} ${strength}%, #dfe6e9 ${strength}%)`;
    strengthText.textContent = text;
    strengthText.style.color = color;
}