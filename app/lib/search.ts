/**
 * Full-Text Search Utilities
 * 
 * PostgreSQL full-text search utilities for menu items including query sanitization,
 * tsquery building, and search vector parsing with security measures.
 */

import type { SearchOptions } from '~/types/menu';

// =====================================================================================
// CONSTANTS AND CONFIGURATION
// =====================================================================================

const SEARCH_CONSTRAINTS = {
  QUERY_MIN_LENGTH: 1,
  QUERY_MAX_LENGTH: 100,
  RESULTS_DEFAULT_LIMIT: 50,
  RESULTS_MAX_LIMIT: 200
} as const;

// Common English stopwords to remove from search queries
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'would'
]);

// Dangerous patterns that should be rejected
const DANGEROUS_PATTERNS = [
  /select\s+.*from/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /insert\s+into/i,
  /update\s+.*set/i,
  /union\s+select/i,
  /--/,
  /\/\*/,
  /\*\//,
  /<script/i,
  /javascript:/i
];

// PostgreSQL full-text search operators that need to be escaped or removed
const TSQUERY_OPERATORS = /[&|!()<>]/g;

// =====================================================================================
// QUERY SANITIZATION
// =====================================================================================

/**
 * Sanitize search query to prevent SQL injection and remove dangerous characters
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  let sanitized = query.replace(/[\x00-\x1F\x7F]/g, ' ');

  // Remove dangerous SQL patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove PostgreSQL full-text search operators
  sanitized = sanitized.replace(TSQUERY_OPERATORS, ' ');

  // Remove SQL injection attempts (but keep single quotes for normal text)
  sanitized = sanitized.replace(/[";`\\]/g, ' ');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Truncate if too long
  if (sanitized.length > SEARCH_CONSTRAINTS.QUERY_MAX_LENGTH) {
    sanitized = sanitized.substring(0, SEARCH_CONSTRAINTS.QUERY_MAX_LENGTH).trim();
  }

  return sanitized;
}

/**
 * Validate search query for safety and usability
 */
export function validateSearchQuery(query: string): boolean {
  // Check if empty
  if (!query || query.trim().length < SEARCH_CONSTRAINTS.QUERY_MIN_LENGTH) {
    return false;
  }

  // Check if too long
  if (query.length > SEARCH_CONSTRAINTS.QUERY_MAX_LENGTH) {
    return false;
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(query)) {
      return false;
    }
  }

  // Check if query contains only stopwords
  const words = query.toLowerCase().split(/\s+/);
  const meaningfulWords = words.filter(word => !STOPWORDS.has(word) && word.length > 0);
  
  // Return true even if only stopwords for now - let the database handle it
  return true;
}

// =====================================================================================
// TSQUERY BUILDING
// =====================================================================================

/**
 * Build PostgreSQL tsquery from search terms
 */
export function buildSearchQuery(query: string): string {
  if (!query || !query.trim()) {
    return '';
  }

  const sanitized = sanitizeSearchQuery(query);
  if (!sanitized) {
    return '';
  }

  // Handle quoted phrases
  const phrases: string[] = [];
  let processed = sanitized.replace(/"([^"]+)"/g, (match, phrase) => {
    const placeholder = `__PHRASE_${phrases.length}__`;
    phrases.push(phrase.trim());
    return placeholder;
  });

  // Split remaining text into words
  const words = processed
    .split(/\s+/)
    .filter(word => word.length > 0);

  // Build tsquery parts
  const tsqueryParts: string[] = [];

  for (const word of words) {
    if (word.startsWith('__PHRASE_')) {
      // Replace phrase placeholder
      const phraseIndex = parseInt(word.replace('__PHRASE_', '').replace('__', ''));
      if (phraseIndex < phrases.length) {
        const phraseWords = phrases[phraseIndex]
          .split(/\s+/)
          .filter(w => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));
        
        if (phraseWords.length > 1) {
          tsqueryParts.push(`${phraseWords.join(' <-> ')}`);
        } else if (phraseWords.length === 1) {
          tsqueryParts.push(`${phraseWords[0]}:*`);
        }
      }
    } else {
      // Skip stopwords for regular words
      if (!STOPWORDS.has(word.toLowerCase())) {
        // Clean special characters but keep alphanumeric
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord) {
          tsqueryParts.push(`${cleanWord}:*`);
        }
      }
    }
  }

  // Join with AND operator
  return tsqueryParts.join(' & ');
}

/**
 * Build complete full-text search SQL query with tenant isolation
 */
