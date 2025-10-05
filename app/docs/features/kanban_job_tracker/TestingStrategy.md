# Testing Strategy - Kanban Job Application Tracker

**Version:** 1.0
**Last Updated:** October 5, 2025
**Author:** Product Owner

---

## Testing Philosophy

**Pragmatic Testing for Solo Development**
- Focus on critical paths and business logic over exhaustive coverage
- Automated tests for what's easy to break, manual for what's hard to test
- Fast feedback loop: Unit tests run in <5s, integration in <30s
- Prevention over detection: Catch state bugs before they ship

**Coverage Targets**
- Unit Tests: 70%+ (business logic, state management, utilities)
- Integration Tests: Critical paths only (database, real-time sync)
- E2E Tests: Manual checklist with selective automation
- Accessibility: Baseline compliance (WCAG AA)

---

## Unit Tests (Vitest + Vue Test Utils)

### Tool Setup

```bash
# Run all unit tests
npm run test:unit

# Watch mode for development
npm run test:unit -- --watch

# Coverage report
npm run test:unit -- --coverage
```

### Critical Test Scenarios

#### 1. Pinia Store - `useKanbanStore`

```typescript
describe('useKanbanStore', () => {
  it('reorders cards within same column', () => {
    const store = useKanbanStore()
    store.columns = [
      { id: 1, cards: [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 }
      ]}
    ]

    store.moveCard('c', 1, 1, 0)

    expect(store.columns[0].cards.map(c => c.id))
      .toEqual(['c', 'a', 'b'])
  })
})
```

#### 2. Composables - `useRealtimeSync`

```typescript
describe('useRealtimeSync', () => {
  it('subscribes to database changes on mount', () => {
    const subscribeSpy = vi.spyOn(supabase, 'channel')
    const { mount } = useRealtimeSync()

    mount()

    expect(subscribeSpy).toHaveBeenCalledWith('kanban-changes')
  })
})
```

---

## Integration Tests (Supabase + RPC)

### Database - RPC Functions

```typescript
describe('move_card_between_columns RPC', () => {
  it('moves card and updates positions atomically', async () => {
    const { error } = await testSupabase.rpc('move_card_between_columns', {
      card_id: 'card-1',
      from_column: 'applied',
      to_column: 'interview',
      new_position: 0
    })

    expect(error).toBeNull()

    const { data: card } = await testSupabase
      .from('kanban_cards')
      .select('column_id, position')
      .eq('id', 'card-1')
      .single()

    expect(card.column_id).toBe('interview')
    expect(card.position).toBe(0)
  })
})
```

---

## E2E Tests (Manual Priority)

### Manual Testing Checklist

**Critical Path Tests:**

#### 1. Drag-Drop Within Column
- [ ] Drag card from position 2 to position 0
- [ ] Verify visual feedback (drag ghost, drop indicator)
- [ ] Verify final position persists after refresh

#### 2. Drag-Drop Between Columns
- [ ] Drag card from "Applied" to "Interview"
- [ ] Verify status badge updates immediately
- [ ] Verify card appears in correct column after refresh

#### 3. Multi-Tab Real-time Sync
- [ ] Open board in two browser tabs
- [ ] Move card in Tab 1
- [ ] Verify update appears in Tab 2 within 1s

#### 4. Mobile Touch Drag-Drop
- [ ] Test on iPhone Safari (iOS 16+)
- [ ] Test on Chrome Android (latest)
- [ ] Long-press to initiate drag
- [ ] Verify touch targets are 44x44px minimum

#### 5. Performance with 50+ Cards
- [ ] Seed database with 50 cards across 5 columns
- [ ] Measure initial load time (<2s)
- [ ] Measure drag latency (<100ms)
- [ ] Verify smooth scrolling (60fps)

---

## Accessibility Testing

### Automated Accessibility Tests

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('board has no violations', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page)
})
```

### Manual Accessibility Checklist

**Keyboard Navigation:**
- [ ] Tab through all cards (focus visible)
- [ ] Enter to select card
- [ ] Arrow keys to move between columns
- [ ] Space to drag-drop
- [ ] Escape to cancel drag

**Screen Reader:**
- [ ] Card title announced on focus
- [ ] Column name announced when moving
- [ ] Status change announced

**Color Contrast:**
- [ ] Status badges meet WCAG AA (4.5:1)
- [ ] Focus indicators visible (3:1 contrast)

---

## Performance Testing

### Metrics

- Drag initiation: <50ms
- Drop animation: <200ms
- Position update: <100ms
- Re-render: <16ms (60fps)

---

**Complete Testing Strategy**

For full unit test scenarios, integration test implementations, E2E test scripts, and accessibility requirements, refer to the complete Product Owner assessment in the project documentation.

---

**Last Updated:** October 5, 2025
