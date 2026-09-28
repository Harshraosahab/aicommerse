import { IProduct } from '../services/catalogApi';

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export interface ReviewItem {
  author?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

/**
 * Generate Google-compliant schema.org/Product structured data.
 * Adheres strictly to genuine database values with zero fake reviews/ratings.
 */
export function generateProductSchema(
  product: IProduct,
  reviews?: ReviewItem[],
  baseUrl: string = window.location.origin
): Record<string, any> {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const images = product.images.map((img) => img.url).filter(Boolean);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description.slice(0, 500),
    image: images.length > 0 ? images : primaryImage?.url ? [primaryImage.url] : [],
    sku: product.SKU,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/products/${product.slug}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  // Brand association
  if (product.brand?.name) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand.name,
    };
  }

  // AggregateRating: ONLY if genuine reviews and rating exist
  if (product.reviewCount > 0 && product.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Individual genuine reviews if provided
  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.author || 'Verified Buyer',
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: r.comment,
      datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : undefined,
    }));
  }

  return schema;
}

/**
 * Generate schema.org/BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  baseUrl: string = window.location.origin
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const entry: Record<string, any> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };
      if (item.url) {
        entry.item = item.url.startsWith('http')
          ? item.url
          : `${baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
      }
      return entry;
    }),
  };
}

/**
 * Generate schema.org/Organization structured data
 */
export function generateOrganizationSchema(
  storeName: string = 'Nexus Commerce',
  baseUrl: string = window.location.origin
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeName,
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
  };
}

/**
 * Generate schema.org/FAQPage structured data
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
