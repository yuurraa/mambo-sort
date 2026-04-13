type ControlPanelProps = {
  status: 'idle' | 'running' | 'paused' | 'completed';
  stepCount: number;
  actionCount: number;
  actionLabel: string;
  elapsedMs: number;
  usingLabel: string;
  trailingStatLabel: string;
  trailingStatValue: string;
};

function formatElapsedTime(elapsedMs: number): string {
  const totalMilliseconds = Math.floor(elapsedMs);
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = totalMilliseconds % 1000;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export function ControlPanel({
  status,
  stepCount,
  actionCount,
  actionLabel,
  elapsedMs,
  usingLabel,
  trailingStatLabel,
  trailingStatValue,
}: ControlPanelProps) {
  return (
    <section className="panel shell-card">
      <div className="panel-copy">
        <div className="panel-title-row">
          <img
            className="panel-title-icon panel-title-icon-left"
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
          <span className="stat-label">{actionLabel}</span>
          <strong>{actionCount}</strong>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Steps</span>
          <strong>{stepCount}</strong>
        </div>
        <div className="stat-tile stat-tile-using">
          <span className="stat-label">Using</span>
          <strong>{usingLabel}</strong>
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
