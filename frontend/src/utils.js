import { categoryToTag } from './questionBank';

export function classifyQuestion(text, category) {
  // If a granular category is provided, use the metadata-based mapping
  if (category) {
    return categoryToTag(category);
  }
  // Fallback: text-based classification for API-sourced questions
  const lower = text.toLowerCase();
  if (lower.includes('танилцуул') || lower.includes('introduce') || lower.includes('tell me about yourself'))
    return 'introduction';
  if (lower.includes('яагаад') || lower.includes('сэдэл') || lower.includes('why') || lower.includes('motivat'))
    return 'motivation';
  if (lower.includes('туршлага') || lower.includes('жишээ') || lower.includes('experience') || lower.includes('example') || lower.includes('tell me about a time'))
    return 'behavioral';
  if (lower.includes('хэрхэн') || lower.includes('ямар арга') || lower.includes('how would') || lower.includes('technical') || lower.includes('мэргэжл'))
    return 'technical';
  if (lower.includes('нөхцөл') || lower.includes('situation') || lower.includes('what would you do'))
    return 'situational';
  return 'general';
}

// Map question category to interview phase
export function getQuestionPhase(category) {
  const opening = ['introduction', 'motivation_role', 'motivation_company'];
  const ending = ['goals', 'closing'];
  if (opening.includes(category)) return 'opening';
  if (ending.includes(category)) return 'ending';
  return 'middle';
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getScoreColor(value) {
  if (value >= 80) return '#6E9B7C';
  if (value >= 60) return '#5B7DB1';
  return '#C4935A';
}
