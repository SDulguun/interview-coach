import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import {
  Play, History, BookOpen, FileText, Languages, LogOut, Home, Search,
} from 'lucide-react';
import Kbd from './Kbd';
import './command-palette.css';

function CommandPalette({ open, onOpenChange, onCommand, paused = false, lang = 'mn' }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const items = [
    { id: 'new',     icon: Play,      mn: 'Шинэ дасгал эхлүүлэх',           en: 'Start new practice' },
    ...(paused ? [{ id: 'resume', icon: Home, mn: 'Дасгал үргэлжлүүлэх', en: 'Resume practice' }] : []),
    { id: 'history', icon: History,   mn: 'Түүх харах',                     en: 'View history' },
    { id: 'star',    icon: BookOpen,  mn: 'STAR зөвлөмж',                   en: 'STAR guide' },
    { id: 'guides',  icon: FileText,  mn: 'CV + ажлын заар харьцуулах',     en: 'CV + JD compare' },
    { id: 'lang',    icon: Languages, mn: 'Хэл солих — English',            en: 'Switch language — Монгол' },
    { id: 'logout',  icon: LogOut,    mn: 'Гарах',                          en: 'Sign out' },
  ];

  return (
    <div className="cmdk-backdrop" onClick={() => onOpenChange(false)}>
      <div className="cmdk-wrap" onClick={(e) => e.stopPropagation()}>
        <Command shouldFilter value={value} onValueChange={setValue}>
          <div className="cmdk-input-row">
            <Search size={16} strokeWidth={1.5} />
            <Command.Input
              autoFocus
              placeholder={lang === 'mn' ? 'Команд хайх…' : 'Search commands…'}
            />
            <Kbd>ESC</Kbd>
          </div>
          <Command.List>
            <Command.Empty className="cmdk-empty">
              {lang === 'mn' ? 'Үр дүн олдсонгүй' : 'No results'}
            </Command.Empty>
            <Command.Group>
              {items.map(({ id, icon: Icon, mn, en }) => (
                <Command.Item
                  key={id}
                  value={`${mn} ${en}`}
                  onSelect={() => { onOpenChange(false); onCommand?.(id); }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span className="cmdk-label">{lang === 'mn' ? mn : en}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

export default CommandPalette;
