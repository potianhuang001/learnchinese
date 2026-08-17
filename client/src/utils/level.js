/**
 * 难度元数据（标签 i18n 键 + 徽章配色）
 */
export const LEVELS = [
  {
    value: 'beginner',
    labelKey: 'lessons_beginner',
    badge: 'bg-emerald-100 text-emerald-700',
    chip: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  {
    value: 'intermediate',
    labelKey: 'lessons_intermediate',
    badge: 'bg-amber-100 text-amber-700',
    chip: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    dot: 'bg-amber-500',
  },
  {
    value: 'advanced',
    labelKey: 'lessons_advanced',
    badge: 'bg-rose-100 text-rose-700',
    chip: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
    dot: 'bg-rose-500',
  },
];

/** 按难度值取元数据 */
export function getLevel(level) {
  return LEVELS.find((l) => l.value === level) || LEVELS[0];
}
