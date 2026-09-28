import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const TestComponent = () => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="resolved-theme-val">{resolvedTheme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
};

describe('ThemeContext & Theme Switcher Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default theme and applies data-theme attribute on root', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const resolved = screen.getByTestId('resolved-theme-val').textContent;
    expect(resolved === 'light' || resolved === 'dark').toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe(resolved);
  });

  it('toggles theme between dark and light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByText('Toggle Theme');
    const initialResolved = screen.getByTestId('resolved-theme-val').textContent;

    fireEvent.click(toggleBtn);
    const afterFirstToggle = screen.getByTestId('resolved-theme-val').textContent;
    expect(afterFirstToggle).not.toBe(initialResolved);
    expect(document.documentElement.getAttribute('data-theme')).toBe(afterFirstToggle);

    fireEvent.click(toggleBtn);
    const afterSecondToggle = screen.getByTestId('resolved-theme-val').textContent;
    expect(afterSecondToggle).toBe(initialResolved);
  });

  it('persists theme selection to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Light'));
    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(localStorage.getItem('nexus_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(localStorage.getItem('nexus_theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
