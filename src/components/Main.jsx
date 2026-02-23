import React, { useState } from 'react';
import AcquiredOptions from './AcquiredOptions';

export default function Main({
  g,
  enhance,
  useCarrier,
  currentCard,
  isMaxG,
  acquired,
  currentBuildState,
}) {
  const [simTab, setSimTab] = useState('normal');

  const renderOptionArea = () => {
    if (!currentCard) {
      return <div className="idle-msg">강화 버튼을 눌러 시작하세요</div>;
    }

    if (currentCard.error) {
      return <div className="idle-msg">{currentCard.error}</div>;
    }

    if (currentCard.message) {
      return <div className="idle-msg">{currentCard.message}</div>;
    }

    if (currentCard.opt) {
      const pct = (1 / currentCard.poolSize * 100).toFixed(1);
      return (
        <div className="option-card">
          <div className="opt-name">{currentCard.opt.name}</div>
          <div className="opt-prob">
            등장 확률 <span>{pct}%</span> <em>({currentCard.poolSize}개 균등)</em>
          </div>
        </div>
      );
    }

    return <div className="idle-msg">강화 버튼을 눌러 시작하세요</div>;
  };

  const renderMilestoneTrack = (grade, keyPrefix) => (
    <div className="g-track-outer current-build-track-outer">
      <div className="g-track-thirds">
        {[
          { key: 'g1', label: '1G', fill: Math.max(0, Math.min(1, grade / 1)) },
          { key: 'g3', label: '3G', fill: Math.max(0, Math.min(1, (grade - 1) / 2)) },
          { key: 'g6', label: '6G', fill: Math.max(0, Math.min(1, (grade - 3) / 3)) },
        ].map((segment) => (
          <div key={`${keyPrefix}-${segment.key}`} className="g-third">
            <div className="g-third-fill" style={{ width: `${segment.fill * 100}%` }} />
            <div className="g-label">{segment.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentBuildArea = () => (
    <div className="main-build-wrap">
      <div className="main-build-form-grid">
        <div className="main-build-form">
          <label htmlFor="main-build-option-1">옵션 1</label>
          <select
            id="main-build-option-1"
            className="main-build-select"
            value={currentBuildState.option1Input}
            onChange={(e) => currentBuildState.onOption1Change(e.target.value)}
          >
            <option value="">없음</option>
            {currentBuildState.option1Choices.map((opt) => (
              <option key={opt.num} value={String(opt.num)}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="main-build-form">
          <label htmlFor="main-build-option-2">옵션 2</label>
          <select
            id="main-build-option-2"
            className="main-build-select"
            value={currentBuildState.option2Input}
            onChange={(e) => currentBuildState.onOption2Change(e.target.value)}
            disabled={!currentBuildState.option1Input}
          >
            <option value="">없음</option>
            {currentBuildState.option2Choices.map((opt) => (
              <option key={opt.num} value={String(opt.num)}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="progress-top current-build-progress-top">
        <div className="progress-label">ENHANCEMENT GRADE</div>
        <div className="progress-g">
          {currentBuildState.currentGrade}<span>G</span>
        </div>
      </div>

      {renderMilestoneTrack(currentBuildState.currentGrade, 'current')}

      <div className="btn-row main-build-action-row">
        <button
          className="btn btn-enhance"
          onClick={currentBuildState.onRun}
          disabled={!currentBuildState.canEnhance}
        >
          ▶ 강화
        </button>
        <button className="btn btn-carrier" onClick={currentBuildState.onUseCarrier}>
          ✦ 함재기
        </button>
      </div>

      {!currentBuildState.card && (
        <div className="main-build-result">강화 버튼을 눌러 시뮬레이션을 진행하세요</div>
      )}

      {currentBuildState.card?.error && (
        <div className="main-build-result failed">{currentBuildState.card.error}</div>
      )}

      {currentBuildState.card?.message && (
        <div className="main-build-result">{currentBuildState.card.message}</div>
      )}

      {currentBuildState.card?.opt && (
        <div className="main-build-result">
          <div className="main-build-row"><span>획득 옵션</span><em>{currentBuildState.card.opt.name}</em></div>
          <div className="main-build-row"><span>획득 글드</span><em>{currentBuildState.card.g}G</em></div>
          <div className="main-build-row"><span>등장 확률</span><em>{(1 / currentBuildState.card.poolSize * 100).toFixed(1)}%</em></div>
          <div className="main-build-row"><span>풀 크기</span><em>{currentBuildState.card.poolSize}</em></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="main">
      <div className="progress-wrap">
        <div className="main-sim-tabs" role="tablist" aria-label="시뮬레이션 탭">
          <button
            type="button"
            className={`main-sim-tab ${simTab === 'normal' ? 'active' : ''}`}
            onClick={() => setSimTab('normal')}
          >
            일반 강화 시뮬레이션
          </button>
          <button
            type="button"
            className={`main-sim-tab ${simTab === 'current' ? 'active' : ''}`}
            onClick={() => setSimTab('current')}
          >
            현재 글드 시뮬레이션
          </button>
        </div>

        <div className="main-sim-pane">
          {simTab === 'normal' ? (
            <>
              <div className="progress-top">
                <div className="progress-label">ENHANCEMENT GRADE</div>
                <div className="progress-g">
                  {g}<span>G</span>
                </div>
              </div>

              {renderMilestoneTrack(g, 'normal')}

              <div className="btn-row">
                <button className="btn btn-enhance" onClick={enhance} disabled={isMaxG}>
                  ▶ 강화
                </button>
                <button className="btn btn-carrier" onClick={useCarrier}>
                  ✦ 함재기
                </button>
              </div>

              <div className="option-area">{renderOptionArea()}</div>
            </>
          ) : (
            renderCurrentBuildArea()
          )}
        </div>
      </div>

      <AcquiredOptions acquired={simTab === 'current' ? currentBuildState.syncedAcquired : acquired} />
    </div>
  );
}
