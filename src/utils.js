import { OPTIONS, SHORT_NAMES } from './constants';

export const getPool = (acquired, filters) => {
  const used = acquired.map(a => a.option.num);

  return OPTIONS.filter(o => {
    if (used.includes(o.num)) return false;
    if (o.num === 13 && !used.includes(14)) return false;
    if (o.num === 12 && !used.includes(13)) return false;
    if (o.num === 7 && !used.includes(8)) return false;

    if (!filters.bow && o.num === 10) return false;
    if (!filters.side && o.num === 11) return false;
    if (!filters.stern && o.num === 9) return false;
    if (!filters.remodel && [5, 4, 3, 2].includes(o.num)) return false;

    return true;
  });
};

export const rollOption = (acquired, filters) => {
  const pool = getPool(acquired, filters);
  if (!pool.length) return null;
  const opt = pool[Math.floor(Math.random() * pool.length)];
  return { opt, poolSize: pool.length };
};

export const calculateCombo = (acquired) => {
  if (!acquired.length) return { combo: '', totalPct: '0' };

  const totalProb = acquired.reduce((acc, a) => acc * (1 / a.poolSize), 1);
  const totalPct = (totalProb * 100).toFixed(4);

  const comboArr = acquired.map(a => ({
    short: SHORT_NAMES[a.option.num] || '●',
    num: a.option.num,
  }));
  comboArr.sort((a, b) => {
    if (a.num === 6) return 1;
    if (b.num === 6) return -1;
    return 0;
  });

  const combo = comboArr.map(c => c.short).join('');
  return { combo, totalPct };
};

export const getChainState = (used, pool, poolSize) => {
  const states = {
    accel: {
      icon: '①',
      name: '가속강화1',
      prob: '대기중',
      status: 'waiting',
    },
    skill: {
      icon: '①',
      name: '스킬칸추가1',
      prob: '대기중',
      status: 'waiting',
    },
    inherit: {
      icon: '✦',
      name: '스킬 계승',
      prob: '대기중',
      status: 'waiting',
    },
  };

  // 가속강화
  if (used.includes(12)) {
    states.accel = {
      icon: '③',
      name: '가속강화3',
      prob: '✓ 획득',
      status: 'done',
    };
  } else if (used.includes(13)) {
    states.accel = {
      icon: '③',
      name: '가속강화3',
      prob: pool.find(o => o.num === 12)
        ? (1 / poolSize * 100).toFixed(1) + '%'
        : '대기중',
      status: pool.find(o => o.num === 12) ? 'next' : 'waiting',
    };
  } else if (used.includes(14)) {
    states.accel = {
      icon: '②',
      name: '가속강화2',
      prob: pool.find(o => o.num === 13)
        ? (1 / poolSize * 100).toFixed(1) + '%'
        : '대기중',
      status: pool.find(o => o.num === 13) ? 'next' : 'waiting',
    };
  } else {
    states.accel = {
      icon: '①',
      name: '가속강화1',
      prob: pool.find(o => o.num === 14)
        ? (1 / poolSize * 100).toFixed(1) + '%'
        : '대기중',
      status: pool.find(o => o.num === 14) ? 'next' : 'waiting',
    };
  }

  // 스킬칸추가
  if (used.includes(7)) {
    states.skill = {
      icon: '②',
      name: '스킬칸추가2',
      prob: '✓ 획득',
      status: 'done',
    };
  } else if (used.includes(8)) {
    states.skill = {
      icon: '②',
      name: '스킬칸추가2',
      prob: pool.find(o => o.num === 7)
        ? (1 / poolSize * 100).toFixed(1) + '%'
        : '대기중',
      status: pool.find(o => o.num === 7) ? 'next' : 'waiting',
    };
  } else {
    states.skill = {
      icon: '①',
      name: '스킬칸추가1',
      prob: pool.find(o => o.num === 8)
        ? (1 / poolSize * 100).toFixed(1) + '%'
        : '대기중',
      status: pool.find(o => o.num === 8) ? 'next' : 'waiting',
    };
  }

  // 스킬 계승
  if (used.includes(6)) {
    states.inherit = {
      icon: '✦',
      name: '스킬 계승',
      prob: '✓ 획득',
      status: 'done',
    };
  } else if (pool.find(o => o.num === 6)) {
    states.inherit = {
      icon: '✦',
      name: '스킬 계승',
      prob: (1 / poolSize * 100).toFixed(1) + '%',
      status: 'next',
    };
  }

  return states;
};
