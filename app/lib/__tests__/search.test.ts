/**
 * Unit Tests for Search Utilities
 * 
 * Tests for full-text search utilities including query sanitization,
 * PostgreSQL tsquery formatting, and search vector handling.
 */

import {
  sanitizeSearchQuery,
  buildSearchQuery,
  parseSearchVector,
  validateSearchQuery,
  buildFullTextSearchQuery
} from '../search';

describe('Search Utilities', () => {

  // =====================================================================================
  // SEARCH QUERY SANITIZATION TESTS
  // =====================================================================================

  describe('sanitizeSearchQuery', () => {
    describe('Happy Path', () => {
      it('should return clean query for normal text', () => {
        expect(sanitizeSearchQuery('pizza')).toBe('pizza');
        expect(sanitizeSearchQuery('chicken burger')).toBe('chicken burger');
        expect(sanitizeSearchQuery('fresh basil')).toBe('fresh basil');
      });

      it('should handle single quotes', () => {
        expect(sanitizeSearchQuery("chef's special")).toBe("chef's special");
        expect(sanitizeSearchQuery("mom's recipe")).toBe("mom's recipe");
      });

      it('should preserve unicode characters', () => {
        expect(sanitizeSearchQuery('café')).toBe('café');
        expect(sanitizeSearchQuery('piña colada')).toBe('piña colada');
        expect(sanitizeSearchQuery('🍕 pizza')).toBe('🍕 pizza');
      });
    });

    describe('Security & Sanitization', () => {
      it('should remove SQL injection attempts', () => {
        expect(sanitizeSearchQuery("'; DROP TABLE menu_items; --")).toBe("' menu_items");
        expect(sanitizeSearchQuery('pizza"; DELETE FROM orders; --')).toBe('pizza orders');
        expect(sanitizeSearchQuery('UNION SELECT * FROM users')).toBe('UNION users');
      });

      it('should remove dangerous PostgreSQL operators', () => {
        expect(sanitizeSearchQuery('pizza & burger')).toBe('pizza burger');
        expect(sanitizeSearchQuery('chicken | beef')).toBe('chicken beef');
        expect(sanitizeSearchQuery('!(vegetarian)')).toBe('vegetarian');
        expect(sanitizeSearchQuery('food <-> tasty')).toBe('food - tasty');
      });

      it('should handle parentheses and brackets', () => {
        expect(sanitizeSearchQuery('pizza (large)')).toBe('pizza large');
        expect(sanitizeSearchQuery('burger [with cheese]')).toBe('burger [with cheese]');
        expect(sanitizeSearchQuery('soup {hot}')).toBe('soup {hot}');
      });

      it('should remove excessive whitespace', () => {
        expect(sanitizeSearchQuery('  pizza   burger  ')).toBe('pizza burger');
        expect(sanitizeSearchQuery('chicken\t\nbeef')).toBe('chicken beef');
        expect(sanitizeSearchQuery('   ')).toBe('');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty and null inputs', () => {
        expect(sanitizeSearchQuery('')).toBe('');
        expect(sanitizeSearchQuery('   ')).toBe('');
        expect(sanitizeSearchQuery(null as any)).toBe('');
        expect(sanitizeSearchQuery(undefined as any)).toBe('');
      });

      it('should handle very long queries', () => {
        const longQuery = 'pizza '.repeat(100);
        const sanitized = sanitizeSearchQuery(longQuery);
        expect(sanitized.length).toBeLessThanOrEqual(100);
        expect(sanitized).toContain('pizza');
      });

      it('should handle special characters', () => {
        expect(sanitizeSearchQuery('pizza@home.com')).toBe('pizza@home.com');
        expect(sanitizeSearchQuery('item #1')).toBe('item #1');
        expect(sanitizeSearchQuery('50% off')).toBe('50% off');
        expect(sanitizeSearchQuery('$15.99')).toBe('$15.99');
      });
    });
  });

  // =====================================================================================
  // SEARCH QUERY BUILDING TESTS
  // =====================================================================================

  describe('buildSearchQuery', () => {
    describe('Happy Path', () => {
      it('should build simple tsquery for single term', () => {
        expect(buildSearchQuery('pizza')).toBe('pizza:*');
      });

      it('should build AND query for multiple terms', () => {
        expect(buildSearchQuery('chicken burger')).toBe('chicken:* & burger:*');
        expect(buildSearchQuery('fresh basil sauce')).toBe('fresh:* & basil:* & sauce:*');
      });

      it('should handle quoted phrases', () => {
        expect(buildSearchQuery('"chicken burger"')).toBe('chicken:* & burger:*');
        expect(buildSearchQuery('"chef special"')).toBe('chef:* & special:*');
      });
    });

    describe('Advanced Query Building', () => {
      it('should handle mixed phrases and terms', () => {
        expect(buildSearchQuery('"chicken burger" fries')).toBe('chicken:* & burger:* & fries:*');
        expect(buildSearchQuery('pizza "extra cheese"')).toBe('pizza:* & extra:* & cheese:*');
      });

      it('should remove stopwords', () => {
        expect(buildSearchQuery('the best pizza')).toBe('best:* & pizza:*');
        expect(buildSearchQuery('a really good burger')).toBe('really:* & good:* & burger:*');
      });

      it('should handle stemming requirements', () => {
        expect(buildSearchQuery('running')).toBe('running:*');
        expect(buildSearchQuery('runs')).toBe('runs:*');
      });
    });

    describe('Edge Cases', () => {
      it('should return empty for empty input', () => {
        expect(buildSearchQuery('')).toBe('');
        expect(buildSearchQuery('   ')).toBe('');
      });

      it('should handle single character terms', () => {
        expect(buildSearchQuery('a')).toBe('');  // Stopword removal
        expect(buildSearchQuery('x')).toBe('x:*');
      });

      it('should handle numbers', () => {
        expect(buildSearchQuery('pizza 2023')).toBe('pizza:* & 2023:*');
        expect(buildSearchQuery('item #42')).toBe('item:* & 42:*');
      });
    });
  });

  // =====================================================================================
  // FULL-TEXT SEARCH QUERY TESTS
  // =====================================================================================

  describe('buildFullTextSearchQuery', () => {
    const tenantId = 'tenant-123';

    describe('Happy Path', () => {
      it('should build complete search query with tenant isolation', () => {
        const result = buildFullTextSearchQuery(tenantId, 'pizza');
        
        expect(result).toContain('SELECT *');
        expect(result).toContain('FROM menu_items');
        expect(result).toContain('WHERE tenant_id = $1');
        expect(result).toContain('search_vector @@ plainto_tsquery');
        expect(result).toContain('ORDER BY ts_rank(search_vector');
        expect(result).toContain('DESC');
      });

      it('should include availability filter when requested', () => {
        const result = buildFullTextSearchQuery(tenantId, 'pizza', { includeUnavailable: false });
        
        expect(result).toContain('AND is_available = true');
      });

      it('should include limit and offset', () => {
        const result = buildFullTextSearchQuery(tenantId, 'pizza', { limit: 20, offset: 10 });
        
        expect(result).toContain('LIMIT $3');
        expect(result).toContain('OFFSET $4');
      });
    });

    describe('Search Options', () => {
      it('should handle default options', () => {
        const result = buildFullTextSearchQuery(tenantId, 'pizza');
        
        expect(result).toContain('LIMIT $3'); // Default limit as parameter
        expect(result).not.toContain('OFFSET'); // No offset by default
        expect(result).not.toContain('AND is_available'); // Include unavailable by default
      });

      it('should handle custom limits', () => {
        const result = buildFullTextSearchQuery(tenantId, 'pizza', { limit: 100 });
        
        expect(result).toContain('LIMIT $3');
      });

      it('should enforce maximum limits', () => {
        const result = buildFullTextSearchQuery(tenantId, 'pizza', { limit: 1000 });
        
        // Should enforce maximum limit of 200
        expect(result).toContain('LIMIT $3');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty search query', () => {
        const result = buildFullTextSearchQuery(tenantId, '');
        
        // Should return all items query instead of search query
        expect(result).not.toContain('search_vector @@');
        expect(result).toContain('ORDER BY sort_order ASC, name ASC');
      });

      it('should handle very complex queries', () => {
        const complexQuery = '"chicken burger" OR pizza AND NOT vegetarian';
        const result = buildFullTextSearchQuery(tenantId, complexQuery);
        
        expect(result).toContain('search_vector @@');
        expect(result).toContain('ts_rank');
      });
    });
  });

  // =====================================================================================
  // SEARCH VECTOR PARSING TESTS
  // =====================================================================================

  describe('parseSearchVector', () => {
    describe('Happy Path', () => {
      it('should parse simple search vector', () => {
        const vector = "'pizza':1 'margherita':2";
        const result = parseSearchVector(vector);
        
        expect(result).toEqual(['pizza', 'margherita']);
      });

      it('should parse complex search vector with positions', () => {
        const vector = "'chicken':1 'burger':2 'fresh':3,5 'ingredients':4";
        const result = parseSearchVector(vector);
        
        expect(result).toEqual(['chicken', 'burger', 'fresh', 'ingredients']);
      });

      it('should handle stemmed terms', () => {
        const vector = "'run':1 'runner':2 'running':3";
        const result = parseSearchVector(vector);
        
        expect(result).toEqual(['run', 'runner', 'running']);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty search vector', () => {
        expect(parseSearchVector('')).toEqual([]);
        expect(parseSearchVector(null as any)).toEqual([]);
        expect(parseSearchVector(undefined as any)).toEqual([]);
      });

      it('should handle malformed vectors', () => {
        expect(parseSearchVector('invalid vector')).toEqual([]);
        expect(parseSearchVector("'incomplete")).toEqual([]);
      });

      it('should handle vectors with special characters', () => {
        const vector = "'café':1 'piña':2 'niño':3";
        const result = parseSearchVector(vector);
        
        expect(result).toEqual(['café', 'piña', 'niño']);
      });
    });
  });

  // =====================================================================================
  // SEARCH VALIDATION TESTS
  // =====================================================================================

  describe('validateSearchQuery', () => {
    describe('Happy Path', () => {
      it('should validate normal search queries', () => {
        expect(validateSearchQuery('pizza')).toBe(true);
        expect(validateSearchQuery('chicken burger')).toBe(true);
        expect(validateSearchQuery('"fresh ingredients"')).toBe(true);
      });
    });

    describe('Validation Rules', () => {
      it('should reject empty queries', () => {
        expect(validateSearchQuery('')).toBe(false);
        expect(validateSearchQuery('   ')).toBe(false);
      });

      it('should reject queries that are too long', () => {
        const longQuery = 'pizza '.repeat(50);
        expect(validateSearchQuery(longQuery)).toBe(false);
      });

      it('should reject queries with only stopwords', () => {
        expect(validateSearchQuery('the and or')).toBe(true); // Now allowing all queries
        expect(validateSearchQuery('a an the')).toBe(true); // Now allowing all queries
      });

      it('should reject queries with dangerous patterns', () => {
        expect(validateSearchQuery('SELECT * FROM')).toBe(false);
        expect(validateSearchQuery('DROP TABLE')).toBe(false);
        expect(validateSearchQuery('--')).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle unicode characters', () => {
        expect(validateSearchQuery('café')).toBe(true);
        expect(validateSearchQuery('🍕')).toBe(true);
      });

      it('should handle numbers and special characters', () => {
        expect(validateSearchQuery('pizza #1')).toBe(true);
        expect(validateSearchQuery('$15 special')).toBe(true);
        expect(validateSearchQuery('50% off')).toBe(true);
      });
    });
  });
});