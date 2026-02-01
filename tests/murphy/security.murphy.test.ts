/**
 * Murphy's Law Test Suite - Security Agent
 *
 * Mission: "Try to hack this"
 * Persona: Dr. Sarah Chen (Security Expert)
 *
 * This agent actively tries to break security by:
 * - Injection attacks (SQL, NoSQL, XSS)
 * - Auth bypass attempts
 * - Header manipulation
 * - Malicious input fuzzing
 */

describe('🔒 Security Agent: Murphy\'s Law Tests', () => {
  describe('SQL/NoSQL Injection Attacks', () => {
    const injectionPayloads = [
      { payload: '\'; DROP TABLE mappings; --', name: 'SQL DROP TABLE' },
      { payload: '1\' OR \'1\'=\'1', name: 'SQL OR bypass' },
      { payload: 'admin\'--', name: 'SQL comment bypass' },
      { payload: '{ $gt: \'\' }', name: 'NoSQL operator injection' },
      { payload: '\'; DELETE FROM users WHERE \'1\'=\'1\'--', name: 'SQL DELETE' },
      { payload: '1; UPDATE mappings SET target=\'hacked\' WHERE 1=1--', name: 'SQL UPDATE' },
    ]

    test.each(injectionPayloads)(
      'should reject $name in sourceIdentifier',
      async ({ payload }) => {
        const result = await fetch('/api/admin/mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'populi',
            sourceIdentifier: payload,
            sourceDescription: 'Test',
            financialEdgeAccount: '10-1000-000'
          })
        })

        // Murphy's Law: Either rejected OR sanitized, but NEVER executed
        if (result.ok) {
          const mapping = await result.json()
          // If accepted, must be sanitized
          expect(mapping.sourceIdentifier).not.toContain('DROP')
          expect(mapping.sourceIdentifier).not.toContain('DELETE')
          expect(mapping.sourceIdentifier).not.toContain('$gt')
        } else {
          // Should return error, not 500
          expect(result.status).toBe(400)
          const error = await result.json()
          expect(error.message).toBeDefined()
          expect(error.message).not.toContain('SQL') // Don't leak DB type
        }
      }
    )
  })

  describe('XSS (Cross-Site Scripting) Attacks', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      'javascript:alert("xss")',
      '<svg/onload=alert("xss")>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
    ]

    test.each(xssPayloads)(
      'should sanitize XSS payload: %s',
      async (payload) => {
        const result = await fetch('/api/admin/mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'populi',
            sourceIdentifier: '12345',
            sourceDescription: payload,
            financialEdgeAccount: '10-1000-000'
          })
        })

        if (result.ok) {
          const mapping = await result.json()
          // Must be escaped/sanitized
          expect(mapping.sourceDescription).not.toContain('<script>')
          expect(mapping.sourceDescription).not.toContain('onerror=')
          expect(mapping.sourceDescription).not.toContain('javascript:')
        }
      }
    )
  })

  describe('Authentication Bypass Attempts', () => {
    test('should reject fake Azure AD headers', async () => {
      const fakeToken = Buffer.from(JSON.stringify({
        claims: [
          { typ: 'groups', val: 'fake-admin-group' }
        ]
      })).toString('base64')

      const result = await fetch('/api/admin/mappings', {
        headers: {
          'x-ms-client-principal-id': 'fake-user-id',
          'x-ms-client-principal': fakeToken
        }
      })

      // Murphy's Law: Can't trust client-provided auth headers
      // Only Azure AD Easy Auth should set these
      expect(result.status).toBeOneOf([401, 403])
    })

    test('should reject requests without auth', async () => {
      const result = await fetch('/api/admin/mappings', {
        headers: {
          // No auth headers
        }
      })

      expect(result.status).toBe(401)
    })

    test('should reject expired/invalid sessions', async () => {
      // Test with malformed JWT
      const invalidToken = 'invalid.token.data'

      const result = await fetch('/api/admin/mappings', {
        headers: {
          'authorization': `Bearer ${invalidToken}`
        }
      })

      expect(result.status).toBeOneOf([401, 403])
    })
  })

  describe('Path Traversal Attacks', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f',
    ]

    test.each(traversalPayloads)(
      'should reject path traversal in mapping ID: %s',
      async (payload) => {
        const result = await fetch(`/api/admin/mappings/${payload}`, {
          method: 'GET'
        })

        // Should not access file system
        expect(result.status).toBeOneOf([400, 404])
        const body = await result.text()
        expect(body).not.toContain('/etc/passwd')
        expect(body).not.toContain('root:')
      }
    )
  })

  describe('Massive Input Attacks (DoS)', () => {
    test('should reject extremely long sourceIdentifier', async () => {
      const longString = 'A'.repeat(1000000) // 1MB string

      const result = await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'populi',
          sourceIdentifier: longString,
          sourceDescription: 'Test',
          financialEdgeAccount: '10-1000-000'
        })
      })

      // Murphy's Law: Request should be rejected, not crash server
      expect(result.status).toBe(400)
      const error = await result.json()
      expect(error.message).toContain('too long')
    })

    test('should reject deeply nested JSON', async () => {
      // Create deeply nested object (10,000 levels)
      let nested: any = { value: 'deep' }
      for (let i = 0; i < 10000; i++) {
        nested = { nested }
      }

      const result = await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nested)
      })

      // Should reject without stack overflow
      expect(result.status).toBeOneOf([400, 413]) // 413 = Payload Too Large
    })
  })

  describe('Race Condition Attacks', () => {
    test('should handle concurrent delete attempts', async () => {
      // Create a mapping
      const createResult = await fetch('/api/admin/mappings', {
        method: 'POST',
        body: JSON.stringify({
          source: 'populi',
          sourceIdentifier: 'race-test',
          sourceDescription: 'Test',
          financialEdgeAccount: '10-1000-000'
        })
      })
      const mapping = await createResult.json()

      // Try to delete it 10 times simultaneously
      const deletePromises = Array(10).fill(null).map(() =>
        fetch(`/api/admin/mappings/${mapping.id}`, {
          method: 'DELETE'
        })
      )

      const results = await Promise.all(deletePromises)

      // Murphy's Law: One succeeds (200), rest get 404
      const successCount = results.filter(r => r.status === 200).length
      const notFoundCount = results.filter(r => r.status === 404).length

      expect(successCount).toBe(1)
      expect(notFoundCount).toBe(9)
      expect(successCount + notFoundCount).toBe(10)
    })
  })

  describe('Unicode/Special Character Attacks', () => {
    const specialChars = [
      { char: '\u0000', name: 'null byte' },
      { char: '\r\n', name: 'CRLF injection' },
      { char: '💩', name: 'emoji pile of poo' },
      { char: '𝕳𝖆𝖈𝖐𝖊𝖉', name: 'mathematical bold' },
      { char: 'א', name: 'Hebrew aleph (RTL)' },
      { char: '​', name: 'zero-width space' },
    ]

    test.each(specialChars)(
      'should handle $name in account description',
      async ({ char }) => {
        const result = await fetch('/api/admin/mappings', {
          method: 'POST',
          body: JSON.stringify({
            source: 'populi',
            sourceIdentifier: '12345',
            sourceDescription: `Test ${char} Account`,
            financialEdgeAccount: '10-1000-000'
          })
        })

        // Murphy's Law: Either accepted (and encoded) or rejected
        // But never corrupts database
        expect(result.status).toBeOneOf([200, 201, 400])

        if (result.ok) {
          const mapping = await result.json()
          // Can retrieve it back
          const getResult = await fetch(`/api/admin/mappings/${mapping.id}`)
          expect(getResult.ok).toBe(true)
        }
      }
    )
  })
})

// Helper matchers
expect.extend({
  toBeOneOf(received: number, expected: number[]) {
    const pass = expected.includes(received)
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be one of ${expected}`
          : `Expected ${received} to be one of ${expected}`
    }
  }
})
