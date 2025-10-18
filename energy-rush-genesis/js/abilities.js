/**
 * Abilities System - Energy Rush
 * نظام القدرات الخاصة
 * MIT License - Core Prime MVP
 */

class Abilities {
    constructor() {
        this.abilities = {
            freeze: {
                name: 'Freeze Time',
                cost: 25,
                cooldown: 15000, // 15 seconds
                available: true,
                lastUsed: 0,
                icon: '❄️'
            },
            turbo: {
                name: 'Turbo Collect',
                cost: 30,
                cooldown: 20000, // 20 seconds
                available: true,
                lastUsed: 0,
                icon: '⚡'
            },
            quantumVision: {
                name: 'Quantum Vision',
                cost: 40,
                cooldown: 25000, // 25 seconds
                available: true,
                lastUsed: 0,
                icon: '👁️'
            }
        };
        
        this.charge = 0;
        this.maxCharge = 100;
        
        this.initializeUI();
    }

    initializeUI() {
        // Set up ability slot event listeners
        document.querySelectorAll('.ability-slot').forEach(slot => {
            const abilityName = slot.dataset.ability;
            const ability = this.abilities[abilityName];
            
            if (ability) {
                const icon = slot.querySelector('.ability-icon');
                icon.textContent = ability.icon;
            }
        });
        
        this.updateUI();
    }

    use(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability || !ability.available) return false;
        
        // Check energy cost
        if (window.game.energy < ability.cost) {
            if (window.game.settings.aiComments) {
                window.aiSystem.show('طاقة غير كافية لهذه القدرة', 'warning');
            }
            return false;
        }
        
        // Apply energy cost
        window.game.removeEnergy(ability.cost);
        
        // Set cooldown
        ability.available = false;
        ability.lastUsed = Date.now();
        
        // Execute ability effect
        this.executeAbility(abilityName);
        
        // Update UI
        this.updateUI();
        
        // Start cooldown timer
        setTimeout(() => {
            ability.available = true;
            this.updateUI();
            
            if (window.game.settings.aiComments) {
                window.aiSystem.onAbilityReady(abilityName);
            }
        }, ability.cooldown);
        
        return true;
    }

    executeAbility(abilityName) {
        switch (abilityName) {
            case 'freeze':
                this.useFreeze();
                break;
            case 'turbo':
                this.useTurbo();
                break;
            case 'quantumVision':
                this.useQuantumVision();
                break;
        }
        
        // Play sound effect
        Sound.play('ability');
    }

    useFreeze() {
        // Add 3 seconds to timer
        window.game.addTime(3);
        
        // Visual feedback
        const timer = document.getElementById('timer');
        timer.classList.add('glow');
        setTimeout(() => timer.classList.remove('glow'), 1000);
        
        if (window.game.settings.aiComments) {
            window.aiSystem.show('الوقت متجمد +3 ثواني', 'info');
        }
    }

    useTurbo() {
        // Double energy from next 5 clicks
        window.game.turboActive = true;
        window.game.turboClicks = 5;
        
        // Visual feedback
        const energyMeter = document.querySelector('.energy-meter');
        energyMeter.classList.add('glow');
        setTimeout(() => energyMeter.classList.remove('glow'), 3000);
        
        if (window.game.settings.aiComments) {
            window.aiSystem.show('Turbo نشط - الطاقة مضاعفة', 'info');
        }
    }

    useQuantumVision() {
        // Highlight rare elements for 8 seconds
        const rareElements = document.querySelectorAll('[data-type="rare"]');
        rareElements.forEach(element => {
            element.classList.add('pulse');
        });
        
        setTimeout(() => {
            rareElements.forEach(element => {
                element.classList.remove('pulse');
            });
        }, 8000);
        
        if (window.game.settings.aiComments) {
            window.aiSystem.show('Quantum Vision نشط - ابحث عن الكريستالات', 'info');
        }
    }

    addCharge(amount) {
        this.charge = Math.min(this.charge + amount, this.maxCharge);
        this.updateUI();
    }

    updateUI() {
        Object.keys(this.abilities).forEach(abilityName => {
            const ability = this.abilities[abilityName];
            const slot = document.querySelector(`[data-ability="${abilityName}"]`);
            
            if (!slot) return;
            
            const cooldownOverlay = slot.querySelector('.cooldown-overlay');
            
            if (!ability.available) {
                slot.classList.add('cooldown');
                
                // Calculate cooldown progress
                const elapsed = Date.now() - ability.lastUsed;
                const progress = (elapsed / ability.cooldown) * 100;
                cooldownOverlay.style.height = `${100 - progress}%`;
            } else {
                slot.classList.remove('cooldown');
                cooldownOverlay.style.height = '0%';
            }
            
            // Update tooltip or status
            slot.title = ability.available ? 
                `${ability.name} (Cost: ${ability.cost} energy)` : 
                'On cooldown';
        });
    }

    getAbilityStatus(abilityName) {
        return this.abilities[abilityName] || null;
    }

    resetAll() {
        Object.keys(this.abilities).forEach(abilityName => {
            this.abilities[abilityName].available = true;
            this.abilities[abilityName].lastUsed = 0;
        });
        this.charge = 0;
        this.updateUI();
    }
}

export { Abilities };