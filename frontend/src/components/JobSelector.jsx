import { useState } from 'react';
import { useLang } from '../lang';

const OTHER_KEY = '__other__';

const CATEGORY_ICONS = {
  'Банк, санхүү, нягтлан бодох бүртгэл': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M9 10h1" /><path d="M14 10h1" /><path d="M9 14h1" /><path d="M14 14h1" />
    </svg>
  ),
  'Худалдаа, борлуулалт': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  'Уул уурхай': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20l5-5 3 3 4-4 3 3 5-5" /><path d="M17 8l4-4" /><path d="M21 8V4h-4" />
    </svg>
  ),
  'Барилга, үл хөдлөх хөрөнгө': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 9h.01" /><path d="M8 9h.01" /><path d="M16 9h.01" />
    </svg>
  ),
  'Үйлдвэрлэл, инженерчлэл': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  'Боловсрол, шинжлэх ухаан': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><path d="M8 7h8" /><path d="M8 11h6" />
    </svg>
  ),
  'Мэдээллийн технологи, программ хангамж': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  ),
  'Эрүүл мэнд': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  'Маркетинг PR, менежмент': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /><path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" />
    </svg>
  ),
  'Захиргаа, хүний нөөц': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

const CATEGORY_DATA = {
  'Банк, санхүү, нягтлан бодох бүртгэл': {
    skills: ['Харилцааны чадвар', 'Нягт нямбай', 'Цагийн менежмент', 'Санхүүгийн тайлагнал', 'Аналитик сэтгэлгээ'],
    companies: ['Хаан банк', 'Голомт банк', 'Худалдаа хөгжлийн банк', 'Хас банк', 'Ард санхүүгийн нэгдэл'],
  },
  'Худалдаа, борлуулалт': {
    skills: ['Харилцааны чадвар', 'Хэлэлцээр хийх', 'Борлуулалтын стратеги', 'Үйлчлүүлэгчийн менежмент', 'Бүтээгдэхүүний мэдлэг'],
    companies: ['Номин холдинг', 'Минж групп', 'Tavan Bogd Group', 'E-mart', 'Good Price'],
  },
  'Уул уурхай': {
    skills: ['Багаар ажиллах', 'Харилцааны чадвар', 'Дасан зохицох', 'Аналитик сэтгэлгээ', 'Цагийн менежмент'],
    companies: ['Оюу толгой', 'Эрдэнэт үйлдвэр', 'Тавантолгой', 'MAK', 'Turquoise Hill'],
  },
  'Барилга, үл хөдлөх хөрөнгө': {
    skills: ['Харилцааны чадвар', 'AutoCAD', 'Цагийн менежмент', 'Хамтран ажиллах', 'Нягт нямбай'],
    companies: ['МCS Барилга', 'Монгол шуудан', 'Бишрэлт констракшн', 'Max Group', 'Teso Corporation'],
  },
  'Үйлдвэрлэл, инженерчлэл': {
    skills: ['Чанарын хяналт', 'Харилцааны чадвар', 'Цагийн менежмент', 'Нягт нямбай'],
    companies: ['APU', 'Gobi', 'MCS Electronics', 'Мон-Пак', 'Vitafit'],
  },
  'Боловсрол, шинжлэх ухаан': {
    skills: ['Цагийн менежмент', 'Харилцааны чадвар', 'Багаар ажиллах'],
    companies: ['МУИС', 'ШУТИС', 'Монгол Хөгжлийн Институт', 'Улаанбаатар Их Сургууль', 'МУБИС'],
  },
  'Мэдээллийн технологи, программ хангамж': {
    skills: ['Харилцааны чадвар', 'Багаар ажиллах', 'Шийдвэр гаргах', 'Шинжилгээ хийх'],
    companies: ['Unitel Group', 'Mobicom', 'AND Systems', 'IT Zone', 'Ard Credit'],
  },
  'Эрүүл мэнд': {
    skills: ['Харилцааны чадвар', 'Багаар ажиллах', 'Цагийн менежмент', 'Нягт нямбай'],
    companies: ['Интермед', 'Сонгдо эмнэлэг', 'Гранд Мед', 'УБ Сонгдо', 'Бөхөг эмнэлэг'],
  },
  'Маркетинг PR, менежмент': {
    skills: ['Харилцааны чадвар', 'Манлайлал', 'Бүтээлч сэтгэлгээ', 'Брэнд менежмент'],
    companies: ['Monos Group', 'Tavan Bogd Foods', 'MCS Coca-Cola', 'Nomin Foods', 'SKY Media'],
  },
  'Захиргаа, хүний нөөц': {
    skills: ['Харилцааны чадвар', 'Шийдвэр гаргах', 'Сургалт, хөгжлийн менежмент'],
    companies: ['MCS Group', 'Tavan Bogd Group', 'Мон-Цамхаг', 'Max Group', 'Shunkhlai Group'],
  },
};

