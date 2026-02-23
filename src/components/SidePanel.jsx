import React from 'react';
import { getChainState } from '../utils';

export default function SidePanel({ acquired, filters, carrierCount, toggleFilter, resetAll, pool, poolSize }) {
  const used = acquired.map(a => a.option.num);
  const states = getChainState(used, pool, poolSize);

  const ChainStep = ({ label, state }) => (
    <div className="chain-group">
      <div className="chain-label">{label}</div>
      <div className={`chain-step ${state.status === 'done' ? 'done' : state.status === 'next' ? 'active-next' : ''}`}>
        <div className="chain-step-icon">{state.icon}</div>
        <div className="chain-step-name">{state.name}</div>
        <div className="chain-step-prob">{state.prob}</div>
      </div>
    </div>
  );

  return (
    <div className="side-panel">
      <div className="side-title">CHAIN PROBABILITY</div>

      <ChainStep label="가속 강화" state={states.accel} />
      <ChainStep label="스킬칸 추가" state={states.skill} />
      <ChainStep label="스킬 계승" state={states.inherit} />

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-item" onClick={() => toggleFilter('bow')}>
            <div className={`filter-checkbox ${filters.bow ? 'checked' : ''}`}></div>
            <div className="filter-label">선수</div>
          </div>
          <div className="filter-item" onClick={() => toggleFilter('side')}>
            <div className={`filter-checkbox ${filters.side ? 'checked' : ''}`}></div>
            <div className="filter-label">선측</div>
          </div>
          <div className="filter-item" onClick={() => toggleFilter('stern')}>
            <div className={`filter-checkbox ${filters.stern ? 'checked' : ''}`}></div>
            <div className="filter-label">선미</div>
          </div>
        </div>
        <div className="filter-item" onClick={() => toggleFilter('remodel')}>
          <div className={`filter-checkbox ${filters.remodel ? 'checked' : ''}`}></div>
          <div className="filter-label">개조 옵션</div>
        </div>
      </div>

      <div className="stats-wrap">
        <div className="stat-box">
          <div className="stat-box-label">함재기 사용</div>
          <div className="stat-box-value purple">{carrierCount}</div>
        </div>
      </div>

      <div className="reset-wrap">
        <button className="btn-reset" onClick={resetAll}>⌕ 전체 초기화</button>
      </div>
    </div>
  );
}
