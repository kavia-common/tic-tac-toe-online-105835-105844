import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header title', () => {
  render(<App />);
  const title = screen.getByRole('heading', { name: /Tic Tac Toe/i });
  expect(title).toBeInTheDocument();
});