const CATEGORIES = Object.keys(CATEGORY_DATA);

function JobSelector({ onJobSelect }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState('');
  const [customRole, setCustomRole] = useState('');

  function handleSelect(category) {
    if (selected === category) {
      setSelected('');
      onJobSelect(null);
      return;
    }

    setSelected(category);
    if (category === OTHER_KEY) {
      // "Other" selected — use custom role or general
      onJobSelect({
        id: null,
        title: customRole.trim() || 'general',
        company: '',
        description: '',
        required_skills: 'Харилцааны чадвар, Багаар ажиллах, Цагийн менежмент',
      });
    } else {
      const data = CATEGORY_DATA[category] || { skills: [], companies: [] };
      onJobSelect({
        id: null,
        title: category,
        company: '',
        description: '',
        required_skills: data.skills.join(', '),
      });
    }
  }

  function handleCustomRoleChange(e) {
    const val = e.target.value;
    setCustomRole(val);
    if (selected === OTHER_KEY) {
      onJobSelect({
        id: null,
        title: val.trim() || 'general',
        company: '',
        description: '',
        required_skills: 'Харилцааны чадвар, Багаар ажиллах, Цагийн менежмент',
      });
    }
  }

  const data = selected && selected !== OTHER_KEY ? (CATEGORY_DATA[selected] || { skills: [], companies: [] }) : null;

  return (
    <div className="job-selector">
      <h2>{t('job_category')}</h2>
      <div className="job-categories-grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`job-category-card ${selected === cat ? 'selected' : ''}`}
            onClick={() => handleSelect(cat)}
          >
            <span className="category-icon">{CATEGORY_ICONS[cat]}</span>
            <span className="category-name">{cat}</span>
          </button>
        ))}
        <button
          className={`job-category-card ${selected === OTHER_KEY ? 'selected' : ''}`}
          onClick={() => handleSelect(OTHER_KEY)}
        >
          <span className="category-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
            </svg>
          </span>
          <span className="category-name">{lang === 'mn' ? 'Бусад' : 'Other'}</span>
        </button>
      </div>

      {selected === OTHER_KEY && (
        <div className="selected-job-info">
          <strong>{lang === 'mn' ? 'Бусад салбар' : 'Other Field'}</strong>
          <p className="skills-description">{lang === 'mn' ? 'Ажлын чиглэлээ бичнэ үү. Ерөнхий асуултууд ашиглагдана.' : 'Enter your field. General questions will be used.'}</p>
          <input
            type="text"
            className="other-role-input"
            placeholder={lang === 'mn' ? 'Жишээ: Логистик, Дизайн, Хууль...' : 'e.g. Logistics, Design, Law...'}
            value={customRole}
            onChange={handleCustomRoleChange}
          />
        </div>
      )}

      {selected && data && (
        <div className="selected-job-info">
          <strong>{selected}</strong>
          <p className="skills-description">{t('skills_desc')}</p>
          <div className="skills">
            {data.skills.map((skill, i) => (
              <span key={i} className="skill-tag">{skill}</span>
            ))}
          </div>
          {data.companies.length > 0 && (
            <div className="company-examples">
              <p className="companies-label">{t('example_companies')}</p>
              <div className="companies">
                {data.companies.map((company, i) => (
                  <span key={i} className="company-tag">{company}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JobSelector;
