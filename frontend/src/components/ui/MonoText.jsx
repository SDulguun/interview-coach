function MonoText({ color, className = '', children, ...rest }) {
  const style = color ? { color } : undefined;
  return (
    <span className={['mono', className].filter(Boolean).join(' ')} style={style} {...rest}>
      {children}
    </span>
  );
}

export default MonoText;
