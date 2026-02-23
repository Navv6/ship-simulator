import React from 'react';
import { getChainState } from '../utils';

export default function SidePanel({
  acquired,
  filters,
  carrierCount,
  toggleFilter,
  onShipTypeChange,
  resetAll,
  pool,
  poolSize,
}) {
  const used = acquired.map((a) => a.option.num);
  const states = getChainState(used, pool, poolSize);
  const inheritLocked = used.includes(6);

  const ChainStep = ({
    label,
    state,
    toggleable = false,
    enabled = true,
    disabled = false,
    onToggle,
  }) => {
    const toggledOff = toggleable && !enabled && state.status !== 'done';
    const className = `chain-step ${state.status === 'done' ? 'done' : state.status === 'next' ? 'active-next' : ''} ${toggleable ? 'toggleable' : ''} ${toggledOff ? 'toggled-off' : ''}`;
    const probText = toggledOff ? 'OFF' : state.prob;

    return (
      <div className="chain-group">
        <div className="chain-label">{label}</div>
        {toggleable ? (
          <button type="button" className={className} onClick={onToggle} disabled={disabled}>
            <div className="chain-step-icon">{state.icon}</div>
            <div className="chain-step-name">{state.name}</div>
            <div className="chain-step-prob">{probText}</div>
          </button>
        ) : (
          <div className={className}>
            <div className="chain-step-icon">{state.icon}</div>
            <div className="chain-step-name">{state.name}</div>
            <div className="chain-step-prob">{probText}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="side-panel">
      <div className="side-title">CHAIN PROBABILITY</div>

      <ChainStep label="가속 강화" state={states.accel} />
      <ChainStep label="스킬칸 추가" state={states.skill} />
      <ChainStep
        label={`스킬 계승 ${filters.inherit ? 'ON' : 'OFF'}`}
        state={states.inherit}
        toggleable
        enabled={filters.inherit}
        disabled={inheritLocked}
        onToggle={() => toggleFilter('inherit')}
      />

      <div className="filter-section">
        <div className="filter-grid">
          <div className="filter-item" onClick={() => toggleFilter('bow')}>
            <div className={`filter-checkbox ${filters.bow ? 'checked' : ''}`} />
            <div className="filter-label">선수</div>
          </div>
          <div className="filter-item" onClick={() => toggleFilter('side')}>
            <div className={`filter-checkbox ${filters.side ? 'checked' : ''}`} />
            <div className="filter-label">선측</div>
          </div>
          <div className="filter-item" onClick={() => toggleFilter('stern')}>
            <div className={`filter-checkbox ${filters.stern ? 'checked' : ''}`} />
            <div className="filter-label">선미</div>
          </div>
          <div className="filter-item" onClick={() => toggleFilter('remodel')}>
            <div className={`filter-checkbox ${filters.remodel ? 'checked' : ''}`} />
            <div className="filter-label">개조류</div>
          </div>
          <div className="filter-item" onClick={() => onShipTypeChange('sail')}>
            <div className={`filter-checkbox ${filters.shipType === 'sail' ? 'checked' : ''}`} />
            <div className="filter-label">범선</div>
          </div>
          <div className="filter-item" onClick={() => onShipTypeChange('galley')}>
            <div className={`filter-checkbox ${filters.shipType === 'galley' ? 'checked' : ''}`} />
            <div className="filter-label">갤리</div>
          </div>
        </div>
        <div className="engine-muted">조력 강화 옵션은 갤리에서만 등장합니다.</div>
      </div>

      <div className="stats-wrap">
        <div className="stat-box">
          <div className="stat-box-label">함재기 사용</div>
          <div className="stat-box-value purple">{carrierCount}</div>
        </div>
      </div>

      <div className="reset-wrap">
        <button className="btn-reset" onClick={resetAll}>전체 초기화</button>
      </div>
    </div>
  );
}
