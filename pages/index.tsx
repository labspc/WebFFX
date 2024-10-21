import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';
import App from "./app";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 清除 URL 中的多余参数
    const { inputOptions, outputOptions, ...rest } = router.query;
    const newQuery = { ...rest };

    router.replace({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  }, [router]);

  return (
    <>
      <Head>
        <title>WebFFX: Local-first Converter</title>
      </Head>
      <App />
    </>
  );
}