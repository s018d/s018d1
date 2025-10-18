/**
 * Store & Progression System - Energy Rush
 * نظام المتجر والتقدم
 * MIT License - Core Prime MVP
 */

class Store {
    constructor() {
        this.qPoints = parseInt(localStorage.getItem('er_qpoints')) || 0;
        this.upgrades = JSON.parse(localStorage.getItem('er_upgrades')) || {
            startingEnergy: 0,
            hazardReduction: 0,
            extraAbility: false
        };
        
        this.leaderboard = JSON.parse(localStorage.getItem('er_leaderboard')) || [];
    }

    addQPoints(amount) {
        this.qPoints += amount;
        localStorage.setItem('er_qpoints', this.qPoints.toString());
        return this.qPoints;
    }

    spendQPoints(amount) {
        if (this.qPoints >= amount) {
            this.qPoints -= amount;
            localStorage.setItem('er_qpoints', this.qPoints.toString());
            return true;
        }
        return false;
    }

    getQPoints() {
        return this.qPoints;
    }

    purchaseUpgrade(upgradeType, cost) {
        if (!this.spendQPoints(cost)) {
            return false;
        }
        
        switch (upgradeType) {
            case 'startingEnergy':
                this.upgrades.startingEnergy += 10;
                break;
            case 'hazardReduction':
                this.upgrades.hazardReduction += 5;
                break;
            case 'extraAbility':
                this.upgrades.extraAbility = true;
                break;
        }
        
        localStorage.setItem('er_upgrades', JSON.stringify(this.upgrades));
        return true;
    }

    getUpgradeLevel(upgradeType) {
        return this.upgrades[upgradeType] || 0;
    }

    hasUpgrade(upgradeType) {
        return this.upgrades[upgradeType] !== undefined && this.upgrades[upgradeType] !== false;
    }

    applyUpgrades() {
        // Apply starting energy bonus
        if (this.upgrades.startingEnergy > 0 && window.game) {
            window.game.energy += this.upgrades.startingEnergy;
            window.game.updateEnergyDisplay();
        }
        
        // Note: Hazard reduction is applied in the click handler
        // Note: Extra ability slot would need UI implementation
    }

    displayWorkshop() {
        const workshopModal = document.getElementById('workshop-modal');
        const qpointsDisplay = document.getElementById('current-qpoints');
        const shopItems = document.querySelectorAll('.shop-item');
        
        // Update QPoints display
        qpointsDisplay.textContent = this.qPoints;
        
        // Update shop items state
        shopItems.forEach(item => {
            const upgradeType = item.dataset.upgrade;
            const buyBtn = item.querySelector('.buy-btn');
            const cost = parseInt(item.querySelector('p').textContent.match(/\d+/)[0]);
            
            // Check if already purchased
            if ((upgradeType === 'extraAbility' && this.upgrades.extraAbility) ||
                (upgradeType !== 'extraAbility' && this.getUpgradeLevel(upgradeType) >= 
                 (upgradeType === 'startingEnergy' ? 30 : 15))) { // Max levels
                
                buyBtn.textContent = 'Purchased';
                buyBtn.disabled = true;
                buyBtn.classList.remove('btn-primary');
                buyBtn.classList.add('btn-secondary');
            } else if (this.qPoints < cost) {
                buyBtn.disabled = true;
                buyBtn.title = 'Not enough QPoints';
            } else {
                buyBtn.disabled = false;
                buyBtn.title = '';
            }
            
            // Add purchase handler
            buyBtn.onclick = () => {
                if (this.purchaseUpgrade(upgradeType, cost)) {
                    this.displayWorkshop(); // Refresh display
                    
                    if (window.game.settings.aiComments) {
                        window.aiSystem.show('ترقية ناجحة!', 'success');
                    }
                }
            };
        });
        
        workshopModal.classList.remove('hidden');
    }

    addToLeaderboard(name, score) {
        const entry = {
            name: name,
            score: score,
            date: new Date().toISOString(),
            energy: window.game?.energy || 0
        };
        
        this.leaderboard.push(entry);
        
        // Sort by score (descending)
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        this.leaderboard = this.leaderboard.slice(0, 10);
        
        localStorage.setItem('er_leaderboard', JSON.stringify(this.leaderboard));
        
        return entry;
    }

    displayLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (this.leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p>No scores yet. Be the first!</p>';
            return;
        }
        
        leaderboardList.innerHTML = this.leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="rank">${index + 1}.</span>
                <span class="name">${this.escapeHtml(entry.name)}</span>
                <span class="score">${entry.score}</span>
                <span class="energy">${entry.energy}⚡</span>
            </div>
        `).join('');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    resetProgress() {
        this.qPoints = 0;
        this.upgrades = {
            startingEnergy: 0,
            hazardReduction: 0,
            extraAbility: false
        };
        this.leaderboard = [];
        
        localStorage.removeItem('er_qpoints');
        localStorage.removeItem('er_upgrades');
        localStorage.removeItem('er_leaderboard');
        
        return true;
    }

    exportSave() {
        const saveData = {
            qPoints: this.qPoints,
            upgrades: this.upgrades,
            leaderboard: this.leaderboard,
            timestamp: new Date().toISOString()
        };
        
        return btoa(JSON.stringify(saveData));
    }

    importSave(saveString) {
        try {
            const saveData = JSON.parse(atob(saveString));
            
            this.qPoints = saveData.qPoints || 0;
            this.upgrades = saveData.upgrades || {};
            this.leaderboard = saveData.leaderboard || [];
            
            localStorage.setItem('er_qpoints', this.qPoints.toString());
            localStorage.setItem('er_upgrades', JSON.stringify(this.upgrades));
            localStorage.setItem('er_leaderboard', JSON.stringify(this.leaderboard));
            
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }
}

export { Store };