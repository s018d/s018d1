/**
 * Tutorial System - Energy Rush
 * نظام التعليمات
 * MIT License - Core Prime MVP
 */

class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 3;
        this.isActive = false;
        this.overlay = document.getElementById('tutorial-overlay');
        this.skipPermanently = localStorage.getItem('er_skip_tutorial') === 'true';
    }

    start() {
        if (this.skipPermanently) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.classList.remove('hidden');
        this.showStep(1);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Next buttons
        document.querySelectorAll('.tutorial-next').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });
        
        // Complete button
        document.querySelector('.tutorial-complete').addEventListener('click', () => this.complete());
        
        // Skip button
        document.getElementById('skip-tutorial').addEventListener('click', () => this.skipForever());
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.tutorial-step').forEach(step => {
            step.classList.add('hidden');
        });
        
        // Show current step
        const currentStep = document.getElementById(`tutorial-step-${stepNumber}`);
        if (currentStep) {
            currentStep.classList.remove('hidden');
            this.currentStep = stepNumber;
            this.executeStepActions(stepNumber);
        }
    }

    executeStepActions(stepNumber) {
        switch (stepNumber) {
            case 1:
                this.step1Generator();
                break;
            case 2:
                this.step2Hazard();
                break;
            case 3:
                this.step3Abilities();
                break;
        }
    }

    step1Generator() {
        // Spawn a generator and highlight it
        setTimeout(() => {
            const gameArea = document.getElementById('game-area');
            const generator = document.createElement('div');
            generator.className = 'spawned-element pulse';
            generator.setAttribute('data-type', 'gen');
            generator.style.left = '50%';
            generator.style.top = '50%';
            generator.style.transform = 'translate(-50%, -50%)';
            
            gameArea.appendChild(generator);
            
            // Make this generator clickable for tutorial
            generator.addEventListener('click', () => {
                window.game.addEnergy(10);
                Sound.play('click');
                generator.classList.remove('pulse');
                setTimeout(() => this.nextStep(), 1000);
            });
        }, 500);
    }

    step2Hazard() {
        // Spawn a hazard and explain
        setTimeout(() => {
            const gameArea = document.getElementById('game-area');
            const hazard = document.createElement('div');
            hazard.className = 'spawned-element';
            hazard.setAttribute('data-type', 'hazard');
            hazard.style.left = '30%';
            hazard.style.top = '30%';
            hazard.style.transform = 'translate(-50%, -50%)';
            
            gameArea.appendChild(hazard);
            
            // Make this hazard clickable for tutorial (but don't penalize)
            hazard.addEventListener('click', () => {
                hazard.classList.add('animate-shake');
                setTimeout(() => {
                    hazard.remove();
                    this.nextStep();
                }, 1000);
            });
        }, 500);
    }

    step3Abilities() {
        // Explain abilities
        const abilityBar = document.querySelector('.abilities-bar');
        abilityBar.classList.add('pulse');
        
        // Remove pulse when any ability is clicked
        document.querySelectorAll('.ability-slot').forEach(slot => {
            const originalClick = slot.onclick;
            slot.onclick = (e) => {
                abilityBar.classList.remove('pulse');
                slot.onclick = originalClick;
            };
        });
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    complete() {
        this.isActive = false;
        this.overlay.classList.add('hidden');
        
        // Clear game area
        document.getElementById('game-area').innerHTML = '';
        
        // Mark tutorial as seen
        localStorage.setItem('er_seen_tutorial', 'true');
        
        // Start the actual game
        setTimeout(() => {
            window.game.startGame();
        }, 500);
    }

    skipForever() {
        this.skipPermanently = true;
        localStorage.setItem('er_skip_tutorial', 'true');
        this.complete();
    }

    reset() {
        localStorage.removeItem('er_seen_tutorial');
        localStorage.removeItem('er_skip_tutorial');
    }

    isTutorialSeen() {
        return localStorage.getItem('er_seen_tutorial') === 'true';
    }
}

export { Tutorial };