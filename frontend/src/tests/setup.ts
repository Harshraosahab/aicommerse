import '@testing-library/jest-dom';

// Polyfill window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill window.scrollTo and scrollIntoView
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
