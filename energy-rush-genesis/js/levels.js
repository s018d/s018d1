/**
 * Level Management System - Energy Rush
 * نظام إدارة المستويات
 * MIT License - Core Prime MVP
 */

class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.isSpawning = false;
        this.spawnInterval = null;
        this.spawnedElements = [];
        this.spawnRate = 1000; // ms
        this.spawnCount = 0;
        
        this.levels = {
            level1: {
                name: 'Core Prime',
                duration: 30,
                spawnRate: 1000,
                energyGoal: 100,
                spawnPool: [
                    { type: 'gen', weight: 5 },
                    { type: 'hazard', weight: 3 },
                    { type: 'freeze', weight: 1 },
                    { type: 'rare', weight: 0.5 }
                ]
            }
        };
    }

    startLevel(levelId) {
        this.currentLevel = this.levels[levelId];
        if (!this.currentLevel) return;
        
        this.isSpawning = true;
        this.spawnedElements = [];
        this.spawnCount = 0;
        this.spawnRate = this.currentLevel.spawnRate;
        
        // Start spawning
        this.startSpawning();
        
        // Schedule spawn rate increases
        this.scheduleSpawnAcceleration();
    }

    startSpawning() {
        this.spawnInterval = setInterval(() => {
            if (this.isSpawning) {
                this.spawnElement();
            }
        }, this.spawnRate);
    }

    spawnElement() {
        const gameArea = document.getElementById('game-area');
        if (!gameArea) return;
        
        const elementType = this.weightedRandomSpawn();
        const position = this.getValidSpawnPosition();
        
        if (!position) return; // No valid position found
        
        const element = this.createElement(elementType, position);
        gameArea.appendChild(element);
        
        this.spawnedElements.push({
            element: element,
            type: elementType,
            position: position
        });
        
        this.spawnCount++;
    }

    weightedRandomSpawn() {
        const pool = this.currentLevel.spawnPool;
        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of pool) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }
        
        return pool[0].type; // fallback
    }

    getValidSpawnPosition() {
        const gameArea = document.getElementById('game-area');
        const areaRect = gameArea.getBoundingClientRect();
        
        const elementSize = 60; // Approximate size of spawned elements
        const padding = 10;
        
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            const x = padding + Math.random() * (areaRect.width - elementSize - padding * 2);
            const y = padding + Math.random() * (areaRect.height - elementSize - padding * 2);
            
            if (this.isPositionValid(x, y, elementSize)) {
                return { x, y };
            }
            
            attempts++;
        }
        
        return null; // Could not find valid position
    }

    isPositionValid(x, y, size) {
        // Basic collision check with existing elements
        for (const spawned of this.spawnedElements) {
            const otherX = spawned.position.x;
            const otherY = spawned.position.y;
            const distance = Math.sqrt((x - otherX) ** 2 + (y - otherY) ** 2);
            
            if (distance < size + 20) { // 20px minimum spacing
                return false;
            }
        }
        
        return true;
    }

    createElement(type, position) {
        const element = document.createElement('div');
        element.className = `spawned-element animate-pop`;
        element.setAttribute('data-type', type);
        
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;
        
        // Add click handler
        element.addEventListener('click', () => this.handleElementClick(type, element, position));
        
        // Auto-remove after some time (prevent overcrowding)
        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
                this.removeFromSpawned(element);
            }
        }, 8000); // Remove after 8 seconds
        
        return element;
    }

    handleElementClick(type, element, position) {
        if (!window.game.isPlaying) return;
        
        // Remove element
        element.remove();
        this.removeFromSpawned(element);
        
        // Handle different types
        switch (type) {
            case 'gen':
                this.handleGeneratorClick(position);
                break;
            case 'hazard':
                this.handleHazardClick();
                break;
            case 'freeze':
                this.handleFreezeClick();
                break;
            case 'rare':
                this.handleRareClick();
                break;
        }
    }

    handleGeneratorClick(position) {
        let energyGain = 10;
        
        // Check for turbo multiplier
        if (window.game.turboActive && window.game.turboClicks > 0) {
            energyGain *= 2;
            window.game.turboClicks--;
            
            if (window.game.turboClicks <= 0) {
                window.game.turboActive = false;
            }
        }
        
        // Apply multiplier
        energyGain *= window.game.multiplier;
        
        window.game.addEnergy(energyGain);
        Sound.play('click');
        Effects.onGeneratorClick(position.x, position.y);
        
        // Visual feedback
        const element = document.querySelector(`[data-type="gen"]`);
        if (element) {
            element.classList.add('animate-bounce');
            setTimeout(() => element.classList.remove('animate-bounce'), 500);
        }
    }

    handleHazardClick() {
        window.game.removeEnergy(15);
        Sound.play('alert');
        
        // Visual feedback
        const element = document.querySelector(`[data-type="hazard"]`);
        if (element) {
            element.classList.add('animate-shake');
            setTimeout(() => element.classList.remove('animate-shake'), 500);
        }
        
        // AI comments
        if (window.game.settings.aiComments) {
            if (window.game.energy < 30) {
                window.aiSystem.onFirstWrongClick();
            } else {
                window.aiSystem.onMultipleWrongClicks();
            }
            
            window.aiSystem.show('خطأ — تجنّب الأحمر', 'warning');
        }
    }

    handleFreezeClick() {
        window.abilities.addCharge(25);
        Sound.play('click');
        
        // Visual feedback
        const element = document.querySelector(`[data-type="freeze"]`);
        if (element) {
            element.classList.add('glow');
            setTimeout(() => element.classList.remove('glow'), 1000);
        }
        
        if (window.game.settings.aiComments) {
            window.aiSystem.show('شحنة قدرة +25%', 'info');
        }
    }

    handleRareClick() {
        window.game.addEnergy(20);
        window.game.multiplier = 2;
        Sound.play('click');
        
        // Visual feedback
        const element = document.querySelector(`[data-type="rare"]`);
        if (element) {
            element.classList.add('animate-bounce');
            setTimeout(() => element.classList.remove('animate-bounce'), 500);
        }
        
        // Reset multiplier after 5 seconds
        setTimeout(() => {
            window.game.multiplier = 1;
        }, 5000);
        
        if (window.game.settings.aiComments) {
            window.aiSystem.show('كريستال نادر! مضاعفة النقاط', 'success');
        }
    }

    removeFromSpawned(element) {
        this.spawnedElements = this.spawnedElements.filter(
            item => item.element !== element
        );
    }

    scheduleSpawnAcceleration() {
        // Increase spawn rate every 10 seconds
        let timePassed = 0;
        const accelerationInterval = setInterval(() => {
            if (!window.game.isPlaying) {
                clearInterval(accelerationInterval);
                return;
            }
            
            timePassed += 1;
            
            if (timePassed % 10 === 0 && this.spawnRate > 400) {
                this.spawnRate = Math.max(400, this.spawnRate - 100); // Faster spawning
                this.updateSpawnInterval();
            }
            
            if (timePassed >= (this.currentLevel.duration || 30)) {
                clearInterval(accelerationInterval);
            }
        }, 1000);
    }

    updateSpawnInterval() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.startSpawning();
        }
    }

    stopSpawning() {
        this.isSpawning = false;
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
        
        // Clear all spawned elements
        this.spawnedElements.forEach(item => {
            if (item.element.parentNode) {
                item.element.remove();
            }
        });
        this.spawnedElements = [];
    }

    getCurrentLevel() {
        return this.currentLevel;
    }
}

export { LevelManager };