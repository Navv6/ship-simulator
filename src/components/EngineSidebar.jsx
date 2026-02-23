import React from 'react';

const TABS = [
  { id: 'auto', label: '자동 찾기' },
  { id: 'predict', label: '확률 예측' },
];

export default function EngineSidebar({
  isOpen,
  onClose,
  tab,
  onTabChange,
  comboPresets,
  targetCombo,
  onSelectCombo,
  onClearCombo,
  autoState,
  predictState,
}) {
  const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;
  const getAttemptRange = (attempts) => {
    if (!Array.isArray(attempts) || attempts.length === 0) {
      return { min: null, max: null };
    }
    return {
      min: Math.min(...attempts),
      max: Math.max(...attempts),
    };
  };

  const renderTargetSelector = () => (
    <div className="engine-target-wrap">
      <div className="engine-subhead">
        <span>목표 조합</span>
        <strong>{targetCombo || '미선택'}</strong>
      </div>
      <div className="engine-action-row">
        <button type="button" className="engine-btn ghost" onClick={onClearCombo}>
          선택 해제
        </button>
      </div>
      <div className="engine-target-grid">
        {comboPresets.map((combo) => (
          <button
            key={combo}
            type="button"
            className={`engine-target-chip combo ${targetCombo === combo ? 'active' : ''}`}
            onClick={() => onSelectCombo(combo)}
          >
            <em>{combo}</em>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (tab === 'auto') {
      return (
        <div className="engine-tab-panel">
          <div className="engine-control-row">
            <label htmlFor="auto-max-attempts">시도 횟수</label>
            <input
              id="auto-max-attempts"
              className="engine-input"
              type="number"
              min="1"
              max={autoState.maxAttemptsLimit}
              step="1"
              value={autoState.maxAttemptsInput}
              onChange={(e) => autoState.onMaxAttemptsInputChange(e.target.value)}
            />
          </div>
          <div className="engine-action-row">
            <button type="button" className="engine-btn primary" onClick={autoState.onRun} disabled={autoState.running}>
              자동 실행
            </button>
            <button type="button" className="engine-btn danger" onClick={autoState.onStop} disabled={!autoState.running}>
              중지
            </button>
          </div>

          {autoState.running && (
            <div className="engine-progress-wrap">
              <div className="engine-progress-label">진행률 {(autoState.progress * 100).toFixed(1)}%</div>
              <div className="engine-progress-track">
                <div className="engine-progress-fill" style={{ width: `${autoState.progress * 100}%` }} />
              </div>
            </div>
          )}

          {autoState.result && (
            <div className={`engine-result ${autoState.result.status}`}>
              <div className="engine-result-title">{autoState.result.title}</div>
              <div className="engine-result-text">{autoState.result.message}</div>
            </div>
          )}
        </div>
      );
    }

    const attemptRange = getAttemptRange(predictState.result?.attempts);

    return (
      <div className="engine-tab-panel">
        <div className="engine-control-row">
          <label htmlFor="predict-trials">시뮬 횟수</label>
          <input
            id="predict-trials"
            className="engine-input"
            type="number"
            min="50"
            step="50"
            value={predictState.trialsInput}
            onChange={(e) => predictState.onTrialsInputChange(e.target.value)}
          />
        </div>
        <div className="engine-control-row">
          <label htmlFor="predict-max-attempts">시도 횟수</label>
          <input
            id="predict-max-attempts"
            className="engine-input"
            type="number"
            min="1"
            max={predictState.maxAttemptsLimit}
            step="1"
            value={predictState.maxAttemptsInput}
            onChange={(e) => predictState.onMaxAttemptsInputChange(e.target.value)}
          />
        </div>
        <div className="engine-control-row">
          <label htmlFor="predict-carrier-cost">함재기 비용 (억)</label>
          <input
            id="predict-carrier-cost"
            className="engine-input"
            type="number"
            min="0"
            step="0.1"
            value={predictState.carrierCostInput}
            onChange={(e) => predictState.onCarrierCostInputChange(e.target.value)}
          />
        </div>
        <div className="engine-action-row">
          <button type="button" className="engine-btn primary" onClick={predictState.onRun} disabled={predictState.running}>
            확률 예측 실행
          </button>
        </div>

        {predictState.result?.error && (
          <div className="engine-result failed">
            <div className="engine-result-title">실행 불가</div>
            <div className="engine-result-text">{predictState.result.error}</div>
          </div>
        )}

        {predictState.result?.successRate != null && (
          <div className="engine-result success">
            <div className="engine-rank-item"><span>성공률</span><em>{formatPercent(predictState.result.successRate)}</em></div>
            <div className="engine-rank-item"><span>평균 시도</span><em>{predictState.result.averageAttempts?.toFixed(2)}회</em></div>
            {attemptRange.min != null && (
              <div className="engine-rank-item"><span>최저 시도</span><em>{attemptRange.min}회</em></div>
            )}
            {attemptRange.max != null && (
              <div className="engine-rank-item"><span>최고 시도</span><em>{attemptRange.max}회</em></div>
            )}
            {predictState.result.expectedCost != null && (
              <div className="engine-rank-item"><span>예상 비용</span><em>{Math.trunc(predictState.result.expectedCost).toLocaleString()}억</em></div>
            )}
          </div>
        )}

      </div>
    );
  };

  return (
    <>
      {isOpen && <button className="engine-overlay" type="button" onClick={onClose} aria-label="엔진 패널 닫기" />}

      <aside className={`engine-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="engine-head">
          <div className="engine-title">SIMULATION ENGINE</div>
        </div>

        {renderTargetSelector()}

        <div className="engine-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`engine-tab ${tab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="engine-content">{renderContent()}</div>
      </aside>
    </>
  );
}
