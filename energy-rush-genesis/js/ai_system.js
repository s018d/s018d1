/**
 * AI Comment System - Energy Rush
 * نظام التعليقات الذكية
 * MIT License - Core Prime MVP
 */

class AiSystem {
    constructor() {
        this.isEnabled = localStorage.getItem('er_ai_comments') !== 'false';
        this.messageQueue = [];
        this.isShowing = false;
        this.wrongClickCount = 0;
        this.lastWrongClickTime = 0;
        
        this.messages = {
            // Tutorial and guidance messages
            tutorial: [
                'ابدأ بجمع الطاقة من المولدات الزرقاء',
                'تجنّب العناصر الحمراء - إنها خطرة',
                'استخدم القدرات الخاصة في الوقت المناسب'
            ],
            
            // Positive feedback
            praise: [
                'ممتاز! استمر هكذا',
                'برافو! تحكم رائع في الطاقة',
                'إتقان تام للبروتوكول',
                'طاقة مستقرة - أداء متميز'
            ],
            
            // Warning and guidance
            warning: [
                'خطأ — تجنّب الأحمر',
                'انتبه للوقت المتبقي',
                'الطاقة تنخفض - ركز أكثر',
                'استخدم القدرات لمساعدتك'
            ],
            
            // Encouragement after mistakes
            encouragement: [
                'لا بأس، ركّز في الخطوة القادمة',
                'خذ نفس، ركّز أكثر',
                'لاحقًا راح نصححها - استمر',
                'كلنا نتعلم من الأخطاء'
            ],
            
            // Ability suggestions
            abilityHint: [
                'جرب freeze لتجميد الوقت',
                'Turbo يسرع جمع الطاقة',
                'Quantum Vision يساعدك ترى الأشياء النادرة'
            ],
            
            // Event notifications
            event: [
                'Magnetic Surge! العناصر تظهر أسرع',
                'Power Surge! طاقة مضاعفة مؤقتة',
                'حدث خاص: استفد من الفرصة'
            ]
        };
    }

    show(message, type = 'info') {
        if (!this.isEnabled) return;
        
        const aiBox = document.getElementById('ai-comments');
        const aiText = document.getElementById('ai-comment-text');
        
        if (!aiBox || !aiText) return;
        
        // Show the AI box
        aiBox.classList.remove('hidden');
        aiText.textContent = message;
        
        // Add type-based styling
        aiBox.className = 'ai-comments animate-fadein';
        aiBox.classList.add(`ai-${type}`);
        
        this.isShowing = true;
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.hide();
        }, 3000);
    }

    hide() {
        const aiBox = document.getElementById('ai-comments');
        if (aiBox) {
            aiBox.classList.add('animate-fadeout');
            setTimeout(() => {
                aiBox.classList.add('hidden');
                aiBox.classList.remove('animate-fadeout');
                this.isShowing = false;
                this.processQueue();
            }, 300);
        }
    }

    queue(messages) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        
        this.messageQueue.push(...messages);
        this.processQueue();
    }

    processQueue() {
        if (!this.isShowing && this.messageQueue.length > 0) {
            const nextMessage = this.messageQueue.shift();
            this.show(nextMessage);
        }
    }

    // Behavior triggers
    onFirstWrongClick() {
        this.show('لاحقًا راح نصححها - استمر في المحاولة', 'encouragement');
    }

    onMultipleWrongClicks() {
        const now = Date.now();
        if (now - this.lastWrongClickTime < 3000) { // 3 seconds
            this.wrongClickCount++;
        } else {
            this.wrongClickCount = 1;
        }
        
        this.lastWrongClickTime = now;
        
        if (this.wrongClickCount >= 3) {
            this.show('خذ نفس، ركّز أكثر', 'warning');
            this.wrongClickCount = 0;
        }
    }

    onWin() {
        const randomPraise = this.messages.praise[Math.floor(Math.random() * this.messages.praise.length)];
        this.show(randomPraise, 'success');
    }

    onLoss() {
        this.show('لا بأس، كل محاولة تزيد خبرتك', 'encouragement');
    }

    onAbilityReady(ability) {
        this.show(`القدرة ${ability} جاهزة للاستخدام`, 'info');
    }

    onEventStart(eventName) {
        if (eventName === 'magneticSurge') {
            this.show('Magnetic Surge! العناصر تظهر أسرع', 'event');
        } else if (eventName === 'powerSurge') {
            this.show('Power Surge! طاقة مضاعفة مؤقتة', 'event');
        }
    }

    enable() {
        this.isEnabled = true;
        localStorage.setItem('er_ai_comments', 'true');
    }

    disable() {
        this.isEnabled = false;
        localStorage.setItem('er_ai_comments', 'false');
        this.hide();
    }
}

export { AiSystem };