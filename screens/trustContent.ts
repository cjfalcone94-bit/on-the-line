import type { GoalIconName } from '@/components/premium';

export const facts = [
  { number: '01', icon: 'lock', title: 'Stake authorized, base fee charged', body: 'Your stake is only authorized. A small, separate base service fee is charged when you commit.' },
  { number: '02', icon: 'check', title: 'Success releases the stake', body: 'Succeed and the stake authorization is released. A separate small success fee is charged.' },
  { number: '03', icon: 'chart', title: 'Failure has one destination', body: 'Fail and 100% of your stake goes to the charity you chose. We keep none of it, and charge no success fee.' },
] as const satisfies readonly {
  number: string; icon: GoalIconName; title: string; body: string;
}[];
