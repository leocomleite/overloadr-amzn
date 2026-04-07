// Overloadr Amazon Affiliate Helper Content Script
(function() {
    'use strict';
    
    const AFFILIATE_TAG = 'overloadr-20';
    
    // Function to check if URL needs affiliate code
    function needsAffiliateCode(url) {
        return url.includes('amazon.com.br') && 
               !url.includes(`tag=${AFFILIATE_TAG}`) &&
               (url.includes('/dp/') || url.includes('/gp/product/') || url.includes('/product/'));
    }
    
    // Function to add affiliate parameters to URL
    function addAffiliateCode(url) {
        try {
            const urlObj = new URL(url);
            
            // Add affiliate tag - this is all that's needed for basic affiliate functionality
            urlObj.searchParams.set('tag', AFFILIATE_TAG);
            
            return urlObj.toString();
        } catch (e) {
            console.error('Error processing URL:', e);
            return url;
        }
    }
    
    // Function to update current page URL
    function updateCurrentPageUrl() {
        const currentUrl = window.location.href;
        
        if (needsAffiliateCode(currentUrl)) {
            const newUrl = addAffiliateCode(currentUrl);
            
            // Use replaceState to avoid adding to browser history
            window.history.replaceState(null, null, newUrl);
        }
    }
    
    // Function to update all Amazon links on the page
    function updateAmazonLinks() {
        const links = document.querySelectorAll('a[href*="amazon.com.br"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && needsAffiliateCode(href)) {
                try {
                    // Handle relative URLs
                    const fullUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).toString();
                    const newUrl = addAffiliateCode(fullUrl);
                    link.setAttribute('href', newUrl);
                } catch (e) {
                    console.error('Error updating link:', e);
                }
            }
        });
    }
    
    // Function to handle dynamically added links
    function observeNewLinks() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a link
                        if (node.tagName === 'A' && node.href && node.href.includes('amazon.com.br')) {
                            if (needsAffiliateCode(node.href)) {
                                node.href = addAffiliateCode(node.href);
                            }
                        }
                        
                        // Check for links within the added node
                        const amazonLinks = node.querySelectorAll ? node.querySelectorAll('a[href*="amazon.com.br"]') : [];
                        amazonLinks.forEach(link => {
                            const href = link.getAttribute('href');
                            if (href && needsAffiliateCode(href)) {
                                try {
                                    const fullUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).toString();
                                    link.setAttribute('href', addAffiliateCode(fullUrl));
                                } catch (e) {
                                    console.error('Error updating dynamic link:', e);
                                }
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Main initialization function
    function init() {
        // Update current page URL if it's a product page
        updateCurrentPageUrl();
        
        // Update existing links
        updateAmazonLinks();
        
        // Start observing for new links
        observeNewLinks(); 
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Handle navigation changes (for single-page app behavior)
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            setTimeout(() => {
                updateCurrentPageUrl();
                updateAmazonLinks();
            }, 1000); // Small delay to let page content load
        }
    }).observe(document.body, { childList: true, subtree: true });
    
})();