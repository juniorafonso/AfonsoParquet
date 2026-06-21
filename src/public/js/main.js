/**
 * Main JavaScript for Afonso Parquet
 * Custom client-side functionality
 */

(function() {
  'use strict';
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Active nav link highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.split('?')[0]) && href !== '/') {
      link.classList.add('active');
    }
  });
  
})();
