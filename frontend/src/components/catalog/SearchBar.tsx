import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, SearchSuggestionsResponse } from '../../services/catalogApi';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
  placeholder = 'Search products, categories, brands...',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse['data'] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Sync initial query if changed from URL
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Debounced autocomplete suggestions lookup
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await catalogApi.getSearchSuggestions(query);
        if (res.success && res.data) {
          const hasAny =
            res.data.products.length > 0 ||
            res.data.categories.length > 0 ||
            res.data.brands.length > 0;
          setSuggestions(res.data);
          setIsOpen(hasAny);
        }
      } catch {
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (onSearch) {
      onSearch(query.trim());
    } else {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions) setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search catalog"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          style={{
            width: '100%',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '350px',
            overflowY: 'auto',
          }}
        >
          {isLoading && (
            <div style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
              Searching...
            </div>
          )}

          {/* Products */}
          {suggestions.products.length > 0 && (
            <div style={{ padding: 'var(--space-2) 0' }}>
              <div style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                Products
              </div>
              {suggestions.products.map((p) => (
                <div
                  key={p.slug}
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelectSuggestion(`/products/${p.slug}`)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  📦 {p.name}
                </div>
              ))}
            </div>
          )}

          {/* Categories */}
          {suggestions.categories.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-2) 0' }}>
              <div style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                Categories
              </div>
              {suggestions.categories.map((c) => (
                <div
                  key={c.slug}
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelectSuggestion(`/category/${c.slug}`)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  📁 {c.name}
                </div>
              ))}
            </div>
          )}

          {/* Brands */}
          {suggestions.brands.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-2) 0' }}>
              <div style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', fontWeight: 600 }}>
                Brands
              </div>
              {suggestions.brands.map((b) => (
                <div
                  key={b.slug}
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelectSuggestion(`/brand/${b.slug}`)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  🏷️ {b.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
