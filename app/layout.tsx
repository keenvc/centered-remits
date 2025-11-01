import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { VersionChecker } from "@/components/VersionChecker";
import RingCentralPhone from "@/components/RingCentralPhone";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Read version from package.json at build time
const APP_VERSION = process.env.npm_package_version || '0.1.0';

export const metadata: Metadata = {
  title: "AdvancedCare Remits",
  description: "Remittance Advice and Billing Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="app-version" content={APP_VERSION} />
        <Script
          id="marker-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.markerConfig = {
                project: '68fdd9e26e5cdfe5706269d3', 
                source: 'snippet'
              };

              !function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);
            `
          }}
        />
        <Script
          id="ringcentral-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.RingCentralEmbeddableConfig = {
                clientId: '${process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID || '6ShnSu51DKYchbvsHMzEzv'}',
                appServer: 'https://platform.ringcentral.com',
                redirectUri: typeof window !== 'undefined' ? window.location.origin + '/redirect.html' : '',
                disableLoginPopup: true,
                appName: 'AdvancedCare Centered',
                appVersion: '1.0.0',
                enableDiscovery: false,
                disableGlip: true,
                disableConferenceInvite: true,
                disableMessages: true,
                disableMeetings: true,
                disableConferenceCall: true,
                enableCallHistory: true,
                disableActiveCallControl: false,
                prefix: 'rc-widget',
                showMyLocation: false,
                enableWebRTCPlanB: false,
                disableCallBadge: true,
                brand: {
                  id: '${process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID || '6ShnSu51DKYchbvsHMzEzv'}',
                  name: 'AdvancedCare Centered',
                  code: 'advancedcare'
                }
              };
            `
          }}
        />
        <Script
          id="ringcentral-embeddable"
          strategy="lazyOnload"
          src="https://apps.ringcentral.com/integration/ringcentral-embeddable/2.x/adapter.js"
        />
      </head>
      <body className={inter.className}>
        <VersionChecker />
        <RingCentralPhone />
        {children}
      </body>
    </html>
  );
}
