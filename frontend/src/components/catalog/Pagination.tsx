import React from 'react';
import { PaginationMetadata } from '../../services/catalogApi';
import { Button } from '../ui/Button';

interface PaginationProps {
  metadata: PaginationMetadata;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ metadata, onPageChange }) => {
  const { page, totalPages, totalItems, hasNextPage, hasPreviousPage } = metadata;

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-8)',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Showing page <strong style={{ color: 'var(--color-text)' }}>{page}</strong> of{' '}
        <strong style={{ color: 'var(--color-text)' }}>{totalPages}</strong> ({totalItems} items)
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
          aria-label="Go to previous page"
        >
          &larr; Previous
        </Button>

        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Sliding window around current page
            let pageNumber = i + 1;
            if (totalPages > 5) {
              if (page > 3 && page < totalPages - 1) {
                pageNumber = page - 2 + i;
              } else if (page >= totalPages - 1) {
                pageNumber = totalPages - 4 + i;
              }
            }

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-md)',
                  border: pageNumber === page ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: pageNumber === page ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: pageNumber === page ? 'var(--color-primary-contrast)' : 'var(--color-text)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  fontWeight: pageNumber === page ? 'bold' : 'normal',
                }}
                aria-current={pageNumber === page ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Go to next page"
        >
          Next &rarr;
        </Button>
      </div>
    </nav>
  );
};
