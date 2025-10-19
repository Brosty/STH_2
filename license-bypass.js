/**
 * License Bypass for Steam Trader Helper
 * This script intercepts all requests to steamtraderhelper.com license server
 * and returns successful responses to bypass license checks.
 */

(function() {
    'use strict';
    
    console.log('Steam Trader Helper License Bypass loaded');
    
    // Store original XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    const originalFetch = window.fetch;
    
    // Mock successful license response
    const successfulResponse = {
        success: true,
        active: true,
        float: 0.5,
        subscription: 'active',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Valid for 1 year
    };
    
    // Create custom XMLHttpRequest that bypasses license checks
    function CustomXMLHttpRequest() {
        const xhr = new originalXHR();
        let intercepted = false;
        let url = '';
        
        // Override open method to detect steamtraderhelper.com requests
        const originalOpen = xhr.open;
        xhr.open = function(method, reqUrl, async, user, password) {
            url = reqUrl;
            
            // Check if this is a request to steamtraderhelper.com
            if (url && (url.includes('steamtraderhelper.com') || url.includes('float.steamtraderhelper.com'))) {
                console.log('Intercepted license request to:', url);
                intercepted = true;
                
                // Set up mock response
                Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                Object.defineProperty(this, 'status', { value: 200, writable: true });
                Object.defineProperty(this, 'statusText', { value: 'OK', writable: true });
                Object.defineProperty(this, 'responseText', { value: JSON.stringify([successfulResponse.float]), writable: true });
                Object.defineProperty(this, 'response', { value: JSON.stringify([successfulResponse.float]), writable: true });
                
                return;
            }
            
            // For non-license requests, use original behavior
            return originalOpen.apply(this, arguments);
        };
        
        // Override send method
        const originalSend = xhr.send;
        xhr.send = function(data) {
            if (intercepted) {
                // Simulate async response for license requests
                setTimeout(() => {
                    if (this.onreadystatechange) {
                        this.onreadystatechange();
                    }
                    if (this.onload) {
                        this.onload();
                    }
                }, 10);
                return;
            }
            
            return originalSend.apply(this, arguments);
        };
        
        // Override other methods that might be used
        const originalSetRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(header, value) {
            if (intercepted) {
                return; // Ignore headers for intercepted requests
            }
            return originalSetRequestHeader.apply(this, arguments);
        };
        
        return xhr;
    }
    
    // Replace global XMLHttpRequest
    window.XMLHttpRequest = CustomXMLHttpRequest;
    
    // Also intercept fetch requests if used
    window.fetch = function(resource, options) {
        const url = typeof resource === 'string' ? resource : resource.url;
        
        if (url && (url.includes('steamtraderhelper.com') || url.includes('float.steamtraderhelper.com'))) {
            console.log('Intercepted fetch license request to:', url);
            
            // Return a successful response
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: () => Promise.resolve([successfulResponse.float]),
                text: () => Promise.resolve(JSON.stringify([successfulResponse.float])),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            });
        }
        
        // For non-license requests, use original fetch
        return originalFetch.apply(this, arguments);
    };
    
    console.log('License bypass initialized - all requests to steamtraderhelper.com will return successful responses');
    
})();

// Additional backup method - override specific functions that might check license
if (typeof chrome !== 'undefined' && chrome.extension) {
    // Hook into extension messaging to intercept license-related messages
    const originalSendMessage = chrome.extension.sendMessage;
    chrome.extension.sendMessage = function(message, callback) {
        // Check if this is a license-related message
        if (message && typeof message === 'object') {
            if (message.url && message.url.includes('steamtraderhelper.com')) {
                console.log('Intercepted extension message for license check');
                if (callback) {
                    setTimeout(() => callback({ success: true, float: 0.5 }), 10);
                }
                return;
            }
        }
        
        return originalSendMessage.apply(this, arguments);
    };
}