/**
 * Energy Rush: Genesis Protocol - Main Game Controller
 * نظام التحكم الرئيسي للعبة
 * MIT License - Core Prime MVP
 */

import { AiSystem } from './ai_system.js';
import { Abilities } from './abilities.js';
import { LevelManager } from './levels.js';
import { Tutorial } from './tutorial.js';
import { EventSystem } from './events.js';
import { Store } from './store.js';

class Game {
    constructor() {
        this.currentScreen = 'start';
        this.isPlaying = false;
        this.energy = 0;
        this.maxEnergy = 100;
        this.timeLeft = 30;
        this.timerInterval = null;
        this.score = 0;
        this.multiplier = 1;
        
        this.config = {};
        this.settings = {
            aiComments: true,
            sound: true,
            theme: 'neon-blue'
        };
        
        this.initializeGame();
    }

    async initializeGame() {
        await this.loadConfig();
        this.loadSettings();
        this.setupEventListeners();
        this.applyTheme();
        
        // Initialize systems
        this.aiSystem = new AiSystem();
        this.abilities = new Abilities();
        this.levelManager = new LevelManager();
        this.tutorial = new Tutorial();
        this.eventSystem = new EventSystem();
        this.store = new Store();

        // Check for first-time tutorial
        if (!localStorage.getItem('er_seen_tutorial')) {
            this.tutorial.start();
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('./data/config.json');
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
            this.config = {
                level1: {
                    duration: 30,
                    spawnRate: 1000,
                    energyGoal: 100
                }
            };
        }
    }

    loadSettings() {
        this.settings.aiComments = localStorage.getItem('er_ai_comments') !== 'false';
        this.settings.sound = localStorage.getItem('er_sound') !== 'false';
        this.settings.theme = localStorage.getItem('er_theme') || 'neon-blue';
        
        // Update UI to match settings
        document.getElementById('ai-comments-toggle').checked = this.settings.aiComments;
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('theme-selector').value = this.settings.theme;
    }

