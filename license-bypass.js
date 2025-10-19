/**
 * Enhanced License Bypass for Steam Trader Helper
 * This script completely disables all license and premium checks
 * making the extension work as a full premium version without restrictions.
 */

(function() {
    'use strict';
    
    console.log('Enhanced Steam Trader Helper License Bypass loading...');
    
    // Store original functions
    const originalXHR = window.XMLHttpRequest;
    const originalFetch = window.fetch;
    
    // Mock successful license response
    const successfulResponse = {
        success: true,
        active: true,
        float: 0.5,
        subscription: 'premium',
        isPay: true,
        isPayS: true,
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        premium: true,
        licensed: true
    };
    
    // Override XMLHttpRequest for license server requests
    function CustomXMLHttpRequest() {
        const xhr = new originalXHR();
        let intercepted = false;
        let url = '';
        
        const originalOpen = xhr.open;
        xhr.open = function(method, reqUrl, async, user, password) {
            url = reqUrl;
            
            if (url && (url.includes('steamtraderhelper.com') || url.includes('float.steamtraderhelper.com'))) {
                console.log('License Bypass: Intercepted request to:', url);
                intercepted = true;
                
                Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                Object.defineProperty(this, 'status', { value: 200, writable: true });
                Object.defineProperty(this, 'statusText', { value: 'OK', writable: true });
                Object.defineProperty(this, 'responseText', { value: JSON.stringify([0.5]), writable: true });
                Object.defineProperty(this, 'response', { value: JSON.stringify([0.5]), writable: true });
                
                return;
            }
            
            return originalOpen.apply(this, arguments);
        };
        
        const originalSend = xhr.send;
        xhr.send = function(data) {
            if (intercepted) {
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
        
        const originalSetRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(header, value) {
            if (intercepted) {
                return;
            }
            return originalSetRequestHeader.apply(this, arguments);
        };
        
        return xhr;
    }
    
    // Replace global XMLHttpRequest
    window.XMLHttpRequest = CustomXMLHttpRequest;
    
    // Override fetch for license requests
    window.fetch = function(resource, options) {
        const url = typeof resource === 'string' ? resource : resource.url;
        
        if (url && (url.includes('steamtraderhelper.com') || url.includes('float.steamtraderhelper.com'))) {
            console.log('License Bypass: Intercepted fetch request to:', url);
            
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: () => Promise.resolve([0.5]),
                text: () => Promise.resolve(JSON.stringify([0.5])),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            });
        }
        
        return originalFetch.apply(this, arguments);
    };
    
    // Hook into STH object when it's created
    let sthHooked = false;
    
    function hookSTH() {
        if (typeof window.STH === 'function' && !sthHooked) {
            console.log('License Bypass: Hooking STH object');
            sthHooked = true;
            
            const originalSTH = window.STH;
            
            window.STH = function(param) {
                const result = originalSTH.apply(this, arguments);
                
                // Override specific checks
                if (typeof result === 'object' && result) {
                    // Force premium/paid status
                    if ('isPay' in result) result.isPay = true;
                    if ('isPayS' in result) result.isPayS = true;
                    if ('premium' in result) result.premium = true;
                    if ('licensed' in result) result.licensed = true;
                    if ('active' in result) result.active = true;
                    if ('start' in result) result.start = true;
                    
                    // Override auth functions
                    if (result.authS && typeof result.authS === 'function') {
                        const originalAuthS = result.authS;
                        result.authS = function() {
                            const authResult = originalAuthS.apply(this, arguments);
                            if (authResult && typeof authResult === 'object') {
                                authResult.isPay = true;
                                authResult.premium = true;
                                authResult.active = true;
                            }
                            return authResult || { isPay: true, premium: true, sessionID: 'dummy', currency: 1 };
                        };
                    }
                    
                    if (result.auth && typeof result.auth === 'function') {
                        const originalAuth = result.auth;
                        result.auth = function() {
                            const authResult = originalAuth.apply(this, arguments);
                            if (authResult && typeof authResult === 'object') {
                                authResult.isPay = true;
                                authResult.premium = true;
                                authResult.t = 'premium_token';
                            }
                            return authResult || { isPay: true, premium: true, t: 'premium_token' };
                        };
                    }
                }
                
                // Handle specific parameter calls
                if (param === 'start') {
                    return true; // Always return true for start check
                }
                
                if (typeof result === 'object' && result && result.isPay !== undefined) {
                    result.isPay = true;
                }
                
                return result;
            };
            
            // Copy all properties from original STH
            for (let prop in originalSTH) {
                if (originalSTH.hasOwnProperty(prop)) {
                    window.STH[prop] = originalSTH[prop];
                }
            }
        }
    }
    
    // Try to hook STH immediately and periodically
    hookSTH();
    const sthHookInterval = setInterval(() => {
        hookSTH();
        if (sthHooked) {
            clearInterval(sthHookInterval);
        }
    }, 100);
    
    // Clear interval after 10 seconds to avoid infinite checking
    setTimeout(() => {
        clearInterval(sthHookInterval);
    }, 10000);
    
    // Override chrome extension messaging for license checks
    if (typeof chrome !== 'undefined' && chrome.extension) {
        const originalSendMessage = chrome.extension.sendMessage;
        if (originalSendMessage) {
            chrome.extension.sendMessage = function(message, callback) {
                if (message && typeof message === 'object') {
                    // Intercept license-related requests
                    if (message.url && message.url.includes('steamtraderhelper.com')) {
                        console.log('License Bypass: Intercepted extension message for license check');
                        if (callback) {
                            setTimeout(() => callback({
                                success: true,
                                float: 0.5,
                                isPay: true,
                                premium: true,
                                active: true
                            }), 10);
                        }
                        return;
                    }
                    
                    // Intercept data requests that might check license
                    if (message.do === 'data' && message.name) {
                        const originalCallback = callback;
                        callback = function(response) {
                            if (response && typeof response === 'object') {
                                response.isPay = true;
                                response.isPayS = true;
                                response.premium = true;
                                response.start = true;
                                response.active = true;
                            }
                            return originalCallback ? originalCallback(response) : response;
                        };
                    }
                }
                
                return originalSendMessage.apply(this, arguments);
            };
        }
    }
    
    // Additional global overrides
    window.addEventListener('load', function() {
        // Override any global license check variables
        if (typeof window.g_bIsLicensed !== 'undefined') {
            window.g_bIsLicensed = true;
        }
        if (typeof window.g_bIsPremium !== 'undefined') {
            window.g_bIsPremium = true;
        }
        if (typeof window.isPay !== 'undefined') {
            window.isPay = true;
        }
        
        console.log('License Bypass: All license checks overridden - extension should work as premium version');
    });
    
    // Periodic override for dynamically created checks
    setInterval(() => {
        if (typeof window.STH === 'function') {
            try {
                const sthData = window.STH('data');
                if (sthData && typeof sthData === 'object') {
                    sthData.isPay = true;
                    sthData.isPayS = true;
                    sthData.premium = true;
                    sthData.start = true;
                    sthData.active = true;
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }, 1000);
    
    console.log('Enhanced License Bypass initialized - all premium features should be unlocked');
    
})();

// Additional method: Override Object.defineProperty to prevent license flags from being set to false
if (typeof Object !== 'undefined' && Object.defineProperty) {
    const originalDefineProperty = Object.defineProperty;
    
    Object.defineProperty = function(obj, prop, descriptor) {
        // Prevent setting license-related properties to false
        if (typeof prop === 'string' && 
            (prop.includes('isPay') || 
             prop.includes('premium') || 
             prop.includes('licensed') || 
             prop.includes('start') ||
             prop === 'active') &&
            descriptor && 
            descriptor.value === false) {
            
            console.log('License Bypass: Prevented setting', prop, 'to false');
            descriptor.value = true;
        }
        
        return originalDefineProperty.apply(this, arguments);
    };
}