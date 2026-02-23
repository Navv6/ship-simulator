import React from 'react';
import { MILESTONES, MAX_G } from '../constants';

export default function Main({ g, enhance, useCarrier, currentCard, isMaxG }) {
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
          <div className="opt-milestone-tag">{currentCard.g}G OPTION ACQUIRED</div>
          <div className="opt-name">{currentCard.opt.name}</div>
          <div className="opt-num">No. {currentCard.opt.num}</div>
          <div className="opt-prob">
            등장 확률 <span>{pct}%</span> <em>({currentCard.poolSize}개 균등)</em>
          </div>
        </div>
      );
    }

    return <div className="idle-msg">강화 버튼을 눌러 시작하세요</div>;
  };

  return (
    <div className="main">
      <div className="progress-wrap">
        <div className="progress-top">
          <div className="progress-label">ENHANCEMENT GRADE</div>
          <div className="progress-g">
            {g}<span>G</span>
          </div>
        </div>
        <div className="g-track-outer">
          <div className="g-track">
            {Array.from({ length: MAX_G }).map((_, i) => {
              const gNum = i + 1;
              const isMile = MILESTONES.includes(gNum);
              return (
                <div
                  key={gNum}
                  className={`g-step ${gNum <= g ? 'filled' : ''} ${isMile ? 'milestone-step' : ''}`}
                >
                  {isMile && <div className="g-label">{gNum}G</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-enhance" onClick={enhance} disabled={isMaxG}>
            ▶ 강화
          </button>
          <button className="btn btn-carrier" onClick={useCarrier}>
            ✦ 함재기
          </button>
        </div>
      </div>

      <div className="option-area">{renderOptionArea()}</div>
    </div>
  );
}
