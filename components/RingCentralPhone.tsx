'use client';

import { useEffect } from 'react';

export default function RingCentralPhone() {
  useEffect(() => {
    // Wait for RingCentral widget to load
    const initWidget = () => {
      // Listen for messages from RingCentral widget
      window.addEventListener('message', async (e) => {
        const data = e.data;
        
        // Check if message is from RingCentral widget
        if (data && data.type === 'rc-adapter-message-request') {
          // Widget is requesting authorization
          if (data.path === '/authorize') {
            console.log('RingCentral widget requesting authorization...');
            
            try {
              // Call our auth endpoint to get access token
              const response = await fetch('/api/ringcentral/auth');
              const authData = await response.json();
              
              if (authData.access_token) {
                console.log('Got RingCentral access token, sending to widget...');
                
                // Send token back to widget
                const iframe = document.querySelector('#rc-widget-adapter-frame') as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.postMessage({
                    type: 'rc-adapter-message-response',
                    responseId: data.requestId,
                    response: {
                      data: authData
                    }
                  }, '*');
                  
                  console.log('✅ RingCentral authenticated successfully!');
                  
                  // Hide demo banner after authentication
                  setTimeout(() => {
                    createBannerOverlay();
                  }, 1000);
                }
              } else {
                console.error('Failed to get RingCentral access token:', authData);
              }
            } catch (error) {
              console.error('Error authenticating RingCentral:', error);
            }
          }
        }
      });
      
      console.log('RingCentral Phone: Listening for widget messages...');
    };
    
    // Function to create an overlay that covers the demo banner
    const createBannerOverlay = () => {
      console.log('🎨 Attempting to create banner overlay...');
      
      const iframe = document.querySelector('#rc-widget-adapter-frame') as HTMLIFrameElement;
      if (!iframe) {
        console.log('⚠️  RingCentral iframe not found yet, will retry...');
        return false;
      }
      
      // Check if overlay already exists
      let overlay = document.querySelector('.rc-banner-overlay') as HTMLDivElement;
      if (overlay) {
        console.log('✅ Overlay already exists');
        return true;
      }
      
      // Create overlay element
      overlay = document.createElement('div');
      overlay.className = 'rc-banner-overlay';
      overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 42px !important;
        background: #0073ae !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        display: block !important;
      `;
      
      // Append to body to ensure it's on top of everything
      document.body.appendChild(overlay);
      console.log('✅ Demo banner overlay created and appended to body!');
      
      // Also try to position relative to iframe
      const parent = iframe.parentElement;
      if (parent) {
        const parentPosition = window.getComputedStyle(parent).position;
        if (parentPosition === 'static') {
          parent.style.position = 'relative';
        }
      }
      
      return true;
    };
    
    // Initialize after a short delay to ensure widget is loaded
    const timer = setTimeout(initWidget, 2000);
    
    // Create overlay with multiple retry attempts to ensure it works
    const overlayTimers: NodeJS.Timeout[] = [];
    
    // Try creating overlay at multiple intervals
    [3000, 5000, 7000, 10000, 15000].forEach(delay => {
      const t = setTimeout(() => {
        const created = createBannerOverlay();
        if (created) {
          // Clear remaining timers if overlay was created
          overlayTimers.forEach(timer => clearTimeout(timer));
        }
      }, delay);
      overlayTimers.push(t);
    });
    
    // Additional attempt to hide demo banner using CSS (for any elements outside iframe)
    const hideBannerStyle = document.createElement('style');
    hideBannerStyle.textContent = `
      [class*="rc-banner"],
      [class*="rc-demo"],
      [id*="rc-banner"],
      div[class*="Banner"][class*="demo"] {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(hideBannerStyle);
    
    return () => {
      clearTimeout(timer);
      overlayTimers.forEach(t => clearTimeout(t));
      if (hideBannerStyle && hideBannerStyle.parentNode) {
        document.head.removeChild(hideBannerStyle);
      }
      // Remove overlay on cleanup
      const overlay = document.querySelector('.rc-banner-overlay');
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
  }, []);
  
  // Component doesn't render anything - just handles authentication
  return null;
}