export function buildFullTextSearchQuery(
  tenantId: string,
  query: string,
  options: SearchOptions = {}
): string {
  const {
    limit = SEARCH_CONSTRAINTS.RESULTS_DEFAULT_LIMIT,
    offset = 0,
    includeUnavailable = true
  } = options;

  // Sanitize and validate query
  const sanitizedQuery = sanitizeSearchQuery(query);
  
  // If empty query, return all items
  if (!sanitizedQuery) {
    return buildAllItemsQuery(tenantId, options);
  }

  // Build availability filter
  const availabilityFilter = includeUnavailable ? '' : ' AND is_available = true';
  
  // Enforce limits
  const safeLimit = Math.min(limit, SEARCH_CONSTRAINTS.RESULTS_MAX_LIMIT);
  const safeOffset = Math.max(offset, 0);

  // Build the complete query
  let sql = `
    SELECT *
    FROM menu_items
    WHERE tenant_id = $1
      AND search_vector @@ plainto_tsquery('english', $2)
      ${availabilityFilter}
    ORDER BY ts_rank(search_vector, plainto_tsquery('english', $2)) DESC,
             sort_order ASC,
             name ASC
  `;

  // Add pagination
  let paramCount = 2; // tenantId and query
  if (!includeUnavailable) {
    paramCount++; // is_available filter adds a parameter
  }
  
  if (safeLimit > 0) {
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
  }
  
  if (safeOffset > 0) {
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
  }

  return sql.trim();
}

/**
 * Build query for all items (when search query is empty)
 */
function buildAllItemsQuery(tenantId: string, options: SearchOptions = {}): string {
  const {
    limit = SEARCH_CONSTRAINTS.RESULTS_DEFAULT_LIMIT,
    offset = 0,
    includeUnavailable = true
  } = options;

  const availabilityFilter = includeUnavailable ? '' : ' AND is_available = true';
  const safeLimit = Math.min(limit, SEARCH_CONSTRAINTS.RESULTS_MAX_LIMIT);
  const safeOffset = Math.max(offset, 0);

  let sql = `
    SELECT *
    FROM menu_items
    WHERE tenant_id = $1
    ${availabilityFilter}
    ORDER BY sort_order ASC, name ASC
  `;

  let paramCount = 1; // tenantId
  if (!includeUnavailable) {
    paramCount++; // is_available filter adds a parameter
  }
  
  if (safeLimit > 0) {
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
  }
  
  if (safeOffset > 0) {
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
  }

  return sql.trim();
}

// =====================================================================================
// SEARCH VECTOR UTILITIES
// =====================================================================================

/**
 * Parse PostgreSQL search vector (tsvector) to extract terms
 */
export function parseSearchVector(vector: string | null | undefined): string[] {
  if (!vector || typeof vector !== 'string') {
    return [];
  }

  try {
    // PostgreSQL tsvector format: 'term':position(s) 'term2':position(s)
    const termMatches = vector.match(/'([^']+)':\d+(?:,\d+)*/g);
    
    if (!termMatches) {
      return [];
    }

    return termMatches.map(match => {
      const term = match.match(/'([^']+)':/);
      return term ? term[1] : '';
    }).filter(term => term.length > 0);
  } catch (error) {
    console.warn('Failed to parse search vector:', error);
    return [];
  }
}

/**
 * Generate search vector content for manual testing
 */
export function generateSearchVectorContent(name: string, description?: string): string {
  const content = [
    name || '',
    description || ''
  ].filter(text => text.trim().length > 0).join(' ');

  return content.trim();
}

/**
 * Build parameters array for search query
 */
export function buildSearchParams(
  tenantId: string,
  query: string,
  options: SearchOptions = {}
): (string | number)[] {
  const { limit, offset } = options;
  const sanitizedQuery = sanitizeSearchQuery(query);
  
  if (!sanitizedQuery) {
    // For all items query
    const params: (string | number)[] = [tenantId];
    
    if (limit !== undefined && limit > 0) {
      params.push(Math.min(limit, SEARCH_CONSTRAINTS.RESULTS_MAX_LIMIT));
    }
    
    if (offset !== undefined && offset > 0) {
      params.push(Math.max(offset, 0));
    }
    
    return params;
  }

  // For search query
  const params: (string | number)[] = [tenantId, sanitizedQuery];
  
  if (limit !== undefined && limit > 0) {
    params.push(Math.min(limit, SEARCH_CONSTRAINTS.RESULTS_MAX_LIMIT));
  }
  
  if (offset !== undefined && offset > 0) {
    params.push(Math.max(offset, 0));
  }
  
  return params;
}

// =====================================================================================
// SEARCH RESULT UTILITIES
// =====================================================================================

/**
 * Calculate search execution time
 */
export function calculateSearchTime(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Format search results with metadata
 */
export function formatSearchResults<T>(
  items: T[],
  query: string,
  searchTime: number,
  total?: number
) {
  return {
    items,
    query: sanitizeSearchQuery(query),
    total: total ?? items.length,
    searchTime
  };
}

// =====================================================================================
// DEBUGGING UTILITIES
// =====================================================================================

/**
 * Debug search query building (development only)
 */
export function debugSearchQuery(query: string): {
  original: string;
  sanitized: string;
  tsquery: string;
  isValid: boolean;
} {
  const sanitized = sanitizeSearchQuery(query);
  const tsquery = buildSearchQuery(sanitized);
  const isValid = validateSearchQuery(query);

  return {
    original: query,
    sanitized,
    tsquery,
    isValid
  };
}

/**
 * Get search constraints (for validation)
 */
export function getSearchConstraints() {
  return { ...SEARCH_CONSTRAINTS };
}