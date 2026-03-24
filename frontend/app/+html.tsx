import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#0D1117" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>Tonic AI</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #0a0c14;
              }
              body {
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: stretch;
              }
              #root {
                display: flex;
                height: 100%;
                flex: 1;
                max-width: 430px;
                width: 100%;
                position: relative;
                overflow: hidden;
              }
              @media (min-width: 431px) {
                body {
                  background-color: #060810;
                  background-image:
                    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.05) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(100,160,255,0.04) 0%, transparent 50%);
                  align-items: center;
                }
                #root {
                  box-shadow:
                    0 0 0 1px rgba(255,215,0,0.12),
                    0 8px 80px rgba(0,0,0,0.7),
                    0 0 40px rgba(255,215,0,0.04);
                  border-radius: 0px;
                  height: 100vh;
                  max-height: 900px;
                }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
