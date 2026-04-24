import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref
) {
  const classes = [
    'btn',
    variant === 'primary' ? 'btn-primary' :
    variant === 'ghost'   ? 'btn-ghost' :
    variant === 'icon'    ? 'btn-icon' :
    variant === 'back'    ? 'btn-back' : '',
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
