# Murphy's Law Test Framework
**"Anything that can go wrong, will go wrong"**

**Version:** 1.0
**Project:** PRTS Accounting Sync
**Created:** 2026-02-01

---

## 🎯 Concept

An agent swarm testing framework where each expert persona actively tries to break the code from their domain expertise. Instead of *hoping* nothing goes wrong, we *assume* everything will go wrong and test for it.

### Traditional Testing vs Murphy's Law Testing

| Traditional Testing | Murphy's Law Testing |
|---------------------|---------------------|
| "Does this work?" | "How can this break?" |
| Tests expected paths | Tests unexpected chaos |
| One test runner | Swarm of adversarial agents |
| Pass/fail binary | Severity-scored failures |
| Developer writes tests | AI agents generate attack vectors |

---

## 🤖 Expert Persona Test Agents

Each persona from CLAUDE_CODE_REFERENCE.md becomes an adversarial testing agent:

### 🔒 Security Agent (Dr. Sarah Chen)
**Mission:** "Try to hack this"

**Attack Vectors:**
- SQL/NoSQL injection attempts
- XSS payloads in all text inputs
- CSRF token manipulation
- Auth header manipulation
- Session hijacking attempts
- Path traversal in file operations
- Environment variable injection
- Credential extraction attempts

**Example Tests:**
```typescript
// Test: Can I bypass auth by manipulating headers?
await fetch('/api/admin/mappings', {
  headers: {
    'x-ms-client-principal-id': 'fake-id',
    'x-ms-client-principal': btoa(JSON.stringify({
      claims: [{ typ: 'groups', val: 'admin-group-id' }]
    }))
  }
})
// Expected: Should fail - Azure AD headers only trusted from Azure

// Test: Can I inject malicious data?
await createMapping({
  sourceIdentifier: "'; DROP TABLE mappings; --",
  financialEdgeAccount: "<script>alert('xss')</script>"
})
// Expected: Should sanitize or reject
```

### 🚀 DevOps Agent (Alex Petrov)
**Mission:** "What if everything fails?"

**Chaos Scenarios:**
- MongoDB connection drops mid-query
- Network timeout after 30 seconds
- Disk full during file write
- Out of memory during large operation
- CPU spike to 100%
- Container restart mid-request
- Environment variables suddenly missing
- Payload CMS initialization fails

**Example Tests:**
```typescript
// Test: Database disappears mid-query
await simulateMongoDisconnect({
  during: 'payload.find',
  afterMs: 500
})
// Expected: Error handled gracefully, user sees error message

// Test: Environment variable missing
delete process.env.MONGODB_URI
await startServer()
// Expected: Server refuses to start with clear error message

// Test: Payload init fails
mockPayloadToThrow(new Error('Connection timeout'))
await getDashboardData()
// Expected: Returns error, doesn't crash server
```

### 💻 Frontend Agent (Chris Nakamura)
**Mission:** "What if the user does something weird?"

**Edge Cases:**
- Spamming buttons (double-click, triple-click)
- Navigating away during async operation
- Browser back button during form submit
- Offline mode / network disconnect
- Extremely slow connection (3G)
- Disabled JavaScript
- Ad blockers interfering
- Browser auto-fill corrupting forms

**Example Tests:**
```typescript
// Test: User clicks submit 10 times rapidly
for (let i = 0; i < 10; i++) {
  clickSubmitButton()
  await sleep(10) // 10ms between clicks
}
// Expected: Only one request sent, button disabled during submit

// Test: Navigate away during sync
startSync()
await sleep(100)
navigateTo('/admin/mappings')
// Expected: Sync cancelled or continues in background gracefully

// Test: Offline during form submit
setNetworkState('offline')
await submitMappingForm()
// Expected: User sees offline error, data preserved in form
```

### ♿ Accessibility Agent (Sam Chen)
**Mission:** "What if the user can't see/use a mouse?"

**Accessibility Chaos:**
- Screen reader navigation
- Keyboard-only navigation
- Tab order stress test
- Focus trap scenarios
- ARIA label missing/incorrect
- Color contrast insufficient
- Text too small / too large
- High contrast mode

