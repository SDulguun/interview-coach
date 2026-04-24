function StatCard({ value, label, color = '', mono = true, className = '', style = {} }) {
  return (
    <div className={['stat-card', className].filter(Boolean).join(' ')} style={style}>
      <div className={['stat-value', mono && 'mono', color].filter(Boolean).join(' ')}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default StatCard;
