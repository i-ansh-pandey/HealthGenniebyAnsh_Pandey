/**
 * Health Tracker - Advanced Health Tracking and Analytics
 * Provides enhanced functionality for health metrics tracking, visualization, and goal management
 */

// Health tracking configuration
const HEALTH_CONFIG = {
    water: {
        defaultGoal: 2500, // ml
        maxDailyIntake: 5000, // ml
        reminderInterval: 60 * 60 * 1000, // 1 hour in milliseconds
        quickAmounts: [250, 500, 750, 1000] // ml
    },
    steps: {
        defaultGoal: 10000,
        maxDailySteps: 50000,
        caloriesPerStep: 0.04, // approximate calories burned per step
        kmPerStep: 0.0008 // approximate distance per step in km
    },
    bmi: {
        categories: {
            underweight: { min: 0, max: 18.5, color: '#17a2b8', advice: 'Consider consulting a healthcare provider about healthy weight gain' },
            normal: { min: 18.5, max: 25, color: '#28a745', advice: 'Maintain your current healthy weight through balanced diet and exercise' },
            overweight: { min: 25, max: 30, color: '#ffc107', advice: 'Consider gradual weight loss through caloric deficit and increased activity' },
            obese: { min: 30, max: 100, color: '#dc3545', advice: 'Consult healthcare provider for personalized weight management plan' }
        }
    },
    health: {
        moodScale: { min: 1, max: 10 },
        energyScale: { min: 1, max: 10 },
        sleepRange: { min: 0, max: 24 },
        heartRateRange: { min: 40, max: 200 }
    }
};

// Global health tracking state
let healthTracker = {
    goals: {
        water: HEALTH_CONFIG.water.defaultGoal,
        steps: HEALTH_CONFIG.steps.defaultGoal,
        sleep: 8,
        weight: null
    },
    reminders: {
        water: null,
        exercise: null,
        sleep: null
    },
    currentStreak: {
        water: 0,
        steps: 0,
        exercise: 0
    },
    weeklyData: {
        water: [],
        steps: [],
        weight: [],
        mood: [],
        energy: []
    }
};

/**
 * Initialize advanced health tracking features
 */
function initializeHealthTracker() {
    console.log('Initializing Advanced Health Tracker...');
    
    // Load saved goals and preferences
    loadHealthGoals();
    
    // Setup automatic reminders
    setupHealthReminders();
    
    // Initialize advanced charts
    initializeAdvancedCharts();
    
    // Setup health data sync
    setupHealthDataSync();
    
    // Initialize goal progress animations
    initializeProgressAnimations();
    
    console.log('Advanced Health Tracker initialized successfully');
}

/**
 * Load user health goals from localStorage or defaults
 */
function loadHealthGoals() {
    const savedGoals = localStorage.getItem('healthGoals');
    if (savedGoals) {
        try {
            healthTracker.goals = { ...healthTracker.goals, ...JSON.parse(savedGoals) };
        } catch (error) {
            console.error('Error loading saved health goals:', error);
        }
    }
    
    // Update UI with loaded goals
    updateGoalDisplays();
}

/**
 * Save health goals to localStorage
 */
function saveHealthGoals() {
    try {
        localStorage.setItem('healthGoals', JSON.stringify(healthTracker.goals));
    } catch (error) {
        console.error('Error saving health goals:', error);
    }
}

/**
 * Update goal displays in the UI
 */
function updateGoalDisplays() {
    // Update water goal display
    const waterGoalElements = document.querySelectorAll('[data-water-goal]');
    waterGoalElements.forEach(el => {
        el.textContent = `${healthTracker.goals.water} ml`;
    });
    
    // Update steps goal display
    const stepsGoalElements = document.querySelectorAll('[data-steps-goal]');
    stepsGoalElements.forEach(el => {
        el.textContent = healthTracker.goals.steps.toLocaleString();
    });
}

/**
 * Setup health reminders
 */
