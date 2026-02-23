import React, { useState, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import SidePanel from './components/SidePanel';
import Main from './components/Main';
import AcquiredOptions from './components/AcquiredOptions';
import { MILESTONES, MAX_G } from './constants';
import { rollOption, getPool } from './utils';

export default function App() {
  const [g, setG] = useState(0);
  const [acquired, setAcquired] = useState([]);
  const [carrierCount, setCarrierCount] = useState(0);
  const [filters, setFilters] = useState({
    bow: false,
    side: false,
    stern: false,
    remodel: false,
  });
  const [currentCard, setCurrentCard] = useState(null);

  const enhance = useCallback(() => {
    if (g >= MAX_G) return;

    const newG = g + 1;
    setG(newG);

    if (MILESTONES.includes(newG)) {
      const result = rollOption(acquired, filters);
      if (result) {
        setAcquired([...acquired, { milestone: newG, option: result.opt, poolSize: result.poolSize }]);
        setCurrentCard({ opt: result.opt, g: newG, poolSize: result.poolSize });
      } else {
        setCurrentCard({ error: '획득 가능한 옵션이 없습니다' });
      }
    } else {
      if (newG >= MAX_G) {
        setCurrentCard({ message: '🎉 8G 강화 완료!' });
      } else {
        setCurrentCard({ message: '강화 버튼을 눌러 계속하세요' });
      }
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

  const pool = getPool(acquired, filters);
  const poolSize = pool.length;

  return (
    <div className="app">
      <Header />
      <div className="page-body">
        <SidePanel
          acquired={acquired}
          filters={filters}
          carrierCount={carrierCount}
          toggleFilter={toggleFilter}
          resetAll={resetAll}
          pool={pool}
          poolSize={poolSize}
        />
        <Main
          g={g}
          enhance={enhance}
          useCarrier={useCarrier}
          currentCard={currentCard}
          isMaxG={g >= MAX_G}
        />
      </div>
      <AcquiredOptions acquired={acquired} />
    </div>
  );
}
