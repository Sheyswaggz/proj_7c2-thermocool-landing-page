/**
 * Navigation Module
 * Handles mobile navigation toggle, smooth scrolling, active state management,
 * and keyboard accessibility for the ThermoCool landing page.
 * 
 * @module navigation
 * @version 1.0.0
 */

(function() {
  'use strict';

  /**
   * Navigation state management
   * @type {Object}
   */
  const state = {
    isMenuOpen: false,
    activeSection: 'home',
    scrollTimeout: null,
    isScrolling: false,
    lastScrollPosition: 0
  };

  /**
   * Configuration constants
   * @type {Object}
   */
  const config = {
    scrollOffset: 80,
    scrollDuration: 800,
    scrollThrottleDelay: 100,
    mobileBreakpoint: 768,
    sectionThreshold: 0.5
  };

  /**
   * DOM element cache
   * @type {Object}
   */
  const elements = {
    nav: null,
    navLinks: null,
    mobileMenuButton: null,
    navMenu: null,
    sections: null,
    header: null
  };

  /**
   * Initialize the navigation module
   * Sets up event listeners and caches DOM elements
   */
  function init() {
    try {
      cacheElements();
      
      if (!validateElements()) {
        console.warn('Navigation: Required elements not found, skipping initialization');
        return;
      }

      createMobileMenuButton();
      setupEventListeners();
      updateActiveNavigation();
      
      console.info('Navigation: Initialized successfully');
    } catch (error) {
      console.error('Navigation: Initialization failed', error);
    }
  }

  /**
   * Cache DOM elements for performance
   */
  function cacheElements() {
    elements.nav = document.querySelector('nav[role="navigation"]');
    elements.header = document.querySelector('header[role="banner"]');
    elements.navLinks = document.querySelectorAll('nav a[href^="#"]');
    elements.sections = document.querySelectorAll('section[id], aside[id]');
  }

  /**
   * Validate that required elements exist
   * @returns {boolean} True if all required elements are present
   */
  function validateElements() {
    return !!(elements.nav && elements.navLinks.length > 0);
  }

  /**
   * Create mobile menu button dynamically
   */
  function createMobileMenuButton() {
    if (!elements.nav || elements.mobileMenuButton) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'mobile-menu-toggle';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Toggle navigation menu');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'main-navigation');
    
    button.innerHTML = `
      <span class="menu-icon" aria-hidden="true">
        <span class="menu-line"></span>
        <span class="menu-line"></span>
        <span class="menu-line"></span>
      </span>
    `;

    const navList = elements.nav.querySelector('ul');
    if (navList) {
      navList.id = 'main-navigation';
      elements.navMenu = navList;
      elements.nav.insertBefore(button, navList);
      elements.mobileMenuButton = button;
      
      addMobileMenuStyles();
    }
  }

  /**
   * Add mobile menu styles dynamically
   */
  function addMobileMenuStyles() {
    const styleId = 'navigation-mobile-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .mobile-menu-toggle {
        display: none;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        z-index: 1001;
        position: relative;
      }

      .menu-icon {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 24px;
        height: 18px;
      }

      .menu-line {
        display: block;
        width: 100%;
        height: 2px;
        background-color: white;
        transition: transform 0.3s ease, opacity 0.3s ease;
        transform-origin: center;
      }

      .mobile-menu-toggle[aria-expanded="true"] .menu-line:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }

      .mobile-menu-toggle[aria-expanded="true"] .menu-line:nth-child(2) {
        opacity: 0;
      }

      .mobile-menu-toggle[aria-expanded="true"] .menu-line:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }

      @media (max-width: ${config.mobileBreakpoint}px) {
        .mobile-menu-toggle {
          display: block;
        }

        nav ul {
          position: fixed;
          top: 0;
          right: -100%;
          width: 280px;
          height: 100vh;
          background-color: var(--color-primary, #0066cc);
          flex-direction: column;
          padding: 5rem 2rem 2rem;
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
          transition: right 0.3s ease;
          z-index: 1000;
          overflow-y: auto;
        }

        nav ul.menu-open {
          right: 0;
        }

        nav ul li {
          width: 100%;
        }

        nav ul a {
          display: block;
          padding: 1rem;
          width: 100%;
          text-align: left;
          font-size: 1.125rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .menu-line,
        nav ul {
          transition-duration: 0.01ms !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    if (elements.mobileMenuButton) {
      elements.mobileMenuButton.addEventListener('click', handleMobileMenuToggle);
    }

    elements.navLinks.forEach(link => {
      link.addEventListener('click', handleNavLinkClick);
    });

    window.addEventListener('scroll', throttle(handleScroll, config.scrollThrottleDelay), { passive: true });
    window.addEventListener('resize', throttle(handleResize, 200), { passive: true });
    
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    document.addEventListener('click', handleOutsideClick);
  }

  /**
   * Handle mobile menu toggle
   * @param {Event} event - Click event
   */
  function handleMobileMenuToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    state.isMenuOpen = !state.isMenuOpen;

    if (elements.mobileMenuButton) {
      elements.mobileMenuButton.setAttribute('aria-expanded', String(state.isMenuOpen));
    }

    if (elements.navMenu) {
      if (state.isMenuOpen) {
        elements.navMenu.classList.add('menu-open');
        trapFocus(elements.navMenu);
      } else {
        elements.navMenu.classList.remove('menu-open');
        elements.mobileMenuButton?.focus();
      }
    }

    document.body.style.overflow = state.isMenuOpen ? 'hidden' : '';
  }

  /**
   * Handle navigation link clicks
   * @param {Event} event - Click event
   */
  function handleNavLinkClick(event) {
    const link = event.currentTarget;
    const targetId = link.getAttribute('href');

    if (!targetId || !targetId.startsWith('#')) {
      return;
    }

    event.preventDefault();

    const targetElement = document.querySelector(targetId);
    
    if (!targetElement) {
      console.warn(`Navigation: Target element ${targetId} not found`);
      return;
    }

    closeMobileMenu();
    smoothScrollTo(targetElement);
    
    setTimeout(() => {
      updateActiveLink(link);
      targetElement.focus({ preventScroll: true });
    }, config.scrollDuration);
  }

  /**
   * Handle scroll events to update active navigation
   */
  function handleScroll() {
    if (state.isScrolling) {
      return;
    }

    clearTimeout(state.scrollTimeout);
    
    state.scrollTimeout = setTimeout(() => {
      updateActiveNavigation();
    }, 50);
  }

  /**
   * Handle window resize events
   */
  function handleResize() {
    if (window.innerWidth > config.mobileBreakpoint && state.isMenuOpen) {
      closeMobileMenu();
    }
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyboardNavigation(event) {
    if (event.key === 'Escape' && state.isMenuOpen) {
      closeMobileMenu();
      elements.mobileMenuButton?.focus();
    }

    if (event.key === 'Tab' && state.isMenuOpen && elements.navMenu) {
      trapFocus(elements.navMenu, event);
    }
  }

  /**
   * Handle clicks outside the mobile menu
   * @param {Event} event - Click event
   */
  function handleOutsideClick(event) {
    if (!state.isMenuOpen || !elements.navMenu) {
      return;
    }

    const isClickInsideMenu = elements.navMenu.contains(event.target);
    const isClickOnButton = elements.mobileMenuButton?.contains(event.target);

    if (!isClickInsideMenu && !isClickOnButton) {
      closeMobileMenu();
    }
  }

  /**
   * Close mobile menu
   */
  function closeMobileMenu() {
    if (!state.isMenuOpen) {
      return;
    }

    state.isMenuOpen = false;

    if (elements.mobileMenuButton) {
      elements.mobileMenuButton.setAttribute('aria-expanded', 'false');
    }

    if (elements.navMenu) {
      elements.navMenu.classList.remove('menu-open');
    }

    document.body.style.overflow = '';
  }

  /**
   * Smooth scroll to target element
   * @param {HTMLElement} target - Target element to scroll to
   */
  function smoothScrollTo(target) {
    if (!target) {
      return;
    }

    state.isScrolling = true;

    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition - config.scrollOffset;
    const startTime = performance.now();

    function animation(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / config.scrollDuration, 1);
      const easing = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * easing);

      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        state.isScrolling = false;
      }
    }

    requestAnimationFrame(animation);
  }

  /**
   * Easing function for smooth scrolling
   * @param {number} t - Progress value between 0 and 1
   * @returns {number} Eased value
   */
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update active navigation based on scroll position
   */
  function updateActiveNavigation() {
    if (!elements.sections || elements.sections.length === 0) {
      return;
    }

    const scrollPosition = window.pageYOffset + config.scrollOffset + 100;
    let currentSection = null;

    elements.sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        currentSection = section.id;
      }
    });

    if (currentSection && currentSection !== state.activeSection) {
      state.activeSection = currentSection;
      
      elements.navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const isActive = href === `#${currentSection}`;
        
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }
  }

  /**
   * Update active link manually
   * @param {HTMLElement} activeLink - The link to mark as active
   */
  function updateActiveLink(activeLink) {
    if (!activeLink) {
      return;
    }

    elements.navLinks.forEach(link => {
      link.removeAttribute('aria-current');
    });

    activeLink.setAttribute('aria-current', 'page');
    
    const targetId = activeLink.getAttribute('href')?.substring(1);
    if (targetId) {
      state.activeSection = targetId;
    }
  }

  /**
   * Trap focus within an element
   * @param {HTMLElement} element - Element to trap focus within
   * @param {KeyboardEvent} [event] - Optional keyboard event
   */
  function trapFocus(element, event) {
    if (!element) {
      return;
    }

    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!event) {
      firstElement.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  function throttle(func, delay) {
    let lastCall = 0;
    let timeoutId = null;

    return function throttled(...args) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          func.apply(this, args);
        }, delay - timeSinceLastCall);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init };
  }

})();