function setupHealthReminders() {
    // Water intake reminder
    if (healthTracker.reminders.water) {
        clearInterval(healthTracker.reminders.water);
    }
    
    healthTracker.reminders.water = setInterval(() => {
        showHealthReminder('water', 'Time for some hydration! 💧');
    }, HEALTH_CONFIG.water.reminderInterval);
    
    // Daily exercise reminder (once per day at 6 PM)
    const now = new Date();
    const exerciseTime = new Date();
    exerciseTime.setHours(18, 0, 0, 0); // 6 PM
    
    if (now > exerciseTime) {
        exerciseTime.setDate(exerciseTime.getDate() + 1);
    }
    
    const timeToExercise = exerciseTime.getTime() - now.getTime();
    setTimeout(() => {
        showHealthReminder('exercise', 'Time for your daily exercise! 🏃‍♂️');
        
        // Set daily recurring reminder
        healthTracker.reminders.exercise = setInterval(() => {
            showHealthReminder('exercise', 'Time for your daily exercise! 🏃‍♂️');
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeToExercise);
}

/**
 * Show health reminder notification
 */
function showHealthReminder(type, message) {
    // Check if user has been active recently (don't spam with reminders)
    const lastActivity = localStorage.getItem(`lastActivity_${type}`);
    const now = Date.now();
    
    if (lastActivity && (now - parseInt(lastActivity)) < 30 * 60 * 1000) {
        return; // Skip reminder if user was active in last 30 minutes
    }
    
    // Create reminder notification
    const reminder = document.createElement('div');
    reminder.className = 'health-reminder alert alert-info alert-dismissible fade show position-fixed';
    reminder.style.cssText = `
        top: 80px; 
        right: 20px; 
        z-index: 9999; 
        max-width: 300px;
        animation: slideInRight 0.5s ease-out;
    `;
    
    reminder.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-bell me-2"></i>
            <div>
                <strong>Health Reminder</strong><br>
                <small>${message}</small>
            </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(reminder);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (reminder.parentNode) {
            reminder.remove();
        }
    }, 10000);
}

/**
 * Initialize advanced charts with animations and interactions
 */
function initializeAdvancedCharts() {
    // Enhanced water chart with gradient
    enhanceWaterChart();
    
    // Enhanced steps chart with progress ring
    enhanceStepsChart();
    
    // Initialize weekly progress chart
    initializeWeeklyChart();
    
    // Initialize health metrics chart
    initializeHealthMetricsChart();
}

/**
 * Enhance water chart with gradient and animations
 */
function enhanceWaterChart() {
    if (!waterChart) return;
    
    const ctx = waterChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#74b9ff');
    gradient.addColorStop(1, '#0984e3');
    
    waterChart.data.datasets[0].backgroundColor = [gradient, '#e9ecef'];
    waterChart.options.animation = {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOutQuart'
    };
    
    // Add center text plugin
    waterChart.options.plugins.datalabels = {
        display: false
    };
    
    waterChart.update();
}

/**
 * Enhance steps chart with gradient and animations
 */
function enhanceStepsChart() {
    if (!stepsChart) return;
    
    const ctx = stepsChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#00b894');
    gradient.addColorStop(1, '#00a085');
    
    stepsChart.data.datasets[0].backgroundColor = [gradient, '#e9ecef'];
    stepsChart.options.animation = {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeOutQuart'
    };
    
    stepsChart.update();
}

/**
 * Initialize weekly progress chart
 */
function initializeWeeklyChart() {
    const weeklyCtx = document.getElementById('weeklyChart');
    if (!weeklyCtx) return;
    
    const weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Water (L)',
                    data: healthTracker.weeklyData.water,
                    borderColor: '#74b9ff',
                    backgroundColor: 'rgba(116, 185, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Steps (k)',
                    data: healthTracker.weeklyData.steps.map(steps => steps / 1000),
                    borderColor: '#00b894',
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Water (Liters)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Steps (Thousands)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    window.weeklyChart = weeklyChart;
}

/**
 * Initialize health metrics radar chart
 */
function initializeHealthMetricsChart() {
    const metricsCtx = document.getElementById('healthMetricsChart');
    if (!metricsCtx) return;
    
    const healthMetricsChart = new Chart(metricsCtx, {
        type: 'radar',
        data: {
            labels: ['Hydration', 'Activity', 'Sleep', 'Mood', 'Energy'],
            datasets: [{
                label: 'Health Score',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(116, 185, 255, 0.2)',
                borderColor: '#74b9ff',
                pointBackgroundColor: '#74b9ff',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#74b9ff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    window.healthMetricsChart = healthMetricsChart;
}

/**
 * Setup health data synchronization
 */
function setupHealthDataSync() {
    // Sync data every 5 minutes
    setInterval(syncHealthData, 5 * 60 * 1000);
    
    // Initial sync
    syncHealthData();
}

/**
 * Sync health data with server
 */
async function syncHealthData() {
    try {
        const response = await fetch('/api/health/summary');
        if (response.ok) {
            const data = await response.json();
            updateHealthMetrics(data);
        }
    } catch (error) {
        console.error('Error syncing health data:', error);
    }
}

/**
 * Update health metrics displays
 */
function updateHealthMetrics(data) {
    if (!data) return;
    
    // Update health metrics chart
    if (window.healthMetricsChart) {
        const scores = calculateHealthScores(data);
        window.healthMetricsChart.data.datasets[0].data = scores;
        window.healthMetricsChart.update();
    }
    
    // Update streak counters
    updateStreakCounters(data);
    
    // Update achievement badges
    checkAchievements(data);
}

/**
 * Calculate health scores for radar chart
 */
function calculateHealthScores(data) {
    const scores = [0, 0, 0, 0, 0]; // [Hydration, Activity, Sleep, Mood, Energy]
    
    if (data.today) {
        // Hydration score (0-100 based on water goal achievement)
        if (data.today.water) {
            scores[0] = Math.min(100, (data.today.water.current_ml / data.today.water.goal_ml) * 100);
        }
        
        // Activity score (0-100 based on steps goal achievement)
        if (data.today.steps) {
            scores[1] = Math.min(100, (data.today.steps.current_steps / data.today.steps.goal_steps) * 100);
        }
    }
    
    if (data.latest_health_record) {
        const record = data.latest_health_record;
        
        // Sleep score (0-100, optimal is 7-9 hours)
        if (record.sleep_hours) {
            const optimal = record.sleep_hours >= 7 && record.sleep_hours <= 9;
            scores[2] = optimal ? 100 : Math.max(0, 100 - Math.abs(8 - record.sleep_hours) * 15);
        }
        
        // Mood score (0-100, scale from 1-10 to 0-100)
        if (record.mood_score) {
            scores[3] = (record.mood_score - 1) * (100 / 9);
        }
        
        // Energy score (0-100, scale from 1-10 to 0-100)
        if (record.energy_level) {
            scores[4] = (record.energy_level - 1) * (100 / 9);
        }
    }
    
    return scores;
}

/**
 * Update streak counters
 */
function updateStreakCounters(data) {
    // Update water streak
    if (data.today?.water?.percentage >= 100) {
        healthTracker.currentStreak.water++;
    } else {
        healthTracker.currentStreak.water = 0;
    }
    
    // Update steps streak
    if (data.today?.steps?.percentage >= 100) {
        healthTracker.currentStreak.steps++;
    } else {
        healthTracker.currentStreak.steps = 0;
    }
    
    // Update streak displays
    updateStreakDisplays();
}

/**
 * Update streak displays in UI
 */
function updateStreakDisplays() {
    const waterStreak = document.getElementById('waterStreak');
    if (waterStreak) {
        waterStreak.textContent = `${healthTracker.currentStreak.water} days`;
    }
    
    const stepsStreak = document.getElementById('stepsStreak');
    if (stepsStreak) {
        stepsStreak.textContent = `${healthTracker.currentStreak.steps} days`;
    }
}

/**
 * Check and display achievements
 */
function checkAchievements(data) {
    const achievements = [];
    
    // Water achievements
    if (data.today?.water?.percentage >= 100) {
        achievements.push({
            title: 'Hydration Hero!',
            message: 'You met your daily water goal!',
            icon: 'fas fa-tint',
            color: 'info'
        });
    }
    
    // Steps achievements
    if (data.today?.steps?.percentage >= 100) {
        achievements.push({
            title: 'Step Champion!',
            message: 'You reached your daily step goal!',
            icon: 'fas fa-walking',
            color: 'success'
        });
    }
    
    // Streak achievements
    if (healthTracker.currentStreak.water >= 7) {
        achievements.push({
            title: 'Hydration Streak!',
            message: `${healthTracker.currentStreak.water} days of meeting your water goal!`,
            icon: 'fas fa-fire',
            color: 'warning'
        });
    }
    
    if (healthTracker.currentStreak.steps >= 7) {
        achievements.push({
            title: 'Activity Streak!',
            message: `${healthTracker.currentStreak.steps} days of meeting your step goal!`,
            icon: 'fas fa-trophy',
            color: 'warning'
        });
    }
    
    // Display achievements
    achievements.forEach((achievement, index) => {
        setTimeout(() => {
            showAchievement(achievement);
        }, index * 2000); // Stagger achievements
    });
}

/**
 * Show achievement notification
 */
function showAchievement(achievement) {
    const achievementEl = document.createElement('div');
    achievementEl.className = `achievement-notification alert alert-${achievement.color} alert-dismissible fade show position-fixed`;
    achievementEl.style.cssText = `
        top: 100px; 
        right: 20px; 
        z-index: 9999; 
        max-width: 350px;
        animation: bounceInRight 0.8s ease-out;
        border-left: 5px solid var(--bs-${achievement.color});
    `;
    
    achievementEl.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="${achievement.icon} me-3 fs-3"></i>
            <div>
                <strong>${achievement.title}</strong><br>
                <small>${achievement.message}</small>
            </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(achievementEl);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
        if (achievementEl.parentNode) {
            achievementEl.remove();
        }
    }, 8000);
}

/**
 * Initialize progress animations
 */
function initializeProgressAnimations() {
    // Animate progress bars with intersection observer
    const progressBars = document.querySelectorAll('.progress-bar');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.style.width;
                progressBar.style.width = '0%';
                
                setTimeout(() => {
                    progressBar.style.transition = 'width 1.5s ease-out';
                    progressBar.style.width = targetWidth;
                }, 100);
                
                observer.unobserve(progressBar);
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
}

/**
 * Calculate BMI with enhanced recommendations
 */
function calculateBMIEnhanced(height, weight, age, gender, activityLevel) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    let category = 'normal';
    let color = '#28a745';
    let advice = '';
    
    for (const [cat, config] of Object.entries(HEALTH_CONFIG.bmi.categories)) {
        if (bmi >= config.min && bmi < config.max) {
            category = cat;
            color = config.color;
            advice = config.advice;
            break;
        }
    }
    
    // Enhanced recommendations based on age, gender, and activity level
    const enhancedAdvice = generateEnhancedBMIAdvice(bmi, category, age, gender, activityLevel);
    
    return {
        bmi: Math.round(bmi * 10) / 10,
        category,
        color,
        advice,
        enhancedAdvice,
        idealWeightRange: calculateIdealWeightRange(height),
        calorieNeeds: calculateDailyCalorieNeeds(weight, height, age, gender, activityLevel)
    };
}

/**
 * Generate enhanced BMI advice
 */
function generateEnhancedBMIAdvice(bmi, category, age, gender, activityLevel) {
    const advice = [];
    
    // Age-specific advice
    if (age >= 65) {
        advice.push('• Seniors should focus on maintaining muscle mass through resistance training');
        advice.push('• Regular balance exercises can help prevent falls');
    } else if (age <= 25) {
        advice.push('• Building healthy habits now will benefit you throughout life');
        advice.push('• Focus on sustainable lifestyle changes rather than quick fixes');
    }
    
    // Gender-specific advice
    if (gender === 'female') {
        advice.push('• Women should ensure adequate iron and calcium intake');
        advice.push('• Bone health is particularly important - include weight-bearing exercises');
    } else if (gender === 'male') {
        advice.push('• Men typically need more calories and protein for muscle maintenance');
        advice.push('• Regular cardiovascular exercise helps reduce risk of heart disease');
    }
    
    // Activity level advice
    switch (activityLevel) {
        case 'low':
            advice.push('• Start with 10-15 minutes of light activity daily');
            advice.push('• Take stairs instead of elevators when possible');
            break;
        case 'moderate':
            advice.push('• Aim for 150 minutes of moderate exercise per week');
            advice.push('• Mix cardio and strength training for best results');
            break;
        case 'high':
            advice.push('• Ensure adequate recovery time between intense sessions');
            advice.push('• Focus on proper nutrition to fuel your active lifestyle');
            break;
    }
    
    return advice;
}

/**
 * Calculate ideal weight range
 */
function calculateIdealWeightRange(heightCm) {
    const heightM = heightCm / 100;
    const minWeight = Math.round(18.5 * heightM * heightM);
    const maxWeight = Math.round(24.9 * heightM * heightM);
    
    return {
        min: minWeight,
        max: maxWeight,
        range: `${minWeight} - ${maxWeight} kg`
    };
}

/**
 * Calculate daily calorie needs
 */
function calculateDailyCalorieNeeds(weight, height, age, gender, activityLevel) {
    // Harris-Benedict Equation (Revised)
    let bmr;
    
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Activity multipliers
    const multipliers = {
        low: 1.2,      // Sedentary
        moderate: 1.55, // Moderately active
        high: 1.9      // Very active
    };
    
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));
    
    return {
        bmr: Math.round(bmr),
        tdee: tdee,
        weightLoss: Math.round(tdee - 500),  // 500 calorie deficit
        weightGain: Math.round(tdee + 500)   // 500 calorie surplus
    };
}

/**
 * Track water intake with detailed analytics
 */
function trackWaterIntakeAdvanced(amount, timestamp = new Date()) {
    // Record last activity for reminders
    localStorage.setItem('lastActivity_water', Date.now().toString());
    
    // Update streak tracking
    const today = new Date().toDateString();
    const waterHistory = JSON.parse(localStorage.getItem('waterHistory') || '{}');
    
    if (!waterHistory[today]) {
        waterHistory[today] = [];
    }
    
    waterHistory[today].push({
        amount,
        timestamp: timestamp.toISOString()
    });
    
    localStorage.setItem('waterHistory', JSON.stringify(waterHistory));
    
    // Calculate intake patterns
    const patterns = analyzeWaterIntakePatterns(waterHistory);
    
    return {
        dailyTotal: waterHistory[today].reduce((sum, entry) => sum + entry.amount, 0),
        patterns,
        recommendation: generateWaterRecommendation(patterns)
    };
}

/**
 * Analyze water intake patterns
 */
function analyzeWaterIntakePatterns(history) {
    const patterns = {
        averageDaily: 0,
        bestTime: '',
        consistency: 0,
        weeklyTrend: []
    };
    
    const days = Object.keys(history);
    if (days.length === 0) return patterns;
    
    // Calculate average daily intake
    const dailyTotals = days.map(day => 
        history[day].reduce((sum, entry) => sum + entry.amount, 0)
    );
    patterns.averageDaily = Math.round(dailyTotals.reduce((sum, total) => sum + total, 0) / days.length);
    
    // Find best hydration time
    const hourlyIntake = {};
    days.forEach(day => {
        history[day].forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            hourlyIntake[hour] = (hourlyIntake[hour] || 0) + entry.amount;
        });
    });
    
    const bestHour = Object.keys(hourlyIntake).reduce((a, b) => 
        hourlyIntake[a] > hourlyIntake[b] ? a : b
    );
    patterns.bestTime = `${bestHour}:00 - ${parseInt(bestHour) + 1}:00`;
    
    // Calculate consistency (lower standard deviation = more consistent)
    const mean = patterns.averageDaily;
    const variance = dailyTotals.reduce((sum, total) => sum + Math.pow(total - mean, 2), 0) / dailyTotals.length;
    patterns.consistency = Math.max(0, 100 - Math.sqrt(variance) / mean * 100);
    
    return patterns;
}

