import { MILESTONES, MAX_G, SHORT_NAMES } from './constants.js';
import { getPool } from './utils.js';

const DEFAULT_FILTERS = {
  shipType: 'sail',
  bow: false,
  side: false,
  stern: false,
  remodel: false,
  inherit: true,
};

const DEFAULT_COST_MODEL = {
  attemptCost: 0,
  retryCost: 0,
};

const normalizeFilters = (filters = {}) => ({
  ...DEFAULT_FILTERS,
  ...filters,
});

const normalizeTargetNums = (targetNums = []) => [...new Set(targetNums)].filter(Number.isFinite);
const normalizeTargetShorts = (targetShorts = []) => targetShorts
  .filter((short) => typeof short === 'string' && short.length > 0);

const toCountMap = (items) => items.reduce((acc, item) => {
  acc[item] = (acc[item] ?? 0) + 1;
  return acc;
}, {});

const hasAllTargets = (acquired, targetNums, targetShorts) => {
  if (!targetNums.length && !targetShorts.length) return true;

  const nums = new Set(acquired.map((a) => a.option.num));
  const requiredShortCounts = toCountMap(targetShorts);
  const acquiredShortCounts = toCountMap(
    acquired
      .map((a) => SHORT_NAMES[a.option.num])
      .filter(Boolean),
  );

  const hasNums = targetNums.every((num) => nums.has(num));
  const hasShorts = Object.entries(requiredShortCounts).every(
    ([short, need]) => (acquiredShortCounts[short] ?? 0) >= need,
  );

  return hasNums && hasShorts;
};

const rollFromPool = (acquired, filters, rng) => {
  const pool = getPool(acquired, filters);
  if (!pool.length) return null;
  const index = Math.floor(rng() * pool.length);
  return { opt: pool[index], poolSize: pool.length };
};

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const average = (values) => {
  if (!values.length) return null;
  return values.reduce((acc, cur) => acc + cur, 0) / values.length;
};

const estimateSessionCost = (attemptCount, costModel = {}) => {
  const model = { ...DEFAULT_COST_MODEL, ...costModel };
  const retryCount = Math.max(0, attemptCount - 1);
  return (attemptCount * model.attemptCost) + (retryCount * model.retryCost);
};

export const createSeededRng = (seed) => {
  let t = (seed ?? Date.now()) >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let n = Math.imul(t ^ (t >>> 15), 1 | t);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
};

export const simulateSingleRun = ({
  filters = DEFAULT_FILTERS,
  targetNums = [],
  targetShorts = [],
  stopWhenTargetMet = true,
  milestones = MILESTONES,
  maxG = MAX_G,
  rng = Math.random,
} = {}) => {
  const normalizedFilters = normalizeFilters(filters);
  const normalizedTargets = normalizeTargetNums(targetNums);
  const normalizedShortTargets = normalizeTargetShorts(targetShorts);
  const acquired = [];

  let g = 0;
  let targetMatched = false;

  for (let nextG = 1; nextG <= maxG; nextG += 1) {
    g = nextG;

    if (!milestones.includes(g)) continue;

    const result = rollFromPool(acquired, normalizedFilters, rng);
    if (!result) continue;

    acquired.push({
      milestone: g,
      option: result.opt,
      poolSize: result.poolSize,
    });

    targetMatched = hasAllTargets(acquired, normalizedTargets, normalizedShortTargets);
    if (targetMatched && stopWhenTargetMet) break;
  }

  return {
    finalG: g,
    acquired,
    acquiredNums: acquired.map((a) => a.option.num),
    targetNums: normalizedTargets,
    targetShorts: normalizedShortTargets,
    targetMatched,
    success: targetMatched,
  };
};

