import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Hello from the Music Catalog API' }),
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows the greeting returned by the API', async () => {
    render(<App />);
    expect(await screen.findByTestId('hello')).toHaveTextContent('Hello from the Music Catalog API');
  });
});
