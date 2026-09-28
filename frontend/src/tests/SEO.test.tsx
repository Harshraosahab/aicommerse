import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { SEO } from '../components/common/SEO';
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateFAQSchema,
} from '../utils/structuredData';

describe('SEO Component & Structured Data', () => {
  beforeEach(() => {
    // Clean up any stray meta/link/script tags in document.head
    document.title = 'Default Title';
    const tags = document.head.querySelectorAll(
      'meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[data-schema="seo-structured-data"]'
    );
    tags.forEach((t) => t.remove());
  });

  afterEach(() => {
    cleanup();
  });

  it('updates document title with site suffix', () => {
    render(<SEO title="Wireless Headphones" />);
    expect(document.title).toBe('Wireless Headphones | Nexus Commerce');
  });

  it('sets meta description tag', () => {
    render(
      <SEO
        title="Gaming Laptop"
        description="High-performance gaming laptop with RTX 4080."
      />
    );
    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(metaDesc).not.toBeNull();
    expect(metaDesc.content).toBe('High-performance gaming laptop with RTX 4080.');
  });

  it('sets canonical link tag correctly with base domain', () => {
    render(
      <SEO
        title="Mechanical Keyboards"
        canonicalUrl="/category/keyboards"
      />
    );
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonical).not.toBeNull();
    expect(canonical.href).toContain('/category/keyboards');
  });

  it('sets robots tag to noindex, nofollow when noIndex is true', () => {
    render(<SEO title="Admin Portal" noIndex={true} />);
    const robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    expect(robots).not.toBeNull();
    expect(robots.content).toBe('noindex, nofollow');
  });

  it('sets robots tag to index, follow when noIndex is false', () => {
    render(<SEO title="Public Products" noIndex={false} />);
    const robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    expect(robots).not.toBeNull();
    expect(robots.content).toBe('index, follow');
  });

  it('injects Open Graph and Twitter Card tags', () => {
    render(
      <SEO
        title="Noise-Cancelling Earbuds"
        description="Premium sound quality with active noise cancellation."
        canonicalUrl="/products/earbuds-123"
        ogType="product"
        ogImage="https://example.com/images/earbuds.jpg"
      />
    );

    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    const ogType = document.querySelector('meta[property="og:type"]') as HTMLMetaElement;
    const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    const twitterCard = document.querySelector('meta[name="twitter:card"]') as HTMLMetaElement;

    expect(ogTitle?.content).toBe('Noise-Cancelling Earbuds | Nexus Commerce');
    expect(ogDesc?.content).toBe('Premium sound quality with active noise cancellation.');
    expect(ogType?.content).toBe('product');
    expect(ogImage?.content).toBe('https://example.com/images/earbuds.jpg');
    expect(twitterCard?.content).toBe('summary_large_image');
  });

  it('injects and parses JSON-LD structured data in script tag', () => {
    const orgSchema = generateOrganizationSchema('Nexus Commerce', 'https://shop.example.com');
    render(<SEO title="Home" schema={orgSchema} />);

    const scriptTag = document.getElementById('jsonld-structured-data');
    expect(scriptTag).not.toBeNull();
    expect(scriptTag?.getAttribute('type')).toBe('application/ld+json');

    const parsed = JSON.parse(scriptTag?.textContent || '{}');
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Organization');
    expect(parsed.name).toBe('Nexus Commerce');
    expect(parsed.url).toBe('https://shop.example.com');
  });

  describe('Structured Data Generators', () => {
    it('generateProductSchema produces valid Schema.org Product', () => {
      const mockProduct: any = {
        name: 'Pro Mechanical Keyboard',
        description: 'RGB mechanical gaming keyboard with brown switches',
        images: [{ url: 'https://example.com/keyboard.jpg', isPrimary: true }],
        SKU: 'KB-PRO-001',
        brand: { name: 'Keychron' },
        price: 129.99,
        stock: 10,
        rating: 4.8,
        reviewCount: 42,
        slug: 'pro-mechanical-keyboard',
      };

      const schema = generateProductSchema(mockProduct, undefined, 'https://shop.example.com');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Pro Mechanical Keyboard');
      expect(schema.sku).toBe('KB-PRO-001');
      expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Keychron' });
      expect(schema.offers.price).toBe('129.99');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
      expect(schema.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: 42,
        bestRating: '5',
        worstRating: '1',
      });
    });

    it('generateProductSchema omits aggregateRating when no reviews exist', () => {
      const mockProduct: any = {
        name: 'Brand New Item',
        description: 'New product without ratings',
        images: [],
        SKU: 'NEW-001',
        price: 49.99,
        stock: 0,
        rating: 0,
        reviewCount: 0,
        slug: 'brand-new-item',
      };

      const schema = generateProductSchema(mockProduct, undefined, 'https://shop.example.com');

      expect(schema.aggregateRating).toBeUndefined();
      expect(schema.offers.availability).toBe('https://schema.org/OutOfStock');
    });

    it('generateBreadcrumbSchema formats hierarchical itemListElement', () => {
      const crumbs = [
        { name: 'Home', url: 'https://shop.example.com' },
        { name: 'Electronics', url: 'https://shop.example.com/category/electronics' },
        { name: 'Keyboards' },
      ];
      const schema = generateBreadcrumbSchema(crumbs);

      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://shop.example.com',
      });
      expect(schema.itemListElement[2]).toEqual({
        '@type': 'ListItem',
        position: 3,
        name: 'Keyboards',
        item: undefined,
      });
    });

    it('generateFAQSchema creates valid Question and Answer entities', () => {
      const faqs = [
        {
          question: 'What is the return window?',
          answer: 'You can return eligible items within 30 days of delivery.',
        },
        {
          question: 'Do you offer international shipping?',
          answer: 'Yes, we ship to over 50 countries worldwide.',
        },
      ];

      const schema = generateFAQSchema(faqs);
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]['@type']).toBe('Question');
      expect(schema.mainEntity[0].name).toBe('What is the return window?');
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe(
        'You can return eligible items within 30 days of delivery.'
      );
    });
  });
});
