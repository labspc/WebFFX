import "antd/dist/reset.css";
import "./app/index.css";
import Script from "next/script";

// pages/_app.tsx
import type { AppProps } from 'next/app';
import 'styles/globals.css'; // 引入全局 CSS 文件

function MyApp({ Component, pageProps }: { Component: React.ComponentType, pageProps: any }) {
  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=G-M4JFD2DM29`}
      />

      <Script strategy="lazyOnload" id="ga">
        {`
          window.ga_user_id = window.localStorage.getItem('ga_user_id') || '' + Date.now() + Math.floor(Math.random()*1e4);
          window.localStorage.setItem('ga_user_id', window.ga_user_id);
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-M4JFD2DM29', {
            page_path: window.location.pathname,
            user_id: window.ga_user_id
          });
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
