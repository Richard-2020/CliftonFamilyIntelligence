/**
 * Theme Toggle Functionality
 * Handles light/dark mode switching with localStorage persistence
 */

(function() {
    'use strict';

    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Get saved theme or default to light
    const getTheme = () => {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return saved || (prefersDark ? 'dark' : 'light');
    };

    // Set theme
    const setTheme = (theme) => {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    // Initialize theme on load
    const initTheme = () => {
        const theme = getTheme();
        setTheme(theme);
    };

    // Toggle theme
    const toggleTheme = () => {
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Attach toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
})();


