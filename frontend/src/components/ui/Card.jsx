function Card({ label, hover = false, accent = false, className = '', children, ...rest }) {
  const classes = [
    'card',
    hover && 'card-hover',
    accent && 'card-accent',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {label && <div className="label" style={{ marginBottom: 10 }}>{label}</div>}
      {children}
    </div>
  );
}

export default Card;