/**
 * Generate water intake recommendation
 */
function generateWaterRecommendation(patterns) {
    const recommendations = [];
    
    if (patterns.averageDaily < 2000) {
        recommendations.push('Try to increase your daily water intake gradually');
        recommendations.push('Set reminders every hour to drink a small amount');
    }
    
    if (patterns.consistency < 50) {
        recommendations.push('Try to maintain more consistent daily intake');
        recommendations.push('Consider using a water tracking app or bottle with markings');
    }
    
    if (patterns.bestTime) {
        recommendations.push(`You tend to hydrate best around ${patterns.bestTime} - keep it up!`);
    }
    
    return recommendations;
}

/**
 * Export health data for sharing or backup
 */
function exportHealthData() {
    const exportData = {
        goals: healthTracker.goals,
        streaks: healthTracker.currentStreak,
        waterHistory: JSON.parse(localStorage.getItem('waterHistory') || '{}'),
        stepsHistory: JSON.parse(localStorage.getItem('stepsHistory') || '{}'),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `health-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    return exportData;
}

/**
 * Import health data from backup
 */
function importHealthData(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const importData = JSON.parse(event.target.result);
            
            // Validate import data
            if (!importData.version || !importData.goals) {
                throw new Error('Invalid health data format');
            }
            
            // Import goals
            healthTracker.goals = { ...healthTracker.goals, ...importData.goals };
            saveHealthGoals();
            
            // Import history
            if (importData.waterHistory) {
                localStorage.setItem('waterHistory', JSON.stringify(importData.waterHistory));
            }
            
            if (importData.stepsHistory) {
                localStorage.setItem('stepsHistory', JSON.stringify(importData.stepsHistory));
            }
            
            // Import streaks
            if (importData.streaks) {
                healthTracker.currentStreak = { ...healthTracker.currentStreak, ...importData.streaks };
            }
            
            // Update UI
            updateGoalDisplays();
            updateStreakDisplays();
            
            showAlert('Health data imported successfully!', 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            showAlert('Failed to import health data. Please check the file format.', 'danger');
        }
    };
    
    reader.readAsText(file);
}

/**
 * Initialize health tracker when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a short delay to ensure other scripts are loaded
    setTimeout(initializeHealthTracker, 500);
});

// Add CSS animations for achievements and reminders
const healthTrackerStyles = `
<style>
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes bounceInRight {
    0% {
        transform: translateX(100%) scale(0.3);
        opacity: 0;
    }
    50% {
        transform: translateX(-10px) scale(1.05);
    }
    70% {
        transform: translateX(5px) scale(0.9);
    }
    100% {
        transform: translateX(0) scale(1);
        opacity: 1;
    }
}

.health-reminder {
    border-left: 4px solid #0dcaf0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.achievement-notification {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
}

.achievement-notification i {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}
</style>
`;

// Add styles to document head
document.head.insertAdjacentHTML('beforeend', healthTrackerStyles);

// Export health tracker functions for global access
window.HealthTracker = {
    trackWaterIntakeAdvanced,
    calculateBMIEnhanced,
    exportHealthData,
    importHealthData,
    updateHealthMetrics,
    checkAchievements,
    setupHealthReminders
};

