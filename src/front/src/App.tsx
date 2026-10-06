import { useEffect, useState } from 'react';

type Hello = { message: string };

export default function App() {
  const [hello, setHello] = useState<Hello | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json() as Promise<Hello>;
      })
      .then(setHello)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Music Catalog</h1>
      {error && <p role="alert">Could not reach the API: {error}</p>}
      {!error && !hello && <p>Loading…</p>}
      {hello && <p data-testid="hello">{hello.message}</p>}
    </main>
  );
}
