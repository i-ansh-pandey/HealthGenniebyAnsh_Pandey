/**
 * Health Assistant - Main JavaScript File
 * Handles UI interactions, API calls, and app initialization
 */

// Global variables
let currentUser = null;
let waterChart = null;
let stepsChart = null;
let stepCounterInterval = null;
let isStepCounterActive = false;

// API Base URL - Update this to your deployed server URL
const API_BASE_URL = window.location.origin;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Health Assistant App Initialized');
    initializeEventListeners();
    loadUserSession();
    initializeCharts();
    loadTodayData();
});

/**
 * Set up event listeners for forms and buttons
 */
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // BMI form
    const bmiForm = document.getElementById('bmiForm');
    if (bmiForm) {
        bmiForm.addEventListener('submit', calculateBMI);
    }

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Handle user login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    if (!phoneNumber) {
        showAlert('Please enter a valid phone number', 'warning');
        return;
    }

    // Validate phone number format
    if (!/^\d{10,15}$/.test(phoneNumber)) {
        showAlert('Please enter a valid phone number (10-15 digits)', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone_number: phoneNumber })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            sessionStorage.setItem('userLoggedIn', 'true');
            sessionStorage.setItem('userPhone', phoneNumber);
            
            // Close login modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            
            // Show profile section
            document.getElementById('profile').style.display = 'block';
            
            showAlert('Welcome to Health Assistant!', 'success');
            loadUserData();
            loadTodayData();
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

/**
 * Load user session from storage
 */
function loadUserSession() {
    const isLoggedIn = sessionStorage.getItem('userLoggedIn');
    const userPhone = sessionStorage.getItem('userPhone');
    
    if (isLoggedIn && userPhone) {
        document.getElementById('profile').style.display = 'block';
        loadUserData();
    }
}

/**
 * Load user profile data
 */
