import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function ScoreCounter({
  target = 0,
  duration = 1200,
  className = '',
  style = {},
  decimals = 0,
  suffix = '',
}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      setValue(from + (to - from) * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <span className={['mono', className].filter(Boolean).join(' ')} style={style}>
      {formatted}{suffix}
    </span>
  );
}

export default ScoreCounter;
