function GlowBackground({
  color = '#7c3aed',
  size = 320,
  opacity = 0.35,
  top,
  left,
  right,
  bottom,
  className = '',
  style = {},
}) {
  return (
    <div
      className={['glow-bg', className].filter(Boolean).join(' ')}
      aria-hidden
      style={{
        width: size,
        height: size,
        background: color,
        opacity,
        top, left, right, bottom,
        ...style,
      }}
    />
  );
}

export default GlowBackground;