async function loadUserData() {
    try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Update profile form
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profileAge').value = user.age || '';
            document.getElementById('profileGender').value = user.gender || '';
            document.getElementById('profileActivity').value = user.activity_level || 'moderate';
            
            // Update BMI fields if available
            if (user.height) document.getElementById('height').value = user.height;
            if (user.weight) document.getElementById('weight').value = user.weight;
            
            // Update BMI preview
            if (user.bmi) {
                updateBMIPreview(user.bmi, user.bmi_category);
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Update user profile
 */
async function updateProfile(event) {
    event.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value.trim(),
        age: parseInt(document.getElementById('profileAge').value),
        gender: document.getElementById('profileGender').value,
        activity_level: document.getElementById('profileActivity').value
    };

    // Include height and weight from BMI form if available
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    
    if (height) profileData.height = parseFloat(height);
    if (weight) profileData.weight = parseFloat(weight);

    try {
        const response = await fetch('/api/user/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Profile updated successfully!', 'success');
            
            // Update BMI preview if calculated
            if (data.user.bmi) {
                updateBMIPreview(data.user.bmi, data.user.bmi_category);
            }
        } else {
            showAlert(data.error || 'Failed to update profile', 'danger');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

/**
 * Calculate BMI
 */
async function calculateBMI(event) {
    event.preventDefault();
    
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    
    if (!height || !weight || height <= 0 || weight <= 0) {
        showAlert('Please enter valid height and weight values', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/bmi/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ height, weight })
        });

        const data = await response.json();

        if (response.ok) {
            displayBMIResult(data);
            updateBMIPreview(data.bmi, data.category);
        } else {
            showAlert(data.error || 'Failed to calculate BMI', 'danger');
        }
    } catch (error) {
        console.error('BMI calculation error:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

/**
 * Display BMI calculation result
 */
function displayBMIResult(bmiData) {
    const resultDiv = document.getElementById('bmi-result');
    
    const resultHTML = `
        <div class="bmi-result-card fade-in">
            <div class="bmi-score ${bmiData.color}">${bmiData.bmi}</div>
            <div class="bmi-category ${bmiData.color}">${bmiData.category}</div>
            <div class="text-muted">
                <small>Healthy BMI range: ${bmiData.healthy_range}</small>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Consult with a healthcare provider for personalized advice.
                </small>
            </div>
        </div>
    `;
    
    resultDiv.innerHTML = resultHTML;
}

/**
 * Update BMI preview in dashboard
 */
function updateBMIPreview(bmi, category) {
    const previewDiv = document.getElementById('bmi-preview');
    
    let colorClass = 'text-muted';
    if (category === 'Normal weight') colorClass = 'text-success';
    else if (category === 'Overweight') colorClass = 'text-warning';
    else if (category === 'Obese') colorClass = 'text-danger';
    else if (category === 'Underweight') colorClass = 'text-info';
    
    previewDiv.innerHTML = `
        <div class="metric-value ${colorClass}">${bmi}</div>
        <small class="text-muted">${category}</small>
    `;
}

/**
 * Initialize charts for water and steps tracking
 */
function initializeCharts() {
    initializeWaterChart();
    initializeStepsChart();
}

/**
 * Initialize water intake chart
 */
function initializeWaterChart() {
    const ctx = document.getElementById('waterChart');
    if (!ctx) return;
    
    waterChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Consumed', 'Remaining'],
            datasets: [{
                data: [0, 2500],
                backgroundColor: ['#0dcaf0', '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' ml';
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

/**
 * Initialize steps chart
 */
function initializeStepsChart() {
    const ctx = document.getElementById('stepsChart');
    if (!ctx) return;
    
    stepsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Steps', 'Remaining'],
            datasets: [{
                data: [0, 10000],
                backgroundColor: ['#198754', '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw.toLocaleString() + ' steps';
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

/**
 * Load today's data for water and steps
 */
async function loadTodayData() {
    await Promise.all([
        loadWaterData(),
        loadStepsData()
    ]);
}

/**
 * Load today's water intake data
 */
async function loadWaterData() {
    try {
        const response = await fetch('/api/water/today');
        if (response.ok) {
            const data = await response.json();
            updateWaterDisplay(data.daily_total, data.goal, data.percentage);
        }
    } catch (error) {
        console.error('Error loading water data:', error);
    }
}

/**
 * Load today's steps data
 */
async function loadStepsData() {
    try {
        const response = await fetch('/api/steps/today');
        if (response.ok) {
            const data = await response.json();
            updateStepsDisplay(data.daily_total, data.goal, data.percentage);
        }
    } catch (error) {
        console.error('Error loading steps data:', error);
    }
}

/**
 * Add water intake
 */
async function addWater(amount) {
    try {
        const response = await fetch('/api/water/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();

        if (response.ok) {
            updateWaterDisplay(data.daily_total, data.goal, data.percentage);
            showAlert(`Added ${amount}ml to your water intake!`, 'success');
        } else {
            showAlert(data.error || 'Failed to log water intake', 'danger');
        }
    } catch (error) {
        console.error('Water logging error:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

/**
 * Add custom water amount
 */
function addCustomWater() {
    const amount = parseInt(document.getElementById('customWaterAmount').value);
    
    if (!amount || amount <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
    }
    
    addWater(amount);
    document.getElementById('customWaterAmount').value = '';
}

/**
 * Update water display
 */
function updateWaterDisplay(current, goal, percentage) {
    // Update chart
    if (waterChart) {
        waterChart.data.datasets[0].data = [current, Math.max(0, goal - current)];
        waterChart.update();
    }
    
    // Update stats
    document.getElementById('water-current').textContent = current + ' ml';
    document.getElementById('water-remaining').textContent = Math.max(0, goal - current) + ' ml';
    
    // Update preview in dashboard
    const previewDiv = document.getElementById('water-preview');
    previewDiv.innerHTML = `
        <div class="progress" style="height: 8px;">
            <div class="progress-bar bg-info" role="progressbar" style="width: ${Math.min(100, percentage)}%"></div>
        </div>
        <small class="text-muted">${current} / ${goal} ml</small>
    `;
}

/**
 * Simulate step counter (for demo purposes)
 */
function simulateSteps() {
    const button = document.getElementById('stepCounterBtn');
    
    if (isStepCounterActive) {
        // Stop counting
        clearInterval(stepCounterInterval);
        isStepCounterActive = false;
        button.innerHTML = '<i class="fas fa-play me-2"></i>Start Step Counter';
        button.classList.remove('btn-danger');
        button.classList.add('btn-success');
    } else {
        // Start counting
        isStepCounterActive = true;
        button.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Counter';
        button.classList.remove('btn-success');
        button.classList.add('btn-danger');
        
        stepCounterInterval = setInterval(() => {
            const randomSteps = Math.floor(Math.random() * 50) + 10; // 10-60 steps per interval
            addSteps(randomSteps);
        }, 3000); // Every 3 seconds
    }
}

/**
 * Add steps
 */
async function addSteps(steps) {
    try {
        const response = await fetch('/api/steps/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ steps })
        });

        const data = await response.json();

        if (response.ok) {
            updateStepsDisplay(data.daily_total, data.goal, data.percentage);
            
            if (!isStepCounterActive) {
                showAlert(`Added ${steps} steps!`, 'success');
            }
        } else {
            showAlert(data.error || 'Failed to log steps', 'danger');
        }
    } catch (error) {
        console.error('Steps logging error:', error);
        if (!isStepCounterActive) {
            showAlert('Network error. Please try again.', 'danger');
        }
    }
}

/**
 * Add custom steps amount
 */
function addCustomSteps() {
    const steps = parseInt(document.getElementById('customStepsAmount').value);
    
    if (!steps || steps <= 0) {
        showAlert('Please enter a valid step count', 'warning');
        return;
    }
    
    addSteps(steps);
    document.getElementById('customStepsAmount').value = '';
}

/**
 * Update steps display
 */
function updateStepsDisplay(current, goal, percentage) {
    // Update chart
    if (stepsChart) {
        stepsChart.data.datasets[0].data = [current, Math.max(0, goal - current)];
        stepsChart.update();
    }
    
    // Update stats
    document.getElementById('steps-current').textContent = current.toLocaleString();
    document.getElementById('steps-remaining').textContent = Math.max(0, goal - current).toLocaleString();
    
    // Update preview in dashboard
    const previewDiv = document.getElementById('steps-preview');
    previewDiv.innerHTML = `
        <div class="progress" style="height: 8px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${Math.min(100, percentage)}%"></div>
        </div>
        <small class="text-muted">${current.toLocaleString()} / ${goal.toLocaleString()} steps</small>
    `;
}

/**
 * Generate health tip
 */
async function generateTip() {
    const tipContent = document.getElementById('health-tip-content');
    const spinner = tipContent.querySelector('.spinner-border');
    const shareBtn = document.getElementById('shareTipBtn');
    
    // Show loading state
    spinner.style.display = 'block';
    tipContent.querySelector('p').style.display = 'none';
    
    try {
        const response = await fetch('/api/tips/generate');
        const data = await response.json();
        
        if (response.ok) {
            currentHealthTip = data;
            
            tipContent.innerHTML = `
                <div class="fade-in">
                    <h6 class="text-primary">${data.tip.title}</h6>
                    <p class="small text-muted">${data.tip.content}</p>
                    <span class="badge bg-primary">${data.tip.category}</span>
                </div>
            `;
            
            shareBtn.style.display = 'block';
        } else {
            throw new Error(data.error || 'Failed to generate tip');
        }
    } catch (error) {
        console.error('Error generating tip:', error);
        tipContent.innerHTML = `
            <div class="text-danger small">
                <i class="fas fa-exclamation-triangle me-1"></i>
                Failed to generate tip. Please try again.
            </div>
        `;
    } finally {
        spinner.style.display = 'none';
    }
}

/**
 * Share health tip on social media
 */
function shareHealthTip() {
    if (!currentHealthTip) {
        showAlert('No health tip to share', 'warning');
        return;
    }
    
    const shareText = currentHealthTip.share_text;
    const shareUrl = window.location.origin;
    
    // Try to use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Health Tip from Health Assistant',
            text: shareText,
            url: shareUrl
        }).then(() => {
            showAlert('Health tip shared successfully!', 'success');
        }).catch((error) => {
            console.error('Error sharing:', error);
            fallbackShare(shareText, shareUrl);
        });
    } else {
        fallbackShare(shareText, shareUrl);
    }
}

/**
 * Fallback sharing method
 */
function fallbackShare(text, url) {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    
    const shareOptions = [
        {
            name: 'WhatsApp',
            url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
            icon: 'fab fa-whatsapp'
        },
        {
            name: 'Twitter',
            url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            icon: 'fab fa-twitter'
        },
        {
            name: 'Facebook',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
            icon: 'fab fa-facebook'
        },
        {
            name: 'Copy Link',
            action: () => {
                navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
                    showAlert('Health tip copied to clipboard!', 'success');
                });
            },
            icon: 'fas fa-copy'
        }
    ];
    
    // Create share modal
    const shareModal = `
        <div class="modal fade" id="shareModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Share Health Tip</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-grid gap-2">
                            ${shareOptions.map(option => 
                                option.action ? 
                                `<button class="btn btn-outline-primary" onclick="${option.action.toString().slice(6, -1)}">
                                    <i class="${option.icon} me-2"></i>${option.name}
                                </button>` :
                                `<a href="${option.url}" target="_blank" class="btn btn-outline-primary">
                                    <i class="${option.icon} me-2"></i>${option.name}
                                </a>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing share modal
    const existingModal = document.getElementById('shareModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new share modal
    document.body.insertAdjacentHTML('beforeend', shareModal);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    modal.show();
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Utility function to format numbers
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Utility function to validate phone numbers
 */
function validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
}

/**
 * Get health summary
 */
async function getHealthSummary() {
    try {
        const response = await fetch('/api/health/summary');
        if (response.ok) {
            const data = await response.json();
            console.log('Health Summary:', data);
            return data;
        }
    } catch (error) {
        console.error('Error getting health summary:', error);
    }
    return null;
}

// Export functions for use in other scripts
window.HealthApp = {
    addWater,
    addCustomWater,
    addSteps,
    addCustomSteps,
    simulateSteps,
    generateTip,
    shareHealthTip,
    showAlert,
    getHealthSummary
};
