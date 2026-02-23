import React from 'react';
import { calculateCombo } from '../utils';

export default function AcquiredOptions({ acquired }) {
  const { combo, totalPct } = calculateCombo(acquired);

  return (
    <div className="acquired-wrap">
      <div className="section-title">획득한 옵션</div>
      <div className="acquired-list">
        {acquired.length === 0 ? (
          <div className="none-yet">아직 획득한 옵션이 없습니다</div>
        ) : (
          <>
            {acquired.map((item, idx) => {
              const prob = (1 / item.poolSize * 100).toFixed(1);
              return (
                <div key={idx} className="acquired-item">
                  <div className="acq-g">{item.milestone}G</div>
                  <div className="acq-name">{item.option.name}</div>
                  <div className="acq-num">No.{item.option.num}</div>
                  <div className="acq-prob">{prob}%</div>
                </div>
              );
            })}
            <div className="prob-summary">
              <div className="prob-summary-title">✦ COMBINATION ✦</div>
              <div className="prob-combo">{combo}</div>
              <div className="prob-total">
                {totalPct}<span>%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