**Example Tests:**
```typescript
// Test: Can user complete workflow with keyboard only?
await navigateWithKeyboard([
  'Tab', 'Tab', 'Enter', // Navigate to "Add Mapping"
  'Tab', // Focus on source field
  'Type:populi',
  'Tab', // Next field
  // ... complete form ...
  'Enter' // Submit
])
// Expected: All interactive elements reachable, form submittable

// Test: Screen reader announces all state changes
await startSync()
// Expected: ARIA live region announces "Syncing..."
await waitForSyncComplete()
// Expected: ARIA live region announces "Sync complete"
```

### 🧪 QA Agent (Casey Morgan)
**Mission:** "Every edge case, every boundary"

**Boundary Testing:**
- Empty strings everywhere
- Null/undefined everywhere
- Max integer values
- Unicode/emoji in all fields
- Arrays with 0, 1, 1000, 10000 items
- Dates: year 1900, 9999, leap years, DST
- Time zones: UTC, UTC+14, UTC-12
- Concurrent operations

**Example Tests:**
```typescript
// Test: What if there are zero mappings?
await deleteAllMappings()
await visitDashboard()
// Expected: Shows empty state, doesn't crash

// Test: What if there are 10,000 mappings?
await createMappings(10000)
await visitDashboard()
// Expected: Pagination or virtual scrolling, doesn't freeze

// Test: Emoji in account names
await createMapping({
  sourceIdentifier: '💰',
  sourceDescription: '🏦 Bank Account 💵',
  financialEdgeAccount: '10-1000-000'
})
// Expected: Saves and displays correctly

// Test: Concurrent edits
const promises = []
for (let i = 0; i < 5; i++) {
  promises.push(updateMapping(sameId, { sourceIdentifier: `value${i}` }))
}
await Promise.all(promises)
// Expected: Last write wins or conflict detection
```

---

## 📊 Test Execution Framework

### Phase 1: Agent Initialization
```typescript
const agents = [
  new SecurityAgent(codebase),
  new DevOpsAgent(codebase),
  new FrontendAgent(codebase),
  new AccessibilityAgent(codebase),
  new QAAgent(codebase),
]

const testPlan = await Promise.all(
  agents.map(agent => agent.generateAttackVectors())
)
```

### Phase 2: Parallel Attack Execution
```typescript
const results = await runChaosSwarm({
  agents,
  target: 'http://localhost:3000',
  duration: '5m',
  concurrency: 'all', // All agents attack simultaneously
  reportInterval: '30s'
})
```

### Phase 3: Severity Scoring
```typescript
interface TestResult {
  agent: string
  attack: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  passed: boolean
  evidence?: string
  recommendation?: string
}

// Critical: Security breach, data loss, server crash
// High: User data corruption, auth bypass, unhandled error
// Medium: Poor UX, accessibility violation, performance degradation
// Low: Minor UI glitch, console warning
// Info: Best practice suggestion
```

### Phase 4: Report Generation
```markdown
# Murphy's Law Test Report
**Duration:** 5 minutes
**Attacks Executed:** 247
**Passed:** 189 (76.5%)
**Failed:** 58 (23.5%)

## Critical Failures (2)
🔴 **Security Agent**: SQL injection in mapping form
- Attack: `sourceIdentifier: "'; DROP TABLE;--"`
- Result: Database error exposed to client
- Fix: Add input validation and sanitization

🔴 **DevOps Agent**: Server crash on MongoDB disconnect
- Attack: Simulate network partition during sync
- Result: Unhandled promise rejection crashes Node process
- Fix: Add error boundary and graceful degradation

## High Severity (8)
⚠️ **Frontend Agent**: Form data loss on navigation
⚠️ **Accessibility Agent**: Keyboard trap in modal
...
```

---

## 🛠️ Implementation Options

### Option 1: Lightweight (Quick Start)
**Tools:** Jest + Playwright + Custom scripts
```bash
npm install --save-dev @playwright/test
npm install --save-dev jest-chaos-monkey
```

**Pros:**
- Use existing test infrastructure
- Can start testing today
- No new dependencies for production

**Cons:**
- Manual test writing for each agent
- Limited AI-powered test generation

### Option 2: AI-Powered (Future State)
**Tools:** Claude Code Agent SDK + Custom swarm orchestrator
```typescript
import { Agent } from '@anthropic/agent-sdk'

const securityAgent = new Agent({
  persona: 'security-expert',
  objective: 'find vulnerabilities',
  tools: ['code-analysis', 'penetration-test', 'fuzzing']
})

const attacks = await securityAgent.generateAttacks(codebase)
```

