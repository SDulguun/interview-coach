import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { useLang } from '../lang';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function ProgressChart() {
  const { t } = useLang();

  const history = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('interview-history') || '[]');
    } catch {
      return [];
    }
  }, []);

  if (history.length < 2) {
    return (
      <div className="card progress-chart">
        <h2>{t('progress_title')}</h2>
        <p className="progress-empty">{t('progress_empty')}</p>
      </div>
    );
  }

  const reversed = [...history].reverse();

  const data = {
    labels: reversed.map((item) => {
      const d = new Date(item.date);
      return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        data: reversed.map((item) => item.score),
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.06)',
        pointBackgroundColor: '#FF6B35',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a1a2e',
        bodyColor: '#4a4a68',
        borderColor: '#e8e5e0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => `${t('history_score')}: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#8b8ba3',
          font: { size: 11 },
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
      },
      x: {
        ticks: {
          color: '#8b8ba3',
          font: { size: 11 },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div className="card progress-chart">
      <h2>{t('progress_title')}</h2>
      <div className="chart-wrapper">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default ProgressChart;
