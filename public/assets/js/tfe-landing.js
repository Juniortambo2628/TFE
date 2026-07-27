/**
 * TFE Landing Page JavaScript
 * Handles stadium slider, World Cup news, and other interactive features
 */

(function($) {
    'use strict';

    // Initialize PHP data if available
    if (typeof window.__INITIAL_PROFILE === 'undefined') {
        window.__INITIAL_PROFILE = null;
    }
    if (typeof window.APP_BASE_URL === 'undefined') {
        window.APP_BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
    }
    if (typeof window.STADIUM_IMAGES === 'undefined') {
        window.STADIUM_IMAGES = [];
    }

    // Stadium Slider with smooth fade transitions
    function initStadiumSlider() {
        const slides = document.querySelectorAll('.stadium-slide');
        if (slides.length === 0) return;

        let currentSlide = 0;
        const totalSlides = slides.length;
        let slideInterval = null;
        let isTransitioning = false;

        // Set background images - lazy load non-active slides
        slides.forEach((slide, index) => {
            const bgImage = slide.getAttribute('data-bg-image');
            const isLazy = slide.getAttribute('data-lazy-load') === 'true';
            
            // Add slide index for unique animations
            slide.setAttribute('data-slide-index', index);
            
            // Set CSS custom property for background image
            if (bgImage) {
                slide.style.setProperty('--bg-image-url', `url(${bgImage})`);
            }
            
            // Only load first slide immediately, others will load when needed
            if (bgImage && !isLazy) {
                // Preload image to ensure it loads
                const img = new Image();
                img.src = bgImage;
                img.onload = function() {
                    slide.setAttribute('data-bg-loaded', 'true');
                };
                img.onerror = function() {
                    console.error('Failed to load stadium image:', bgImage, 'for slide:', index);
                };
                // Set immediately as fallback
                slide.setAttribute('data-bg-loaded', 'true');
            } else if (bgImage && isLazy) {
                // Preload next slide image when current slide is active
                const img = new Image();
                img.src = bgImage;
                img.onload = function() {
                    slide.setAttribute('data-bg-loaded', 'true');
                };
                img.onerror = function() {
                    console.error('Failed to load stadium image:', bgImage, 'for slide:', index);
                };
            }
        });
        
        // Load next slide image when current becomes active
        function loadSlideImage(slideIndex) {
            const slide = slides[slideIndex];
            if (!slide) return;
            
            const bgImage = slide.getAttribute('data-bg-image');
            const isLazy = slide.getAttribute('data-lazy-load') === 'true';
            
            if (bgImage && isLazy && !slide.getAttribute('data-bg-loaded')) {
                // Set CSS custom property for background image
                slide.style.setProperty('--bg-image-url', `url(${bgImage})`);
                const img = new Image();
                img.src = bgImage;
                img.onload = function() {
                    slide.setAttribute('data-bg-loaded', 'true');
                };
                img.onerror = function() {
                    console.error('Failed to load stadium image:', bgImage, 'for slide:', slideIndex);
                };
            }
        }

        // Show first slide
        if (slides.length > 0) {
            slides[0].classList.add('active', 'slide-in');
        }

        // Smooth fade transition function
        function transitionToSlide(nextIndex) {
            if (isTransitioning) return;
            isTransitioning = true;

            const currentSlideEl = slides[currentSlide];
            const nextSlideEl = slides[nextIndex];

            // Load next slide image if not already loaded
            loadSlideImage(nextIndex);
            // Preload the slide after next for smoother transitions
            const nextNextIndex = (nextIndex + 1) % totalSlides;
            loadSlideImage(nextNextIndex);
            
            // Ensure next slide is visible but transparent
            nextSlideEl.classList.add('active', 'transitioning');
            
            // Fade out current slide
            currentSlideEl.classList.remove('slide-in');
            currentSlideEl.classList.add('slide-out');
            
            // Fade in next slide with smooth transition
            requestAnimationFrame(() => {
                nextSlideEl.classList.remove('transitioning');
                nextSlideEl.classList.add('transitioning-in', 'slide-in');
            });
            
            // Update after transition completes
            setTimeout(() => {
                currentSlideEl.classList.remove('active', 'slide-out');
                
                // Update current slide
                currentSlide = nextIndex;
                isTransitioning = false;
                
                // Update dots
                if (typeof updateDots === 'function') {
                    updateDots();
                }
            }, 1000);
        }

        // Auto-rotate slides with varying intervals
        function startAutoRotate() {
            if (slideInterval) clearInterval(slideInterval);
            
            // Vary interval between 6-10 seconds for less repetitive feel
            const intervals = [6000, 7000, 8000, 9000, 10000];
            const randomInterval = intervals[Math.floor(Math.random() * intervals.length)];
            
            slideInterval = setInterval(() => {
                const nextIndex = (currentSlide + 1) % totalSlides;
                transitionToSlide(nextIndex);
            }, randomInterval);
        }

        // Start auto-rotate
        startAutoRotate();

        // Add navigation dots with tooltips
        const sliderWrapper = document.querySelector('.stadium-slider-wrapper');
        if (sliderWrapper && totalSlides > 1) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'stadium-slider-dots position-absolute bottom-0 start-50 translate-middle-x p-4';

            for (let i = 0; i < totalSlides; i++) {
                const slide = slides[i];
                const stadiumName = slide.getAttribute('data-stadium-name') || `Stadium ${i + 1}`;
                
                // Create dot wrapper
                const dotWrapper = document.createElement('div');
                dotWrapper.className = 'stadium-dot-wrapper position-relative';
                
                // Create hover tooltip (only for inactive dots)
                const tooltip = document.createElement('div');
                tooltip.className = 'stadium-dot-tooltip';
                tooltip.textContent = stadiumName;
                
                // Create active badge (pill-shaped, replaces dot when active)
                const activeBadge = document.createElement('div');
                activeBadge.className = 'stadium-dot-active-badge' + (i === 0 ? ' visible' : '');
                activeBadge.textContent = stadiumName;
                
                // Create dot button (hidden when active)
                const dot = document.createElement('button');
                dot.className = 'stadium-dot rounded-circle border-0' + (i === 0 ? ' active' : ' inactive');
                dot.setAttribute('aria-label', `Go to ${stadiumName}`);
                
                // Hover events for tooltip (only on inactive dots)
                dot.addEventListener('mouseenter', function() {
                    if (i !== currentSlide) {
                        tooltip.classList.add('visible');
                    }
                });
                
                dot.addEventListener('mouseleave', function() {
                    tooltip.classList.remove('visible');
                });
                
                dot.addEventListener('click', () => {
                    if (i !== currentSlide && !isTransitioning) {
                        transitionToSlide(i);
                        // Restart auto-rotate after manual click
                        startAutoRotate();
                    }
                });

                dotWrapper.appendChild(tooltip);
                dotWrapper.appendChild(activeBadge);
                dotWrapper.appendChild(dot);
                dotsContainer.appendChild(dotWrapper);
            }

            sliderWrapper.appendChild(dotsContainer);

            window.updateDots = function() {
                const dotWrappers = dotsContainer.querySelectorAll('.stadium-dot-wrapper');
                const total = dotWrappers.length;
                
                // Calculate prev/next indices for mobile view
                const prevIndex = (currentSlide - 1 + total) % total;
                const nextIndex = (currentSlide + 1) % total;
                
                dotWrappers.forEach((wrapper, idx) => {
                    const dot = wrapper.querySelector('.stadium-dot');
                    const tooltip = wrapper.querySelector('.stadium-dot-tooltip');
                    const activeBadge = wrapper.querySelector('.stadium-dot-active-badge');
                    
                    // Reset mobile visibility
                    wrapper.classList.remove('mobile-hidden');
                    
                    // Mobile logic: Only show Prev, Current, Next
                    // We use a class to hide others on mobile via CSS
                    if (idx !== currentSlide && idx !== prevIndex && idx !== nextIndex) {
                        wrapper.classList.add('mobile-hidden');
                    }
                    
                    if (idx === currentSlide) {
                        // Active: Show badge, hide dot
                        dot.classList.remove('inactive');
                        dot.classList.add('active');
                        activeBadge.classList.add('visible');
                        tooltip.classList.remove('visible');
                    } else {
                        // Inactive: Show dot, hide badge
                        dot.classList.remove('active');
                        dot.classList.add('inactive');
                        activeBadge.classList.remove('visible');
                        // Hide tooltip if not hovering
                        if (!dot.matches(':hover')) {
                            tooltip.classList.remove('visible');
                        }
                    }
                });
            };

            // Add arrow controls
            if (totalSlides > 1) {
                // Left arrow
                const leftArrow = document.createElement('button');
                leftArrow.className = 'stadium-slider-arrow stadium-slider-arrow-left';
                leftArrow.setAttribute('aria-label', 'Previous slide');
                leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
                leftArrow.addEventListener('click', () => {
                    if (!isTransitioning) {
                        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
                        transitionToSlide(prevIndex);
                        startAutoRotate();
                    }
                });

                // Right arrow
                const rightArrow = document.createElement('button');
                rightArrow.className = 'stadium-slider-arrow stadium-slider-arrow-right';
                rightArrow.setAttribute('aria-label', 'Next slide');
                rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
                rightArrow.addEventListener('click', () => {
                    if (!isTransitioning) {
                        const nextIndex = (currentSlide + 1) % totalSlides;
                        transitionToSlide(nextIndex);
                        startAutoRotate();
                    }
                });

                sliderWrapper.appendChild(leftArrow);
                sliderWrapper.appendChild(rightArrow);
            }

            // Initial dots update
            if (typeof window.updateDots === 'function') {
                window.updateDots();
            }
        }
    }

    // Enhanced stat card hover effects - card lift only, no background transform
    function enhanceStatCardHovers() {
        const slides = document.querySelectorAll('.stadium-slide');
        
        slides.forEach((slide) => {
            const statCards = slide.querySelectorAll('.stadium-stat-card');
            
            statCards.forEach((card) => {
                card.addEventListener('mouseenter', function() {
                    // Only apply card lift animation, no background movement
                    card.classList.add('hover-active');
                });

                card.addEventListener('mouseleave', function() {
                    card.classList.remove('hover-active');
                });
            });
        });
    }

    // Load World Cup News
    function loadWorldCupNews() {
        const container = document.getElementById('world-cup-news-container');
        if (!container) return;

        fetch(window.APP_BASE_URL + 'api/world-cup-news.php')
            .then(response => {
                // Check if response is ok
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // Check content type
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    // If not JSON, get text to see what we got
                    return response.text().then(text => {
                        console.error('Expected JSON but got:', text.substring(0, 100));
                        throw new Error('Response is not JSON');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.news && data.news.length > 0) {
                    displayNews(data.news);
                } else {
                    displayDefaultNews();
                }
            })
            .catch(error => {
                console.error('Error loading World Cup news:', error);
                displayDefaultNews();
            });
    }

    function displayNews(news) {
        const container = document.getElementById('world-cup-news-container');
        if (!container) return;

        container.innerHTML = '';

        news.forEach((item, index) => {
            const colClass = index === 0 ? 'col-xl-6 mb-7 mb-xl-0' : 'col-md-6 col-xl-3 mb-7 mb-xl-0';
            const isTicketing = item.category && item.category.toLowerCase() === 'ticketing';
            const reminderButton = (isTicketing && item.reminder_enabled) ? `
                <button class="btn btn-sm btn-outline-primary mt-2 reminder-btn" data-news-id="${item.id}" data-reminder-date="${item.reminder_date || ''}" title="Set reminder for this ticket sale">
                    <i class="fas fa-bell me-1"></i> Set Reminder
                </button>
            ` : '';
            const fifaNote = isTicketing ? `
                <div class="alert alert-info alert-sm mt-2 mb-0 p-2" style="font-size: 0.75rem; background: rgba(220, 20, 60, 0.1); border: 1px solid rgba(220, 20, 60, 0.3); color: rgba(255, 255, 255, 0.9);">
                    <i class="fas fa-info-circle me-1"></i> <strong>Note:</strong> FIFA is the exclusive official ticket vendor. We provide information and direct links only.
                </div>
            ` : '';
            const newsCard = `
                <div class="${colClass}">
                    <div class="news-card" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}" data-aos-duration="1000">
                        ${item.image ? `<div class="news-image mb-3"><img src="${item.image}" alt="${item.title}" class="img-fluid rounded news-image-img"></div>` : ''}
                        <div class="news-date mb-2">${formatDate(item.date)}</div>
                        <h4 class="news-title">${escapeHtml(item.title)}</h4>
                        <p class="news-excerpt">${escapeHtml(item.excerpt || item.content.substring(0, 150) + '...')}</p>
                        <span class="news-category">${escapeHtml(item.category || 'News')}</span>
                        ${fifaNote}
                        ${item.url ? `<a href="${item.url}" class="d-block mt-3 text-primary" target="_blank" rel="noopener noreferrer">Visit FIFA Official Portal <i class="fas fa-external-link-alt ms-2"></i></a>` : ''}
                        ${reminderButton}
                    </div>
                </div>
            `;
            container.innerHTML += newsCard;
        });
        
        // Initialize reminder buttons
        initReminderButtons();
    }

    function displayDefaultNews() {
        const container = document.getElementById('world-cup-news-container');
        if (!container) return;

        const defaultNews = [
            {
                title: 'FIFA Announces World Cup 2026 Ticket Sales',
                excerpt: 'FIFA has announced the opening of ticket sales for the 2026 World Cup. Purchase tickets directly from FIFA\'s official portal—the exclusive official ticket vendor.',
                date: new Date().toISOString(),
                category: 'Ticketing',
                url: 'https://www.fifa.com/tickets',
                reminder_enabled: true
            },
            {
                title: 'Stadium Preparations Underway',
                excerpt: 'All 16 host cities are making final preparations for the tournament. Stadium renovations and infrastructure improvements are progressing on schedule.',
                date: new Date(Date.now() - 86400000).toISOString(),
                category: 'Stadiums'
            },
            {
                title: 'African Teams Qualify for 2026',
                excerpt: 'Several African nations have secured their spots in the expanded 48-team format. The continent will be well-represented in North America.',
                date: new Date(Date.now() - 172800000).toISOString(),
                category: 'Qualification'
            },
            {
                title: 'Travel Packages Available',
                excerpt: 'TFE is now offering comprehensive travel packages including flights, accommodation, and transfers. We\'ll help you stay informed about FIFA ticket sales so you can purchase directly from the official source.',
                date: new Date(Date.now() - 259200000).toISOString(),
                category: 'Travel'
            }
        ];

        displayNews(defaultNews);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize reminder functionality
    function initReminderButtons() {
        document.querySelectorAll('.reminder-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const newsId = this.getAttribute('data-news-id');
                const reminderDate = this.getAttribute('data-reminder-date');
                setReminder(newsId, reminderDate, this);
            });
        });
    }

    // Set reminder for ticket sales
    function setReminder(newsId, reminderDate, button) {
        // Check if user is logged in
        const isLoggedIn = typeof window.__INITIAL_PROFILE !== 'undefined' && window.__INITIAL_PROFILE !== null;
        
        if (!isLoggedIn) {
            // Prompt user to login/register
            if (confirm('Please sign in or register to set reminders for ticket sales. Would you like to sign in now?')) {
                window.location.href = window.APP_BASE_URL + 'auth/login.php?redirect=' + encodeURIComponent(window.location.href);
            }
            return;
        }

        // Show reminder options
        const reminderOptions = {
            '1 day before': new Date(new Date(reminderDate).getTime() - 24 * 60 * 60 * 1000).toISOString(),
            '3 days before': new Date(new Date(reminderDate).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            '1 week before': new Date(new Date(reminderDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const selectedOption = prompt(
            'Set reminder for ticket sale:\n\n' +
            '1. 1 day before\n' +
            '2. 3 days before\n' +
            '3. 1 week before\n\n' +
            'Enter option (1, 2, or 3):'
        );

        if (!selectedOption || !['1', '2', '3'].includes(selectedOption)) {
            return;
        }

        const options = ['1 day before', '3 days before', '1 week before'];
        const selectedReminderDate = reminderOptions[options[parseInt(selectedOption) - 1]];

        // Save reminder via API
        fetch(window.APP_BASE_URL + 'api/set-reminder.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                news_id: newsId,
                reminder_date: selectedReminderDate,
                original_date: reminderDate
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                button.innerHTML = '<i class="fas fa-check me-1"></i> Reminder Set';
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-success');
                button.disabled = true;
                
                // Show success message
                const alert = document.createElement('div');
                alert.className = 'alert alert-success alert-dismissible fade show mt-2';
                alert.innerHTML = `
                    <i class="fas fa-check-circle me-2"></i> Reminder set successfully! You'll be notified ${options[parseInt(selectedOption) - 1]} the ticket sale.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                button.parentElement.appendChild(alert);
                
                setTimeout(() => {
                    alert.remove();
                }, 5000);
            } else {
                alert('Failed to set reminder: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error setting reminder:', error);
            alert('Failed to set reminder. Please try again later.');
        });
    }

    // Initialize service tabs to ensure only active pane is visible
    function initServiceTabs() {
        const tabContent = document.querySelector('.services-tab .tab-content');
        if (!tabContent) return;

        // Hide all panes except active
        function updateTabPanes() {
            // CSS handles display/opacity/visibility based on .active class
            // No inline styles needed - function kept for consistency with event listeners
        }

        // Initial update
        updateTabPanes();

        // Listen for tab changes
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                // Remove active from all panes
                const panes = tabContent.querySelectorAll('.tab-pane');
                panes.forEach(function(pane) {
                    pane.classList.remove('active');
                });

                // Add active to target pane
                const targetId = this.getAttribute('data-bs-target');
                if (targetId) {
                    const targetPane = document.querySelector(targetId);
                    if (targetPane) {
                        targetPane.classList.add('active');
                    }
                }

                // Update display
                setTimeout(updateTabPanes, 50);
            });
        });

        // Also listen for Bootstrap's shown.bs.tab event
        tabButtons.forEach(function(button) {
            button.addEventListener('shown.bs.tab', function() {
                updateTabPanes();
            });
        });
    }

    // Smooth Scroll
    function initSmoothScroll() {
        $('.smoothscroll').on('click', function(e) {
            e.preventDefault();
            const target = $(this.getAttribute('href'));
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 80
                }, 800);
            }
        });
    }

    // Set background images from data attributes using CSS custom properties
    function setBackgroundImages() {
        // Portfolio images
        document.querySelectorAll('.portfolio-img-placeholder[data-bg-image]').forEach(function(el) {
            const bgImage = el.getAttribute('data-bg-image');
            if (bgImage) {
                el.style.setProperty('--bg-image', `url(${bgImage})`);
            }
        });

        // Service tab images
        document.querySelectorAll('.service-tab-img[data-bg-image]').forEach(function(el) {
            const bgImage = el.getAttribute('data-bg-image');
            if (bgImage) {
                el.style.setProperty('--bg-image', `url(${bgImage})`);
            }
        });
    }

    // Initialize when DOM is ready
    $(document).ready(function() {
        setBackgroundImages();
        initStadiumSlider();
        enhanceStadiumSlider();
        enhanceStatCardHovers();
        loadWorldCupNews();
        initSmoothScroll();

        // Initialize AOS with enhanced settings
        if (typeof AOS !== 'undefined') {
            AOS.init({
                once: true,
                duration: 1000,
                easing: 'ease-out-cubic',
                offset: 100,
                delay: 0,
                anchorPlacement: 'top-bottom',
                disable: function() {
                    return window.innerWidth < 768;
                }
            });

            // Refresh AOS on tab changes (for service tabs)
            const serviceTabs = document.querySelectorAll('[data-bs-toggle="tab"]');
            serviceTabs.forEach(function(tab) {
                tab.addEventListener('shown.bs.tab', function() {
                    AOS.refresh();
                });
            });
        }

        // Ensure service tabs only show active pane
        initServiceTabs();

        // Initialize Owl Carousel for featured projects
        if ($('.featured-projects-slider .owl-carousel').length) {
            $('.featured-projects-slider .owl-carousel').owlCarousel({
                center: true,
                loop: true,
                margin: 30,
                nav: false,
                dots: true,
                autoplay: true,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
                responsive: {
                    0: {
                        items: 1
                    },
                    600: {
                        items: 2
                    },
                    1000: {
                        items: 3
                    },
                    1200: {
                        items: 4
                    }
                }
            });
        }

        // Count animation
        $('.count').each(function() {
            const $this = $(this);
            const target = parseInt($this.attr('data-target')) || parseInt($this.text());
            
            $({ count: 0 }).animate({ count: target }, {
                duration: 2000,
                easing: 'swing',
                step: function() {
                    $this.text(Math.floor(this.count));
                },
                complete: function() {
                    $this.text(target);
                }
            });
        });
    });

    // Header scroll effect - transparent to solid
    function handleHeaderScroll() {
        const header = document.querySelector('.tfe-header');
        if (!header) return;

        if (window.scrollY >= 60) {
            header.classList.add('fixed-header');
        } else {
            header.classList.remove('fixed-header');
        }
    }

    $(window).on('scroll', handleHeaderScroll);
    handleHeaderScroll(); // Initial check

    // Enhanced stadium slider with interactive animations
    function enhanceStadiumSlider() {
        const slides = document.querySelectorAll('.stadium-slide');
        slides.forEach((slide) => {
            // Animate stat cards on slide change
            const statCards = slide.querySelectorAll('.stadium-stat-card');
            statCards.forEach((card, cardIndex) => {
                card.style.setProperty('--animation-delay', `${cardIndex * 0.1}s`);
                card.setAttribute('data-animation-delay', cardIndex * 0.1);
                card.classList.add('animate-on-show');
            });
        });
    }

})(jQuery);

