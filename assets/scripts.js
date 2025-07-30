/**
 * EduClass Ad Network Integration
 * Manages Infolinks, PropellerAds, and PopAds with smart pop-under logic
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Ad Network IDs - Replace with your actual IDs
        INFOLINKS_WSID: '12345',
        PROPELLER_ZONE_ID: '67890',
        POPADS_SITE_ID: '11111',
        
        // Pop-under settings
        POP_UNDER_DELAY: 5000, // 5 seconds delay before pop-under
        SESSION_KEY: 'educlass_pop_shown',
        
        // Debug mode
        DEBUG: false
    };

    // Utility functions
    const utils = {
        log: function(message, data) {
            if (CONFIG.DEBUG) {
                console.log('[EduClass Ads]', message, data || '');
            }
        },
        
        createScript: function(src, attributes = {}) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            Object.keys(attributes).forEach(key => {
                script.setAttribute(key, attributes[key]);
            });
            
            return script;
        },
        
        randomChoice: function(array) {
            return array[Math.floor(Math.random() * array.length)];
        },
        
        isPopUnderShown: function() {
            return sessionStorage.getItem(CONFIG.SESSION_KEY) === 'true';
        },
        
        markPopUnderShown: function() {
            sessionStorage.setItem(CONFIG.SESSION_KEY, 'true');
            utils.log('Pop-under marked as shown for this session');
        }
    };

    // Ad Network Implementations
    const adNetworks = {
        // Infolinks - In-text CPC ads
        initInfolinks: function() {
            utils.log('Initializing Infolinks...');
            
            // Infolinks configuration
            window.infolinks_pid = parseInt(CONFIG.INFOLINKS_WSID);
            window.infolinks_wsid = 0;
            
            const script = utils.createScript('//resources.infolinks.com/js/infolinks_main.js');
            document.head.appendChild(script);
            
            utils.log('Infolinks initialized');
        },

        // PropellerAds - Pop-under CPM
        initPropellerAds: function() {
            utils.log('Initializing PropellerAds...');
            
            // PropellerAds pop-under script
            const script = document.createElement('script');
            script.innerHTML = `
                (function(d,z,s){
                    s.src='https://'+d+'/400/'+z;
                    try{(document.body||document.documentElement).appendChild(s)}
                    catch(e){}
                })('alsghaadsp.com', ${CONFIG.PROPELLER_ZONE_ID}, document.createElement('script'))
            `;
            
            document.head.appendChild(script);
            utils.log('PropellerAds initialized');
        },

        // PopAds - Pop-under CPM (Alternative)
        initPopAds: function() {
            utils.log('Initializing PopAds...');
            
            // PopAds pop-under script
            const script = document.createElement('script');
            script.innerHTML = `
                var uid = '${CONFIG.POPADS_SITE_ID}';
                var wid = '${Math.floor(Math.random() * 1000000)}';
                var pop_tag = document.createElement('script');
                pop_tag.src='//cdn.popcash.net/show.js';
                document.head.appendChild(pop_tag);
            `;
            
            document.head.appendChild(script);
            utils.log('PopAds initialized');
        }
    };

    // Pop-under Management
    const popUnderManager = {
        init: function() {
            if (utils.isPopUnderShown()) {
                utils.log('Pop-under already shown in this session, skipping');
                return;
            }

            // Wait for page to load and user interaction
            this.setupTriggers();
        },

        setupTriggers: function() {
            const self = this;
            let triggered = false;

            // Trigger on first user interaction (click, scroll, or keypress)
            const triggerEvents = ['click', 'scroll', 'keydown', 'touchstart'];
            
            const handleUserInteraction = function() {
                if (triggered) return;
                triggered = true;
                
                // Remove event listeners
                triggerEvents.forEach(event => {
                    document.removeEventListener(event, handleUserInteraction);
                });
                
                // Delay pop-under execution
                setTimeout(() => {
                    self.executePopUnder();
                }, CONFIG.POP_UNDER_DELAY);
            };

            // Add event listeners
            triggerEvents.forEach(event => {
                document.addEventListener(event, handleUserInteraction, { passive: true });
            });

            utils.log('Pop-under triggers set up');
        },

        executePopUnder: function() {
            if (utils.isPopUnderShown()) {
                return;
            }

            // Randomly choose between PropellerAds and PopAds
            const popUnderNetworks = ['propeller', 'popads'];
            const chosenNetwork = utils.randomChoice(popUnderNetworks);
            
            utils.log('Executing pop-under with network:', chosenNetwork);

            try {
                if (chosenNetwork === 'propeller') {
                    adNetworks.initPropellerAds();
                } else {
                    adNetworks.initPopAds();
                }
                
                utils.markPopUnderShown();
            } catch (error) {
                utils.log('Error executing pop-under:', error);
            }
        }
    };

    // Analytics and Tracking
    const analytics = {
        init: function() {
            // Track page views and ad performance
            this.trackPageView();
            this.trackUserEngagement();
        },

        trackPageView: function() {
            utils.log('Page view tracked');
            // Add your analytics tracking code here
        },

        trackUserEngagement: function() {
            let engagementTime = 0;
            const startTime = Date.now();

            // Track time on page
            setInterval(() => {
                engagementTime = Date.now() - startTime;
            }, 1000);

            // Track when user leaves
            window.addEventListener('beforeunload', () => {
                utils.log('User engagement time:', Math.round(engagementTime / 1000) + 's');
            });
        }
    };

    // Main initialization
    const init = function() {
        utils.log('Initializing EduClass Ad Networks...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        try {
            // Initialize Infolinks (always load)
            adNetworks.initInfolinks();

            // Initialize pop-under manager
            popUnderManager.init();

            // Initialize analytics
            analytics.init();

            utils.log('All ad networks initialized successfully');
        } catch (error) {
            utils.log('Error initializing ad networks:', error);
        }
    };

    // Enhanced user experience features
    const uxEnhancements = {
        init: function() {
            this.addSmoothScrolling();
            this.addLoadingStates();
            this.addProgressIndicator();
        },

        addSmoothScrolling: function() {
            // Smooth scroll for internal links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
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
        },

        addLoadingStates: function() {
            // Add loading states for buttons
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.href && this.href !== window.location.href) {
                        this.style.opacity = '0.7';
                        this.style.pointerEvents = 'none';
                    }
                });
            });
        },

        addProgressIndicator: function() {
            // Reading progress indicator for lesson pages
            if (document.querySelector('.lesson-content')) {
                const progressBar = document.createElement('div');
                progressBar.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 0%;
                    height: 3px;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    z-index: 9999;
                    transition: width 0.3s ease;
                `;
                document.body.appendChild(progressBar);

                window.addEventListener('scroll', () => {
                    const windowHeight = window.innerHeight;
                    const documentHeight = document.documentElement.scrollHeight - windowHeight;
                    const scrollTop = window.pageYOffset;
                    const progress = (scrollTop / documentHeight) * 100;
                    
                    progressBar.style.width = Math.min(progress, 100) + '%';
                });
            }
        }
    };

    // Initialize everything when ready
    init();
    
    // Initialize UX enhancements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => uxEnhancements.init());
    } else {
        uxEnhancements.init();
    }

    // Expose public API
    window.EduClassAds = {
        config: CONFIG,
        utils: utils,
        networks: adNetworks,
        analytics: analytics
    };

})();

/**
 * Additional Features and Enhancements
 */

// Lazy loading for images
(function() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
})();

// Service Worker registration for offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Performance monitoring
(function() {
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            if (window.EduClassAds && window.EduClassAds.utils) {
                window.EduClassAds.utils.log('Page load time:', pageLoadTime + 'ms');
            }
        }
    });
})();
