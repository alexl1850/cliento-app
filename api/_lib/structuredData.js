// Pure JSON-LD builder functions, extracted from build-website.js's inline
// schema assembly. Kept dependency-free (no DB/network calls) so location
// pages (a later phase) can reuse the same builders for their own
// LocalBusiness/BreadcrumbList variants instead of duplicating the shape.

export function buildLocalBusinessJsonLd({ schemaType, name, description, image, url, telephone, email, address, areaServed, realReviews }) {
  return {
    '@type': schemaType,
    name,
    description,
    image,
    url,
    telephone: telephone || undefined,
    email: email || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address?.streetAddress,
      addressLocality: address?.addressLocality,
      addressCountry: address?.addressCountry || 'AU',
    },
    areaServed,
    // Only ever backed by real, pulled Google reviews — never generated
    // from AI-fabricated testimonials. This is the one hard rule the whole
    // Technical SEO pass is built around.
    ...(realReviews?.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: realReviews.rating,
        reviewCount: realReviews.userRatingCount || realReviews.reviews.length,
      },
      review: realReviews.reviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: r.rating ? { '@type': 'Rating', ratingValue: r.rating } : undefined,
        reviewBody: r.text || undefined,
      })),
    } : {}),
  };
}

// One Service entity per listed service — lets Google surface individual
// services in rich results rather than just the business as a whole.
export function buildServiceJsonLd(services, { bizName, areaServed }) {
  if (!Array.isArray(services) || !services.length) return [];
  return services.map(s => ({
    '@type': 'Service',
    name: s.name,
    description: s.desc,
    provider: { '@type': 'LocalBusiness', name: bizName },
    areaServed,
  }));
}

export function buildFaqJsonLd(faqs) {
  if (!Array.isArray(faqs) || !faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function buildBreadcrumbJsonLd(items) {
  if (!Array.isArray(items) || !items.length) return null;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Combines any number of entities into one @graph document — the standard
// pattern for multiple schema types on one page, instead of awkwardly
// nesting Service/FAQPage/BreadcrumbList inside the LocalBusiness object.
export function buildJsonLdGraph(entities) {
  return {
    '@context': 'https://schema.org',
    '@graph': entities.filter(Boolean),
  };
}
