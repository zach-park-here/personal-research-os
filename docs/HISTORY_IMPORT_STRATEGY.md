# Chrome History Import Strategy

## Problem
- Daily browsing: 500+ URLs
- Yearly data: 182,500+ rows
- Naive approach: High storage + token costs

## Solution: Multi-tier Aggregation

### Tier 1: Import (Aggregate Immediately)
```
Chrome CSV (500 rows) → Aggregate by URL+Date → Store 50-100 rows
```

**Logic**:
```typescript
// Group by URL + Date
const aggregated = rawHistory.reduce((acc, entry) => {
  const key = `${entry.url}_${entry.date}`;
  if (!acc[key]) {
    acc[key] = {
      url: entry.url,
      domain: extractDomain(entry.url),
      date: entry.date,
      visitCount: 0,
      firstVisit: entry.time,
      lastVisit: entry.time,
      titles: []
    };
  }
  acc[key].visitCount += 1;
  acc[key].lastVisit = entry.time;
  acc[key].titles.push(entry.title);
  return acc;
}, {});
```

**Savings**: 80-90% reduction

---

### Tier 2: Domain-level Statistics (Pre-computed)
```sql
-- Materialized view (updated daily)
SELECT domain, COUNT(*) as visits, ...
FROM browsing_history_aggregated
GROUP BY domain
```

**No LLM needed** - Pure SQL aggregation

---

### Tier 3: LLM Analysis (Top N + Samples)

**Input to Agent A**:
```typescript
{
  timeRange: "last_30_days",
  topDomains: [
    { domain: "github.com", visits: 245, avgTimeOnSite: "5m" },
    { domain: "stackoverflow.com", visits: 189 },
    // ... TOP 50 only
  ],
  sampleUrls: [
    { url: "...", title: "How to...", visits: 12 },
    // ... 30 representative samples
  ],
  queryPatterns: [
    "how to", "best practices", "tutorial"
    // ... extracted keywords only
  ]
}
```

**Token Usage**: ~3,000-5,000 tokens per analysis

---

## Storage Comparison

### Naive Approach ❌
```
1 year = 182,500 rows
Row size = ~500 bytes
Total = 91 MB + indexes
```

### Smart Approach ✅
```
1 year aggregated = ~10,000-20,000 rows
Row size = ~300 bytes
Total = 6 MB + indexes
```

**Savings**: 93% reduction

---

## LLM Token Comparison

### Naive ❌
```
All 182,500 rows → LLM
= ~50-100M tokens
= $500-1000 (GPT-4)
```

### Smart ✅
```
Top 50 domains + 30 samples
= ~5,000 tokens
= $0.005 (GPT-4o-mini)
```

**Savings**: 99.99% reduction

---

## Implementation Plan

### Phase 1: Import with Aggregation
1. Parse Chrome CSV
2. Group by URL + Date
3. Insert into `browsing_history_aggregated`
4. Keep `browsing_history_raw` for 7 days only (rolling window)

### Phase 2: Pre-compute Domain Stats
1. Create materialized view
2. Refresh daily via cron
3. Use for quick lookups

### Phase 3: Smart Agent A
1. Query top 50 domains from materialized view
2. Sample 30 representative URLs
3. Extract query patterns (regex, no LLM)
4. LLM analyzes summary only

---

## Retention Policy

**browsing_history_raw** (optional, for debugging):
- Keep last 7 days
- Auto-delete older entries

**browsing_history_aggregated**:
- Keep forever (small size)
- Or archive after 1 year

**domain_stats** (materialized view):
- Refresh daily at 3 AM
- Always up-to-date

---

## Query Performance

**Before** (all raw data):
```sql
SELECT domain, COUNT(*)
FROM browsing_history_raw
GROUP BY domain;
-- Scans 182,500 rows, ~5 seconds
```

**After** (pre-aggregated):
```sql
SELECT * FROM domain_stats;
-- Instant, pre-computed
```
