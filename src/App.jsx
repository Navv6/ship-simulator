import React, { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import Main from './components/Main';
import EngineSidebar from './components/EngineSidebar';
import { MILESTONES, OPTIONS, SHORT_NAMES } from './constants';
import { rollOption, getPool } from './utils';
import {
  predictOutcome,
  simulateSingleRun,
} from './simulatorEngine.js';

const TARGET_SHORT_ORDER = ['포', '장', '백', '탐', '가', '스', '승'];
const TARGET_SLOTS = 3;
const REMODEL_SHORTS = new Set(['포', '장', '백', '탐']);
const MAX_ATTEMPTS_LIMIT = 100;
const CURRENT_BUILD_MAX_G = 6;
const ENGINE_PANEL_NAME = '더보기';

const buildShortLimits = () => OPTIONS.reduce((acc, opt) => {
  const short = SHORT_NAMES[opt.num];
  if (!short) return acc;
  acc[short] = (acc[short] ?? 0) + 1;
  return acc;
}, {});

const SHORT_LIMITS = buildShortLimits();
const OPTION_BY_NUM = OPTIONS.reduce((acc, opt) => {
  acc[opt.num] = opt;
  return acc;
}, {});
const CURRENT_BUILD_OPTION_CHOICES = OPTIONS
  .filter((opt) => Boolean(SHORT_NAMES[opt.num]))
  .map((opt) => ({
    num: opt.num,
    name: opt.name,
  }));

const generateComboPresets = (slots = TARGET_SLOTS) => {
  const result = [];
  const picks = [];
  const counts = {};

  const dfs = (startIndex) => {
    if (picks.length === slots) {
      result.push(picks.join(''));
      return;
    }

    for (let i = startIndex; i < TARGET_SHORT_ORDER.length; i += 1) {
      const short = TARGET_SHORT_ORDER[i];
      const limit = SHORT_LIMITS[short] ?? 0;
      if (!limit) continue;
      if ((counts[short] ?? 0) >= limit) continue;
      if (REMODEL_SHORTS.has(short)) {
        const remodelCount = picks.filter((s) => REMODEL_SHORTS.has(s)).length;
        if (remodelCount >= 1) continue;
      }

      counts[short] = (counts[short] ?? 0) + 1;
      picks.push(short);
      dfs(i);
      picks.pop();
      counts[short] -= 1;
    }
  };

  dfs(0);
  return result;
};

const COMBO_PRESETS = generateComboPresets(TARGET_SLOTS);
const comboToTargetShorts = (combo = '') => combo.match(/[가스승포장백탐]/g) || [];

const clampInt = (value, fallback, min, max) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const clampNumber = (value, fallback, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export default function App() {
  const [g, setG] = useState(0);
  const [acquired, setAcquired] = useState([]);
  const [carrierCount, setCarrierCount] = useState(0);
  const [filters, setFilters] = useState({
    shipType: 'sail',
    bow: false,
    side: false,
    stern: false,
    remodel: false,
    inherit: true,
  });
  const [currentCard, setCurrentCard] = useState(null);
  const [engineOpen, setEngineOpen] = useState(false);
  const [engineTab, setEngineTab] = useState('auto');
  const [targetCombo, setTargetCombo] = useState('');

  const [autoMaxAttemptsInput, setAutoMaxAttemptsInput] = useState(String(MAX_ATTEMPTS_LIMIT));
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [autoResult, setAutoResult] = useState(null);

  const [predictTrialsInput, setPredictTrialsInput] = useState('3000');
  const [predictMaxAttemptsInput, setPredictMaxAttemptsInput] = useState(String(MAX_ATTEMPTS_LIMIT));
  const [carrierCostInput, setCarrierCostInput] = useState('5');
  const [predictRunning, setPredictRunning] = useState(false);
  const [predictResult, setPredictResult] = useState(null);
  const [currentBuildOption1Input, setCurrentBuildOption1Input] = useState('');
  const [currentBuildOption2Input, setCurrentBuildOption2Input] = useState('');
  const [currentBuildProgressG, setCurrentBuildProgressG] = useState(0);
  const [currentBuildRolledAcquired, setCurrentBuildRolledAcquired] = useState([]);
  const [currentBuildCard, setCurrentBuildCard] = useState(null);

  const autoStopRef = useRef(false);

  const enhance = useCallback(() => {
    const nextMilestone = MILESTONES.find((m) => m > g && m <= CURRENT_BUILD_MAX_G) ?? null;
    if (!nextMilestone) {
      setCurrentCard({ message: '🎉 6G 강화 완료!' });
      return;
    }

    setG(nextMilestone);

    const result = rollOption(acquired, filters);
    if (result) {
      setAcquired([...acquired, { milestone: nextMilestone, option: result.opt, poolSize: result.poolSize }]);
      setCurrentCard({ opt: result.opt, g: nextMilestone, poolSize: result.poolSize });
    } else {
      setCurrentCard({ error: '획득 가능한 옵션이 없습니다' });
    }
  }, [g, acquired, filters]);

  const useCarrier = useCallback(() => {
    setCarrierCount(carrierCount + 1);
    setG(0);
    setAcquired([]);
    setCurrentCard({ message: '함재기 사용 — 0G부터 다시 시작합니다' });
  }, [carrierCount]);

  const resetAll = useCallback(() => {
    if (!window.confirm('모든 데이터를 초기화하시겠습니까?')) return;
    setG(0);
    setAcquired([]);
    setCarrierCount(0);
    setCurrentCard({ message: '전체 초기화 완료' });
  }, []);

  const toggleFilter = useCallback((type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const setShipType = useCallback((shipType) => {
    setFilters((prev) => ({ ...prev, shipType }));
  }, []);

  useEffect(() => {
    const hasInherit = acquired.some((item) => item.option.num === 6);
    if (hasInherit && filters.inherit) {
      setFilters((prev) => ({ ...prev, inherit: false }));
    }
  }, [acquired, filters.inherit]);

  const pool = getPool(acquired, filters);
  const poolSize = pool.length;
  const canEnhanceNormal = Boolean(MILESTONES.find((m) => m > g && m <= CURRENT_BUILD_MAX_G));
  const targetShorts = comboToTargetShorts(targetCombo);
  const currentBuildOption1Num = currentBuildOption1Input
    ? clampInt(currentBuildOption1Input, 0, 1, 23)
    : null;
  const currentBuildOption2Num = currentBuildOption2Input
    ? clampInt(currentBuildOption2Input, 0, 1, 23)
    : null;

  const currentBuildBaseAcquired = [];
  if (currentBuildOption1Num && OPTION_BY_NUM[currentBuildOption1Num]) {
    currentBuildBaseAcquired.push({
      milestone: 1,
      option: OPTION_BY_NUM[currentBuildOption1Num],
      poolSize: 1,
    });
  }
  if (currentBuildOption2Num && OPTION_BY_NUM[currentBuildOption2Num]) {
    currentBuildBaseAcquired.push({
      milestone: 3,
      option: OPTION_BY_NUM[currentBuildOption2Num],
      poolSize: 1,
    });
  }

  const currentBuildStartG = currentBuildBaseAcquired.some((item) => item.milestone === 3)
    ? 3
    : currentBuildBaseAcquired.some((item) => item.milestone === 1)
      ? 1
      : 0;

  const currentBuildAcquired = [...currentBuildBaseAcquired, ...currentBuildRolledAcquired]
    .sort((a, b) => a.milestone - b.milestone);
  const currentBuildSyncedAcquired = currentBuildAcquired;
  const currentBuildOption2Choices = CURRENT_BUILD_OPTION_CHOICES
    .filter((opt) => !currentBuildOption1Num || opt.num !== currentBuildOption1Num);

  useEffect(() => {
    if (!currentBuildOption1Num && currentBuildOption2Input !== '') {
      setCurrentBuildOption2Input('');
      return;
    }
    if (currentBuildOption1Num && currentBuildOption2Num === currentBuildOption1Num) {
      setCurrentBuildOption2Input('');
    }
  }, [currentBuildOption1Num, currentBuildOption2Num, currentBuildOption2Input]);

  useEffect(() => {
    setCurrentBuildProgressG(currentBuildStartG);
    setCurrentBuildRolledAcquired([]);
    setCurrentBuildCard(null);
  }, [currentBuildStartG, currentBuildOption1Input, currentBuildOption2Input, filters]);

  const selectTargetCombo = useCallback((combo) => {
    setTargetCombo((prev) => (prev === combo ? '' : combo));
  }, []);

  const clearTargetCombo = useCallback(() => {
    setTargetCombo('');
  }, []);

  const handleMaxAttemptsInputChange = useCallback((setter) => (value) => {
    if (value === '') {
      setter('');
      return;
    }
    const clamped = clampInt(value, MAX_ATTEMPTS_LIMIT, 1, MAX_ATTEMPTS_LIMIT);
    setter(String(clamped));
  }, []);

  const runAuto = useCallback(() => {
    if (!targetShorts.length) {
      setAutoResult({
        status: 'failed',
        title: '목표 조합을 선택하세요',
        message: '자동 실행 전 조합 프리셋을 먼저 선택해야 합니다.',
      });
      return;
    }

    const maxAttempts = clampInt(autoMaxAttemptsInput, MAX_ATTEMPTS_LIMIT, 1, MAX_ATTEMPTS_LIMIT);
    autoStopRef.current = false;
    setAutoRunning(true);
    setAutoProgress(0);
    setAutoResult(null);

    let attempt = 0;
    const batchSize = 100;

    const runBatch = () => {
      if (autoStopRef.current) {
        setAutoRunning(false);
        setAutoResult({
          status: 'stopped',
          title: '실행 중지',
          message: `${attempt.toLocaleString()}회까지 진행 후 중지했습니다.`,
        });
        return;
      }

      for (let i = 0; i < batchSize && attempt < maxAttempts; i += 1) {
        attempt += 1;
        const run = simulateSingleRun({
          filters,
          targetShorts,
          stopWhenTargetMet: true,
        });

        if (run.success) {
          const acquiredNames = run.acquired.map((item) => item.option.name).join(', ');
          setAutoRunning(false);
          setAutoProgress(1);
          setAutoResult({
            status: 'success',
            title: '목표 옵션 획득 성공',
            message: `${attempt.toLocaleString()}회 만에 성공했습니다. (${acquiredNames})`,
          });
          return;
        }
      }

      setAutoProgress(attempt / maxAttempts);

      if (attempt >= maxAttempts) {
        setAutoRunning(false);
        setAutoResult({
          status: 'failed',
          title: '시도 횟수 도달',
          message: `${maxAttempts.toLocaleString()}회 안에 목표를 달성하지 못했습니다.`,
        });
        return;
      }

      setTimeout(runBatch, 0);
    };

    setTimeout(runBatch, 0);
  }, [targetShorts, autoMaxAttemptsInput, filters]);

  const stopAuto = useCallback(() => {
    autoStopRef.current = true;
  }, []);

  const runPredict = useCallback(() => {
    if (!targetShorts.length) {
      setPredictResult({ error: '확률 예측 전에 목표 조합을 선택하세요.' });
      return;
    }

    const trials = clampInt(predictTrialsInput, 3000, 50, 200000);
    const maxAttempts = clampInt(predictMaxAttemptsInput, MAX_ATTEMPTS_LIMIT, 1, MAX_ATTEMPTS_LIMIT);
    const carrierCost = clampNumber(carrierCostInput, 0, 0, 1_000_000_000);

    setPredictRunning(true);
    setPredictResult(null);

    setTimeout(() => {
      const result = predictOutcome({
        targetShorts,
        filters,
        trials,
        maxAttempts,
        costModel: {
          attemptCost: 0,
          retryCost: carrierCost,
        },
      });
      setPredictResult(result);
      setPredictRunning(false);
    }, 0);
  }, [
    targetShorts,
    filters,
    predictTrialsInput,
    predictMaxAttemptsInput,
    carrierCostInput,
  ]);

  const runCurrentBuildEnhance = useCallback(() => {
    if (currentBuildProgressG >= CURRENT_BUILD_MAX_G) return;

    const nextMilestone = MILESTONES.find((m) => m > currentBuildProgressG && m <= CURRENT_BUILD_MAX_G) ?? null;
    if (!nextMilestone) {
      setCurrentBuildCard({ message: '🎉 6G 강화 완료!' });
      return;
    }

    setCurrentBuildProgressG(nextMilestone);

    const fixedAtMilestone = currentBuildBaseAcquired.find((item) => item.milestone === nextMilestone);
    if (fixedAtMilestone) {
      setCurrentBuildCard({
        opt: fixedAtMilestone.option,
        g: nextMilestone,
        poolSize: 1,
      });
      return;
    }

    const result = rollOption(currentBuildAcquired, filters);
    if (result) {
      const gained = { milestone: nextMilestone, option: result.opt, poolSize: result.poolSize };
      setCurrentBuildRolledAcquired((prev) => [...prev, gained]);
      setCurrentBuildCard({ opt: result.opt, g: nextMilestone, poolSize: result.poolSize });
    } else {
      setCurrentBuildCard({ error: '획득 가능한 옵션이 없습니다' });
    }
  }, [currentBuildProgressG, currentBuildBaseAcquired, currentBuildAcquired, filters]);

  const useCurrentBuildCarrier = useCallback(() => {
    setCurrentBuildProgressG(0);
    setCurrentBuildOption1Input('');
    setCurrentBuildOption2Input('');
    setCurrentBuildRolledAcquired([]);
    setCurrentBuildCard({ message: '함재기 사용 — 0G부터 다시 시작합니다' });
  }, []);

  return (
    <div className="app">
      <Header />
      <div className="page-body">
        <SidePanel
          acquired={acquired}
          filters={filters}
          carrierCount={carrierCount}
          toggleFilter={toggleFilter}
          onShipTypeChange={setShipType}
          resetAll={resetAll}
          pool={pool}
          poolSize={poolSize}
        />
        <Main
          g={g}
          enhance={enhance}
          useCarrier={useCarrier}
          currentCard={currentCard}
          isMaxG={!canEnhanceNormal}
          acquired={acquired}
          currentBuildState={{
            currentGrade: currentBuildProgressG,
            option1Input: currentBuildOption1Input,
            option2Input: currentBuildOption2Input,
            option1Choices: CURRENT_BUILD_OPTION_CHOICES,
            option2Choices: currentBuildOption2Choices,
            syncedAcquired: currentBuildSyncedAcquired,
            card: currentBuildCard,
            onOption1Change: setCurrentBuildOption1Input,
            onOption2Change: setCurrentBuildOption2Input,
            onRun: runCurrentBuildEnhance,
            onUseCarrier: useCurrentBuildCarrier,
            canEnhance: Boolean(MILESTONES.find((m) => m > currentBuildProgressG && m <= CURRENT_BUILD_MAX_G)),
          }}
        />
        <EngineSidebar
          isOpen={engineOpen}
          onClose={() => setEngineOpen(false)}
          tab={engineTab}
          onTabChange={setEngineTab}
          comboPresets={COMBO_PRESETS}
          targetCombo={targetCombo}
          onSelectCombo={selectTargetCombo}
          onClearCombo={clearTargetCombo}
          autoState={{
            maxAttemptsInput: autoMaxAttemptsInput,
            maxAttemptsLimit: MAX_ATTEMPTS_LIMIT,
            onMaxAttemptsInputChange: handleMaxAttemptsInputChange(setAutoMaxAttemptsInput),
            running: autoRunning,
            progress: autoProgress,
            result: autoResult,
            onRun: runAuto,
            onStop: stopAuto,
          }}
          predictState={{
            trialsInput: predictTrialsInput,
            maxAttemptsInput: predictMaxAttemptsInput,
            maxAttemptsLimit: MAX_ATTEMPTS_LIMIT,
            carrierCostInput,
            running: predictRunning,
            result: predictResult,
            onTrialsInputChange: setPredictTrialsInput,
            onMaxAttemptsInputChange: handleMaxAttemptsInputChange(setPredictMaxAttemptsInput),
            onCarrierCostInputChange: setCarrierCostInput,
            onRun: runPredict,
          }}
        />
      </div>
      <button
        className={`engine-toggle ${engineOpen ? 'open' : ''}`}
        type="button"
        onClick={() => setEngineOpen((prev) => !prev)}
        aria-label={engineOpen ? '엔진 닫기' : '엔진 열기'}
      >
        {engineOpen ? 'X' : ENGINE_PANEL_NAME}
      </button>
      <footer className="app-footer">
        <div className="app-footer-line">MADE BY 바위게조선소.아루루냥</div>
        <div className="app-footer-line">
          <span>의뢰문의</span>
          <a href="https://open.kakao.com/o/giCOdLgi" target="_blank" rel="noreferrer noopener">
            https://open.kakao.com/o/giCOdLgi
          </a>
        </div>
      </footer>
    </div>
  );
}