    setupEventListeners() {
        // Screen navigation
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('settings-btn').addEventListener('click', () => this.showModal('settings-modal'));
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        
        // Modal controls
        document.getElementById('settings-close').addEventListener('click', () => this.hideModal('settings-modal'));
        document.getElementById('leaderboard-close').addEventListener('click', () => this.hideModal('leaderboard-modal'));
        document.getElementById('workshop-close').addEventListener('click', () => this.hideModal('workshop-modal'));
        
        // Settings changes
        document.getElementById('ai-comments-toggle').addEventListener('change', (e) => {
            this.settings.aiComments = e.target.checked;
            localStorage.setItem('er_ai_comments', this.settings.aiComments);
            this.toggleAIComments();
        });
        
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            localStorage.setItem('er_sound', this.settings.sound);
            Sound.mute(!this.settings.sound);
        });
        
        document.getElementById('theme-selector').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            localStorage.setItem('er_theme', this.settings.theme);
            this.applyTheme();
        });

        // Results screen buttons
        document.getElementById('retry-btn').addEventListener('click', () => this.startGame());
        document.getElementById('workshop-btn').addEventListener('click', () => this.showWorkshop());
        document.getElementById('menu-btn').addEventListener('click', () => this.showScreen('start-screen'));

        // Ability clicks
        document.querySelectorAll('.ability-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const ability = slot.dataset.ability;
                this.abilities.use(ability);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    toggleAIComments() {
        const aiBox = document.getElementById('ai-comments');
        if (this.settings.aiComments) {
            aiBox.classList.remove('hidden');
        } else {
            aiBox.classList.add('hidden');
        }
    }

    startGame() {
        this.showScreen('game-screen');
        this.resetGame();
        this.startLevel();
    }

    resetGame() {
        this.energy = 0;
        this.timeLeft = this.config.level1?.duration || 30;
        this.score = 0;
        this.multiplier = 1;
        this.isPlaying = true;
        
        this.updateEnergyDisplay();
        this.updateTimerDisplay();
        
        // Clear game area
        document.getElementById('game-area').innerHTML = '';
    }

    startLevel() {
        this.levelManager.startLevel('level1');
        this.startTimer();
        
        if (this.settings.aiComments) {
            this.aiSystem.show('ابدأ بجمع الطاقة من المولدات الزرقاء', 'info');
        }
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateEnergyDisplay() {
        const percentage = (this.energy / this.maxEnergy) * 100;
        document.getElementById('energy-fill').style.width = `${percentage}%`;
        document.getElementById('energy-text').textContent = `${this.energy}/${this.maxEnergy}`;
        
        // Update color based on energy level
        const energyFill = document.getElementById('energy-fill');
        if (percentage < 30) {
            energyFill.style.background = 'linear-gradient(90deg, var(--danger-color), #ff0000)';
        } else if (percentage < 70) {
            energyFill.style.background = 'linear-gradient(90deg, var(--warning-color), #ffaa00)';
        } else {
            energyFill.style.background = 'linear-gradient(90deg, var(--success-color), var(--primary-color))';
        }
    }

    addEnergy(amount) {
        this.energy = Math.min(this.energy + amount, this.maxEnergy);
        this.updateEnergyDisplay();
        
        // Check win condition
        if (this.energy >= this.maxEnergy) {
            this.endGame(true);
        }
    }

    removeEnergy(amount) {
        this.energy = Math.max(this.energy - amount, 0);
        this.updateEnergyDisplay();
    }

    addTime(seconds) {
        this.timeLeft += seconds;
        this.updateTimerDisplay();
    }

    endGame(isWin) {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        this.levelManager.stopSpawning();
        
        this.showResults(isWin);
    }

    showResults(isWin) {
        const resultsScreen = document.getElementById('results-screen');
        const title = document.getElementById('results-title');
        const message = document.getElementById('results-message');
        const finalEnergy = document.getElementById('final-energy');
        const qpointsEarned = document.getElementById('qpoints-earned');
        
        if (isWin) {
            title.textContent = 'Mission Accomplished!';
            message.textContent = 'Core Prime stabilized successfully!';
            title.style.color = 'var(--success-color)';
            
            // Calculate QPoints earned
            const points = Math.floor(this.energy * 2 + this.timeLeft * 3);
            this.store.addQPoints(points);
            qpointsEarned.textContent = points;
            
            if (this.settings.aiComments) {
                this.aiSystem.show('ممتاز! البروتوكول نشط بالكامل', 'success');
            }
        } else {
            title.textContent = 'Mission Failed';
            message.textContent = 'Energy levels insufficient for Core Prime activation.';
            title.style.color = 'var(--danger-color)';
            qpointsEarned.textContent = '0';
            
            if (this.settings.aiComments) {
                this.aiSystem.show('لا بأس، جرب مرة أخرى', 'warning');
            }
        }
        
        finalEnergy.textContent = this.energy;
        this.showScreen('results-screen');
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showLeaderboard() {
        this.store.displayLeaderboard();
        this.showModal('leaderboard-modal');
    }

    showWorkshop() {
        this.store.displayWorkshop();
        this.showModal('workshop-modal');
    }
}

// Sound Manager
class Sound {
    static play(soundName) {
        // Placeholder for sound implementation
        // Developer Note: Replace with actual audio files
        // ملاحظة للمطور: استبدل بملفات الصوت الفعلية
        console.log(`Playing sound: ${soundName}`);
    }

    static mute(muted) {
        // Placeholder for mute functionality
        console.log(`Sound ${muted ? 'muted' : 'unmuted'}`);
    }
}

// Effects Manager
class Effects {
    static onGeneratorClick(x, y) {
        // Placeholder for visual effects
        // Developer Note: Add particle effects here
        // ملاحظة للمطور: أضف تأثيرات الجسيمات هنا
        console.log(`Generator effect at ${x}, ${y}`);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// Export for other modules
export { Game, Sound, Effects };