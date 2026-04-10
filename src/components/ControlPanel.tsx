type ControlPanelProps = {
  status: 'idle' | 'running' | 'paused' | 'completed';
  stepCount: number;
  swapCount: number;
  elapsedMs: number;
  trailingStatLabel: string;
  trailingStatValue: string;
};

function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ControlPanel({
  status,
  stepCount,
  swapCount,
  elapsedMs,
  trailingStatLabel,
  trailingStatValue,
}: ControlPanelProps) {
  return (
    <section className="panel shell-card">
      <div className="panel-copy">
        <div className="panel-title-row">
          <img
            className="panel-title-icon"
            src="/assets/header.png"
            alt=""
            aria-hidden="true"
          />
          <h1>Mambo Sort</h1>
          <img
            className="panel-title-icon"
            src="/assets/header.png"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="status-strip">
        <div className={`status-pill status-${status}`}>
          <span className="status-dot" />
          {status === 'completed' ? 'Completed' : status}
        </div>
        <div className="stat-tile">
          <span className="stat-label">Swaps</span>
          <strong>{swapCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Steps</span>
          <strong>{stepCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Time</span>
          <strong>{formatElapsedTime(elapsedMs)}</strong>
        </div>
        <div className="stat-tile">
          <span className="stat-label">{trailingStatLabel}</span>
          <strong>{trailingStatValue}</strong>
        </div>
      </div>
    </section>
  );
}
