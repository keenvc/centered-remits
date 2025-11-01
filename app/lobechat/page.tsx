'use client';

import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';

export default function LobeChatPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    // Preload iframe
    const timer = setTimeout(() => setIframeLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="h-[calc(100vh-140px)]">
        {/* Loading State */}
        {!iframeLoaded && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading AI Chat...</p>
            </div>
          </div>
        )}

        {/* LobeChat Iframe */}
        <iframe
          src={typeof window !== 'undefined' && window.location.hostname === 'localhost' 
            ? 'http://localhost:3210' 
            : 'http://ih003.advancedcare.ai:3210'}
          className={`w-full h-full border-0 ${!iframeLoaded ? 'hidden' : ''}`}
          title="LobeChat AI Assistant"
          onLoad={() => setIframeLoaded(true)}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </main>

      {/* Info Banner - Positioned above RingCentral widget */}
      {iframeLoaded && (
        <div className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI Chat: Ultra-fast Groq LLM</span>
          </div>
        </div>
      )}
    </div>
  );
}
