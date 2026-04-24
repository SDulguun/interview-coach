function Tag({ color = 'default', className = '', children, ...rest }) {
  const colorClass =
    color === 'iris'  ? 'tag-iris' :
    color === 'green' ? 'tag-green' :
    color === 'amber' ? 'tag-amber' :
    color === 'red'   ? 'tag-red' : '';
  return (
    <span className={['tag', colorClass, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}

export default Tag;
