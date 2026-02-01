# Murphy's Law Test Suite
**"Anything that can go wrong, will go wrong"**

## Quick Start

```bash
# Install dependencies (if needed)
npm install --save-dev jest @playwright/test

# Run all Murphy's Law tests
npm run test:murphy

# Run specific agent
npm run test:murphy -- security
npm run test:murphy -- devops

# Watch mode
npm run test:murphy -- --watch
```

## What is This?

Traditional testing asks: **"Does this work?"**

Murphy's Law testing asks: **"How will this break?"**

Each test is written from the perspective of an adversarial agent trying to break the system:

- 🔒 **Security Agent**: Tries to hack it (injection, XSS, auth bypass)
- 🚀 **DevOps Agent**: Simulates infrastructure chaos (DB crashes, timeouts)
- 💻 **Frontend Agent**: Tests weird user behavior (double-click, offline)
- ♿ **Accessibility Agent**: Tests with keyboard-only, screen readers
- 🧪 **QA Agent**: Tests boundary conditions (null, 0, max values)

## Current Test Coverage

### Security Agent (35 attacks)
- ✅ SQL/NoSQL injection (6 payloads)
- ✅ XSS attacks (5 payloads)
- ✅ Auth bypass attempts (3 scenarios)
- ✅ Path traversal (4 payloads)
- ✅ DoS via massive input (2 scenarios)
- ✅ Race conditions (concurrent deletes)
- ✅ Unicode/special characters (6 types)

### DevOps Agent (20 chaos scenarios)
- ✅ Database connection failures
- ✅ Environment variable missing
- ✅ Network timeouts
- ✅ Resource exhaustion
- ✅ Concurrent operations
- ✅ Server restarts mid-request
- ✅ Error propagation
- ✅ Logging/observability

### Coming Soon
- Frontend Agent (Playwright)
- Accessibility Agent
- QA Agent

## Test Results Interpretation

```
PASS  tests/murphy/security.murphy.test.ts
  🔒 Security Agent: Murphy's Law Tests
    SQL/NoSQL Injection Attacks
      ✓ should reject SQL DROP TABLE (152ms)
      ✓ should reject SQL OR bypass (45ms)
      ✓ should reject NoSQL operator injection (38ms)
```

**What this means:**
- ✅ **PASS**: System handled the attack correctly (rejected or sanitized)
- ❌ **FAIL**: System is vulnerable to this attack
- ⚠️ **WARN**: Attack succeeded but didn't cause damage (review needed)

## Adding New Tests

### 1. Create a new persona test file
```typescript
// tests/murphy/frontend.murphy.test.ts
describe('💻 Frontend Agent: Murphy\'s Law Tests', () => {
  describe('Double-Click Chaos', () => {
    test('Murphy: User clicks submit 10 times', async () => {
      // Your test here
    })
  })
})
```

### 2. Follow the Murphy Template
```typescript
test('Murphy: [what goes wrong]', async () => {
  // Setup: Create the chaos scenario
  const chaosScenario = createChaos()

  // Execute: Trigger the failure
  const result = await performAction(chaosScenario)

  // Assert: System handles it gracefully
  expect(result).toHandleGracefully()
})
```

### 3. Test Expectations
Always test that the system:
1. **Doesn't crash** (500 errors are bad, 400/404 are OK)
2. **Doesn't leak data** (no stack traces, secrets in errors)
3. **Fails gracefully** (helpful error messages)
4. **Recovers** (subsequent requests work)

## Integration with CI/CD

Add to `.github/workflows/test.yml`:
```yaml
- name: Run Murphy's Law Tests
  run: npm run test:murphy

- name: Upload Murphy Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: murphy-law-failures
    path: reports/murphy-*.html
```

## Philosophy

> "Hope is not a strategy." - DevOps proverb

Instead of hoping nothing breaks, we:
1. **Assume everything will break**
2. **Test that it breaks gracefully**
3. **Measure how bad it breaks**
4. **Fix the worst failures first**

## Scoring System

Each test is scored by severity:

| Severity | Description | Example |
|----------|-------------|---------|
| 🔴 **CRITICAL** | System compromised | SQL injection succeeds |
| 🟠 **HIGH** | Data corruption | Race condition loses data |
| 🟡 **MEDIUM** | Poor UX | No loading state |
| 🟢 **LOW** | Minor issue | Typo in error message |
| ⚪ **INFO** | Suggestion | Could add logging here |

**Failure Budget:**
- Critical: **0 allowed**
- High: **< 5%**
- Medium: **< 15%**
- Low: **< 30%**

## Example: Combo Attack

Agents can discover combo attacks:

```typescript
// Security Agent finds: XSS in description field
// Frontend Agent finds: Auto-save triggers every 2s
// Combined: XSS payload auto-saved 30x/minute
// Result: CRITICAL severity (XSS + DoS)
```

## Further Reading

- [Full specification](../../MURPHYS_LAW_TEST.md)
- [Chaos Engineering Principles](https://principlesofchaos.org)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Remember:**
- If it *can* break, it *will* break
- Test that it breaks *gracefully*
- Fix the *critical* breaks first
