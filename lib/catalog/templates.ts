import type { GoalIconName } from '@/components/premium';

export type TemplateCategory = 'Move' | 'Build' | 'Reset' | 'Learn';

export type ChecklistTemplate = {
  id: string;
  category: TemplateCategory;
  title: string;
  cadence: string;
  summary: string;
  proof: string;
  icon: GoalIconName;
  criteria: readonly string[];
};

export const templates: readonly ChecklistTemplate[] = [
  { id: 'daily-walk', category: 'Move', title: 'Daily outdoor walk', cadence: 'Daily · 30 days', summary: 'Get outside and walk with a clear daily record.', proof: 'Time-stamped photo · daily window', icon: 'walk', criteria: ['One outdoor walk of at least 20 minutes', 'One time-stamped photo taken during the walk', 'Submit before the daily window closes'] },
  { id: 'gym-checkin', category: 'Move', title: 'Gym check-in', cadence: '3× weekly · 4 weeks', summary: 'Complete three planned gym sessions each week.', proof: 'Photo inside your gym · 3× per week', icon: 'dumbbell', criteria: ['Photo taken inside your selected gym', 'Workout lasts at least 30 minutes', 'Three submissions in each Monday–Sunday window'] },
  { id: 'morning-run', category: 'Move', title: 'Morning run', cadence: '3× weekly · 4 weeks', summary: 'Make an early run a repeatable part of the week.', proof: 'Route record, 2+ miles · 3× per week', icon: 'run', criteria: ['Run starts before 9:00 a.m.', 'Route record shows at least 2 miles', 'Three submissions in each Monday–Sunday window'] },
  { id: 'strength-basics', category: 'Move', title: 'Strength basics', cadence: '3× weekly · 6 weeks', summary: 'Follow a simple, consistent strength routine.', proof: 'Photo of log and location · 3× per week', icon: 'dumbbell', criteria: ['Complete the template’s three core exercises', 'Photo shows the workout log and location', 'Three sessions in each weekly window'] },
  { id: 'mobility', category: 'Move', title: 'Daily mobility', cadence: 'Daily · 21 days', summary: 'Protect ten minutes for basic mobility work.', proof: 'Dated setup photo · daily window', icon: 'stretch', criteria: ['Complete the listed 10-minute sequence', 'Photo shows your setup and today’s date', 'Submit once in each daily window'] },
  { id: 'read-20', category: 'Learn', title: 'Read for 20 minutes', cadence: 'Daily · 30 days', summary: 'Turn a small reading block into a steady practice.', proof: 'Photo of book and page range · daily window', icon: 'book', criteria: ['Read one book for at least 20 minutes', 'Photo shows the book and today’s page range', 'Submit once in each daily window'] },
  { id: 'language-practice', category: 'Learn', title: 'Language practice', cadence: '5× weekly · 6 weeks', summary: 'Keep deliberate language study moving.', proof: 'Dated lesson completion · 5× per week', icon: 'book', criteria: ['Complete at least 20 minutes of study', 'Photo shows the dated lesson completion', 'Five submissions in each weekly window'] },
  { id: 'course-module', category: 'Learn', title: 'Finish one course module', cadence: 'Weekly · 8 weeks', summary: 'Move through an online course one module at a time.', proof: 'Module completion screenshot · by Sunday', icon: 'book', criteria: ['Complete one full module', 'Screenshot shows module title and completion state', 'Submit before Sunday at 11:59 p.m.'] },
  { id: 'daily-writing', category: 'Learn', title: 'Daily writing', cadence: 'Daily · 30 days', summary: 'Build a body of work with a modest daily minimum.', proof: 'Photo of dated word count · daily window', icon: 'pencil', criteria: ['Write at least 300 new words', 'Photo shows the dated word count', 'Submit once in each daily window'] },
  { id: 'practice-instrument', category: 'Learn', title: 'Practice an instrument', cadence: '5× weekly · 4 weeks', summary: 'Keep focused practice on the calendar.', proof: 'Photo of instrument and log · 5× per week', icon: 'pencil', criteria: ['Practice for at least 20 minutes', 'Photo shows the instrument and practice log', 'Five submissions in each weekly window'] },
  { id: 'no-smoking', category: 'Reset', title: 'No-smoking streak', cadence: 'Daily · 30 days', summary: 'Keep each day smoke-free and honestly recorded.', proof: 'Daily reflection check-in · daily window', icon: 'check', criteria: ['Confirm no cigarettes or tobacco used that day', 'Complete the daily reflection check-in', 'Submit before the daily window closes'] },
  { id: 'no-alcohol-weekdays', category: 'Reset', title: 'Alcohol-free weekdays', cadence: 'Mon–Thu · 4 weeks', summary: 'Keep weekday evenings alcohol-free.', proof: 'Daily reflection check-in · Mon–Thu', icon: 'check', criteria: ['Confirm no alcohol from midnight through 11:59 p.m.', 'Complete the daily reflection check-in', 'All four weekday windows must be submitted'] },
  { id: 'phone-curfew', category: 'Reset', title: 'Phone curfew', cadence: 'Daily · 21 days', summary: 'End scrolling at a fixed hour each night.', proof: 'Dated screen-time screenshot · by 9:00 a.m.', icon: 'moon', criteria: ['Screen-time screenshot shows no use after 10:30 p.m.', 'Screenshot includes the date', 'Submit by 9:00 a.m. the next day'] },
  { id: 'bedtime', category: 'Reset', title: 'Consistent bedtime', cadence: '5× weekly · 4 weeks', summary: 'Protect a stable end to the day.', proof: 'Dated sleep record · 5 nights per week', icon: 'moon', criteria: ['Sleep record shows bedtime before 11:00 p.m.', 'Record includes the correct date', 'Five qualifying nights in each weekly window'] },
  { id: 'early-rise', category: 'Reset', title: 'Early rise', cadence: '5× weekly · 4 weeks', summary: 'Start five weekdays at the time you chose.', proof: 'Dated photo after rising · before 7:00 a.m.', icon: 'timer', criteria: ['Dated check-in submitted before 7:00 a.m.', 'Photo is taken after leaving bed', 'Five submissions in each weekly window'] },
  { id: 'deep-work', category: 'Build', title: 'Daily deep-work block', cadence: 'Weekdays · 4 weeks', summary: 'Give one important project an uninterrupted hour.', proof: 'Timer record, start and finish · each weekday', icon: 'timer', criteria: ['Complete one focused block of at least 60 minutes', 'Timer record shows start and finish', 'Submit once per weekday'] },
  { id: 'job-applications', category: 'Build', title: 'Focused job search', cadence: '5× weekly · 4 weeks', summary: 'Make concrete progress on a job search each week.', proof: 'Dated record, details hidden · 5× per week', icon: 'search', criteria: ['Submit one tailored application or outreach', 'Record shows company and date, with personal details hidden', 'Five qualifying actions in each weekly window'] },
  { id: 'creative-hour', category: 'Build', title: 'Creative hour', cadence: '4× weekly · 6 weeks', summary: 'Reserve an hour for making, not planning.', proof: 'Photo of work in progress · 4× per week', icon: 'pencil', criteria: ['Create for at least 60 minutes', 'Photo shows the day’s work in progress', 'Four submissions in each weekly window'] },
  { id: 'declutter', category: 'Build', title: 'Declutter one space', cadence: 'Daily · 14 days', summary: 'Clear one small, defined area every day.', proof: 'Before-and-after photo · daily window', icon: 'check', criteria: ['Choose one drawer, shelf, or equivalent area', 'Before-and-after photo shows the same area', 'Submit once in each daily window'] },
  { id: 'side-project', category: 'Build', title: 'Ship a side-project step', cadence: '3× weekly · 6 weeks', summary: 'Keep a personal project moving in visible increments.', proof: 'Evidence of the finished change · 3× per week', icon: 'chart', criteria: ['Complete one task defined before the work session', 'Evidence shows the finished change', 'Three submissions in each weekly window'] },
] as const;

export function groupTemplates(items: readonly ChecklistTemplate[]) {
  const order: TemplateCategory[] = ['Move', 'Build', 'Reset', 'Learn'];
  return order
    .map((title) => ({ title, data: items.filter((item) => item.category === title) }))
    .filter((section) => section.data.length > 0);
}

export function findTemplate(id: string): ChecklistTemplate | undefined {
  return templates.find((template) => template.id === id);
}
