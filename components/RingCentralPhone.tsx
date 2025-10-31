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
    
    // Initialize after a short delay to ensure widget is loaded
    const timer = setTimeout(initWidget, 2000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  // Component doesn't render anything - just handles authentication
  return null;
}