**Pros:**
- Agents generate novel attack vectors
- Learns from previous test runs
- Adapts to code changes

**Cons:**
- Requires Claude API access
- More complex to set up
- Higher execution cost

### Option 3: Hybrid (Recommended)
**Approach:** Start with Option 1, evolve to Option 2

1. **Week 1:** Manual persona-based tests in Jest
2. **Week 2:** Add Playwright for UI chaos testing
3. **Week 3:** Integrate chaos engineering library
4. **Month 2:** Add AI agent for test generation

---

## 📝 Sample Implementation

### Basic Murphy's Law Test Suite

```typescript
// tests/murphy/security.test.ts
describe('Security Agent - SQL Injection', () => {
  const injectionPayloads = [
    "'; DROP TABLE mappings; --",
    "1' OR '1'='1",
    "admin'--",
    "'; DELETE FROM users WHERE '1'='1'--",
  ]

  test.each(injectionPayloads)(
    'should reject SQL injection: %s',
    async (payload) => {
      const response = await createMapping({
        sourceIdentifier: payload,
        sourceDescription: 'Test',
        financialEdgeAccount: '10-1000-000'
      })

      expect(response.status).not.toBe(200)
      expect(response.error).toContain('invalid')
      expect(response.error).not.toContain('SQL') // Don't leak db type
    }
  )
})

// tests/murphy/devops.test.ts
describe('DevOps Agent - Database Failures', () => {
  test('should handle MongoDB disconnect gracefully', async () => {
    // Simulate MongoDB going away
    await simulateMongoDisconnect()

    const response = await fetch('/api/mappings')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      message: 'Service temporarily unavailable',
      retryAfter: expect.any(Number)
    })
  })

  test('should not crash server on Payload init failure', async () => {
    const serverProcess = await startServer({
      env: { MONGODB_URI: 'mongodb://invalid:27017' }
    })

    // Server should start but report unhealthy
    expect(serverProcess.exitCode).toBeNull() // Still running

    const health = await fetch('http://localhost:3000/api/health')
    expect(health.status).toBe(500)
    expect(await health.json()).toMatchObject({
      status: 'unhealthy',
      mongodb: 'not configured'
    })
  })
})

// tests/murphy/frontend.test.ts
describe('Frontend Agent - User Chaos', () => {
  test('should prevent double-submit', async () => {
    const page = await browser.newPage()
    await page.goto('/admin/mappings')

    // Click submit 5 times rapidly
    await Promise.all([
      page.click('[data-testid="submit"]'),
      page.click('[data-testid="submit"]'),
      page.click('[data-testid="submit"]'),
      page.click('[data-testid="submit"]'),
      page.click('[data-testid="submit"]'),
    ])

    // Should only create ONE mapping
    const mappings = await getMappings()
    expect(mappings.length).toBe(1)
  })

  test('should preserve form data on network error', async () => {
    await page.type('[name="sourceIdentifier"]', '20227')
    await page.type('[name="sourceDescription"]', 'Test Account')

    // Simulate network failure
    await page.setOfflineMode(true)
    await page.click('[type="submit"]')

    // Form data should still be there
    expect(await page.inputValue('[name="sourceIdentifier"]')).toBe('20227')
    expect(await page.textContent('.error')).toContain('offline')
  })
})
```

---

## 🎯 Integration with Project

### Add to package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:murphy": "jest --config jest.murphy.config.js",
    "test:murphy:watch": "jest --config jest.murphy.config.js --watch",
    "test:chaos": "npm run test:murphy -- --chaos-mode",
    "test:swarm": "node scripts/murphys-law-swarm.js"
  }
}
```

### Add to CI/CD Pipeline
```yaml
# .github/workflows/murphy-test.yml
name: Murphy's Law Tests

on: [pull_request]

jobs:
  chaos-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:murphy
      - name: Upload Murphy Report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: murphy-law-report
          path: reports/murphy-*.html
```

### Add to Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running Murphy's Law quick tests..."
npm run test:murphy -- --quick

if [ $? -ne 0 ]; then
  echo "❌ Murphy's Law tests failed!"
  echo "Run 'npm run test:murphy' to see details"
  exit 1
fi
```

---

## 📈 Success Metrics

### Coverage Goals
- **Security:** 100% of user inputs tested with injection payloads
- **DevOps:** All external dependencies have failure scenarios tested
- **Frontend:** All user interactions tested with chaos (double-click, offline, etc.)
- **Accessibility:** All interactive elements keyboard-navigable
- **QA:** All boundary conditions tested (0, 1, max, null, undefined)

