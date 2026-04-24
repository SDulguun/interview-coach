function Pill({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={['pill', active && 'pill-active', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Pill;
