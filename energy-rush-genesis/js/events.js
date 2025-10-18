/**
 * Event System - Energy Rush
 * نظام الأحداث العشوائية
 * MIT License - Core Prime MVP
 */

class EventSystem {
    constructor() {
        this.activeEvents = new Map();
        this.eventInterval = null;
        this.eventChance = 0.3; // 30% chance every check
        this.checkInterval = 10000; // Check every 10 seconds
        
        this.availableEvents = {
            magneticSurge: {
                name: 'Magnetic Surge',
                duration: 5000, // 5 seconds
                weight: 2,
                active: false
            },
            powerSurge: {
                name: 'Power Surge',
                duration: 8000, // 8 seconds
                weight: 1.5,
                active: false
            }
        };
    }

    start() {
        this.eventInterval = setInterval(() => {
            if (window.game.isPlaying && Math.random() < this.eventChance) {
                this.triggerRandomEvent();
            }
        }, this.checkInterval);
    }

    stop() {
        if (this.eventInterval) {
            clearInterval(this.eventInterval);
            this.eventInterval = null;
        }
        
        // Clear all active events
        this.activeEvents.forEach((event, name) => {
            this.endEvent(name);
        });
        this.activeEvents.clear();
    }

    triggerRandomEvent() {
        const availableEvents = Object.entries(this.availableEvents)
            .filter(([name, event]) => !event.active)
            .map(([name, event]) => ({ name, ...event }));
        
        if (availableEvents.length === 0) return;
        
        const totalWeight = availableEvents.reduce((sum, event) => sum + event.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const event of availableEvents) {
            random -= event.weight;
            if (random <= 0) {
                this.startEvent(event.name);
                break;
            }
        }
    }

    startEvent(eventName) {
        const event = this.availableEvents[eventName];
        if (!event || event.active) return;
        
        event.active = true;
        this.activeEvents.set(eventName, {
            startTime: Date.now(),
            endTime: Date.now() + event.duration
        });
        
        this.applyEventEffect(eventName);
        this.showEventNotification(eventName);
        
        // Schedule event end
        setTimeout(() => {
            this.endEvent(eventName);
        }, event.duration);
    }

    applyEventEffect(eventName) {
        switch (eventName) {
            case 'magneticSurge':
                this.applyMagneticSurge();
                break;
            case 'powerSurge':
                this.applyPowerSurge();
                break;
        }
    }

    applyMagneticSurge() {
        // Speed up spawning for the event duration
        if (window.levelManager) {
            const originalSpawnRate = window.levelManager.spawnRate;
            window.levelManager.spawnRate = Math.max(300, originalSpawnRate - 300); // Much faster
            
            // Store original rate to restore later
            this.activeEvents.get('magneticSurge').originalSpawnRate = originalSpawnRate;
            window.levelManager.updateSpawnInterval();
        }
    }

    applyPowerSurge() {
        // Double energy from correct clicks
        window.game.powerSurgeActive = true;
        
        // Visual feedback
        const energyMeter = document.querySelector('.energy-meter');
        energyMeter.classList.add('glow');
    }

    endEvent(eventName) {
        const event = this.availableEvents[eventName];
        if (!event) return;
        
        event.active = false;
        this.activeEvents.delete(eventName);
        
        this.removeEventEffect(eventName);
        this.showEventEndNotification(eventName);
    }

    removeEventEffect(eventName) {
        switch (eventName) {
            case 'magneticSurge':
                this.removeMagneticSurge();
                break;
            case 'powerSurge':
                this.removePowerSurge();
                break;
        }
    }

    removeMagneticSurge() {
        // Restore original spawn rate
        const eventData = this.activeEvents.get('magneticSurge');
        if (eventData && window.levelManager) {
            window.levelManager.spawnRate = eventData.originalSpawnRate;
            window.levelManager.updateSpawnInterval();
        }
    }

    removePowerSurge() {
        // Remove power surge effect
        window.game.powerSurgeActive = false;
        
        // Remove visual feedback
        const energyMeter = document.querySelector('.energy-meter');
        energyMeter.classList.remove('glow');
    }

    showEventNotification(eventName) {
        // Show event banner (simplified - could be enhanced with proper banner)
        if (window.game.settings.aiComments) {
            window.aiSystem.onEventStart(eventName);
        }
        
        // Visual effect on game area
        const gameArea = document.getElementById('game-area');
        gameArea.classList.add('glow');
        setTimeout(() => gameArea.classList.remove('glow'), 1000);
        
        // Play sound effect
        Sound.play('event');
    }

    showEventEndNotification(eventName) {
        // Optional: notify when event ends
        console.log(`Event ended: ${eventName}`);
    }

    isEventActive(eventName) {
        return this.availableEvents[eventName]?.active || false;
    }

    getActiveEvents() {
        return Array.from(this.activeEvents.keys());
    }

    setEventChance(chance) {
        this.eventChance = Math.max(0, Math.min(1, chance));
    }

    setCheckInterval(interval) {
        this.checkInterval = interval;
        if (this.eventInterval) {
            this.stop();
            this.start();
        }
    }
}

export { EventSystem };