### Failure Budget
- **Critical:** 0 failures allowed (security breaches, crashes)
- **High:** < 5% failure rate (data corruption, auth issues)
- **Medium:** < 15% failure rate (UX problems, accessibility)
- **Low:** < 30% failure rate (minor glitches)

### Trend Tracking
```
Week 1: 156 attacks → 42 failures (27%)
Week 2: 203 attacks → 28 failures (14%)  ✅ Improving
Week 3: 247 attacks → 19 failures (8%)   ✅ Getting better
Week 4: 289 attacks → 12 failures (4%)   ✅ Production ready
```

---

## 🚀 Roadmap

### Phase 1: Foundation (Week 1)
- [x] Create Murphy's Law test spec
- [ ] Set up basic test framework (Jest)
- [ ] Implement Security Agent tests (10 attacks)
- [ ] Implement DevOps Agent tests (5 chaos scenarios)
- [ ] Run first swarm test

### Phase 2: Expansion (Week 2-3)
- [ ] Add Frontend Agent tests (Playwright)
- [ ] Add Accessibility Agent tests
- [ ] Add QA Agent boundary tests
- [ ] Create HTML report generator
- [ ] Integrate with CI/CD

### Phase 3: Automation (Month 2)
- [ ] AI-powered attack generation
- [ ] Mutation testing integration
- [ ] Chaos monkey for staging environment
- [ ] Continuous chaos testing

### Phase 4: Advanced (Future)
- [ ] Agent swarm coordination
- [ ] Adaptive attack difficulty
- [ ] Regression attack detection
- [ ] Attack vector marketplace (share with community)

---

## 💡 Innovation: What Makes This Unique?

### Existing Tools:
- **Chaos Monkey** (Netflix): Random infrastructure failures
- **Fuzzing** (AFL, libFuzzer): Random input generation
- **Property Testing** (QuickCheck): Random test cases
- **Mutation Testing** (Stryker): Random code changes

### Murphy's Law Test (Ours):
- **Persona-based**: Each agent has domain expertise
- **Adversarial**: Agents actively try to break things
- **Comprehensive**: Tests code, infrastructure, UX, accessibility, security
- **Intelligent**: AI-powered attack generation (future)
- **Collaborative**: Agents share findings to generate combo attacks

**Example Combo Attack:**
```
Security Agent: "I found XSS in sourceIdentifier field"
Frontend Agent: "I can trigger auto-save on that field"
QA Agent: "Auto-save happens every 2 seconds"
→ Combined Attack: XSS payload auto-saved 30 times/minute
→ Severity: CRITICAL (XSS + DoS)
```

---

## 📚 References & Prior Art

- **Chaos Engineering:** "The Principles of Chaos Engineering" - Netflix
- **Property-Based Testing:** QuickCheck (Haskell), fast-check (JS)
- **Mutation Testing:** Stryker Mutator
- **Fuzzing:** AFL, libFuzzer, Jazzer
- **Adversarial Testing:** OWASP ZAP, Burp Suite
- **Agent Swarms:** Multi-agent reinforcement learning (MARL)

**Novel Contribution:** Combining persona-based adversarial testing with agent swarm coordination for comprehensive "what can go wrong" coverage.

---

## 🎓 Learning Resources

For the team to understand Murphy's Law Testing:

1. **Chaos Engineering:**
   - Read: "Chaos Engineering" by Casey Rosenthal
   - Watch: "Breaking Things on Purpose" (Netflix Engineering)

2. **Property-Based Testing:**
   - Tutorial: "Introduction to Property-Based Testing" (freeCodeCamp)
   - Tool: fast-check documentation

3. **Security Testing:**
   - Course: OWASP Top 10 vulnerabilities
   - Tool: OWASP ZAP tutorial

4. **Agent-Based Systems:**
   - Paper: "Multi-Agent Systems for Software Testing"
   - Tool: Claude Agent SDK docs

---

**Status:** Specification complete, ready for implementation
**Next Step:** Implement Phase 1 (Foundation) with basic persona tests
**Estimated Effort:** 2-3 days for initial framework, ongoing refinement

---

*"In preparing for battle I have always found that plans are useless, but planning is indispensable." - Eisenhower*

*"Murphy's Law Test: The planning that makes the plan useless."*
