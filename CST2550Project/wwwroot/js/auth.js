
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        const currentPage = window.location.pathname;
        if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
            window.location.href = '/index.html';
        }
    }
});

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

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
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
        errorText.textContent = msg;
        errorDiv.classList.remove('hidden');

        if (typeof showToast === 'function') showToast(msg, 'error');

        setTimeout(() => {
            try { errorDiv.classList.add('hidden'); } catch (e) {}
        }, 4000);

        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span> <i class="fas fa-arrow-right"></i>';
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            useDemoAccount();
        });
    }
});

let currentStep = 1;

function nextStep() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('reg-password').value;
    
    if (!username || username.length < 3) {
        showError('Username must be at least 3 characters');
        return;
    }
    
    if (!email || !isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    currentStep = 2;
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.querySelector('.step[data-step="1"]').classList.remove('active');
    document.querySelector('.step[data-step="2"]').classList.add('active');
}

function prevStep() {
    currentStep = 1;
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    document.querySelector('.step[data-step="2"]').classList.remove('active');
    document.querySelector('.step[data-step="1"]').classList.add('active');
}

function showError(message) {
    const errorDiv = document.getElementById('registerError') || document.getElementById('loginError');
    const errorText = document.getElementById('registerErrorText') || document.getElementById('loginErrorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('name').value.trim();
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const lookingFor = document.getElementById('lookingFor').value;
    
    const registerBtn = document.getElementById('registerBtn');
    const errorDiv = document.getElementById('registerError');
    const errorText = document.getElementById('registerErrorText');
    
    if (!name) {
        showError('Please enter your name');
        return;
    }
    
    if (!age || age < 18 || age > 120) {
        showError('Please enter a valid age (18+)');
        return;
    }
    
    if (!gender) {
        showError('Please select your gender');
        return;
    }
    
    if (!lookingFor) {
        showError('Please select who you\'re interested in');
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
            age,
            gender,
            lookingFor
        });
        
        if (result) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        errorText.textContent = error.message || 'Registration failed. Please try again.';
        errorDiv.classList.remove('hidden');
        
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<span>Create Account</span> <i class="fas fa-check"></i>';
    }
}

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