function Kbd({ className = '', children, ...rest }) {
  return (
    <span className={['kbd', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}

export default Kbd;