export const simulateUntilTarget = ({
  targetNums = [],
  targetShorts = [],
  filters = DEFAULT_FILTERS,
  maxAttempts = 1000,
  includeHistory = false,
  rng = Math.random,
} = {}) => {
  const normalizedTargets = normalizeTargetNums(targetNums);
  const normalizedShortTargets = normalizeTargetShorts(targetShorts);
  const normalizedFilters = normalizeFilters(filters);
  const runs = [];

  let lastRun = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const run = simulateSingleRun({
      filters: normalizedFilters,
      targetNums: normalizedTargets,
      targetShorts: normalizedShortTargets,
      stopWhenTargetMet: true,
      rng,
    });

    if (includeHistory) runs.push(run);
    lastRun = run;

    if (run.targetMatched) {
      return {
        success: true,
        attemptCount: attempt,
        maxAttempts,
        targetNums: normalizedTargets,
        targetShorts: normalizedShortTargets,
        filters: normalizedFilters,
        run,
        lastRun: run,
        runs,
      };
    }
  }

  return {
    success: false,
    attemptCount: maxAttempts,
    maxAttempts,
    targetNums: normalizedTargets,
    targetShorts: normalizedShortTargets,
    filters: normalizedFilters,
    run: null,
    lastRun,
    runs,
  };
};

export const predictOutcome = ({
  targetNums = [],
  targetShorts = [],
  filters = DEFAULT_FILTERS,
  trials = 1000,
  maxAttempts = 1000,
  costModel = null,
  rngFactory = null,
} = {}) => {
  const attempts = [];
  const successAttempts = [];
  const costs = [];

  let successCount = 0;

  for (let i = 0; i < trials; i += 1) {
    const rng = rngFactory ? rngFactory(i) : Math.random;
    const result = simulateUntilTarget({
      targetNums,
      targetShorts,
      filters,
      maxAttempts,
      rng,
    });

    attempts.push(result.attemptCount);

    if (result.success) {
      successCount += 1;
      successAttempts.push(result.attemptCount);
    }

    if (costModel) {
      costs.push(estimateSessionCost(result.attemptCount, costModel));
    }
  }

  return {
    targetNums: normalizeTargetNums(targetNums),
    targetShorts: normalizeTargetShorts(targetShorts),
    filters: normalizeFilters(filters),
    trials,
    maxAttempts,
    successRate: trials ? successCount / trials : 0,
    successCount,
    averageAttempts: average(attempts),
    averageAttemptsOnSuccess: average(successAttempts),
    p50Attempts: percentile(attempts, 50),
    p90Attempts: percentile(attempts, 90),
    p95Attempts: percentile(attempts, 95),
    expectedCost: costModel ? average(costs) : null,
    attempts,
  };
};

export const evaluateStrategy = ({
  name = 'strategy',
  filters = DEFAULT_FILTERS,
  ...predictionOptions
} = {}) => ({
  name,
  filters: normalizeFilters(filters),
  ...predictOutcome({
    filters,
    ...predictionOptions,
  }),
});

export const findBestStrategy = ({
  strategies = [],
  metric = 'successRate',
  ...predictionOptions
} = {}) => {
  if (!strategies.length) {
    return {
      best: null,
      ranked: [],
      metric,
    };
  }

  const evaluated = strategies.map((strategy) => evaluateStrategy({
    ...predictionOptions,
    ...strategy,
  }));

  const descendingMetrics = new Set(['successRate', 'successCount']);
  const descending = descendingMetrics.has(metric);

  const ranked = [...evaluated].sort((a, b) => {
    const av = a[metric];
    const bv = b[metric];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    return descending ? (bv - av) : (av - bv);
  });

  return {
    best: ranked[0] ?? null,
    ranked,
    metric,
  };
};

export const generateFilterStrategies = () => {
  const bools = [false, true];
  const strategies = [];

  bools.forEach((bow) => {
    bools.forEach((side) => {
      bools.forEach((stern) => {
        bools.forEach((remodel) => {
          strategies.push({
            name: `bow:${Number(bow)} side:${Number(side)} stern:${Number(stern)} remodel:${Number(remodel)}`,
            filters: { bow, side, stern, remodel },
          });
        });
      });
    });
  });

  return strategies;
};
