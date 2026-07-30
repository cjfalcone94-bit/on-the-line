export const VERIFICATION_SLA_HOURS = 24;

export type VerificationStatus = 'pending' | 'in_review' | 'passed' | 'needs_review' | 'appealed';
export type ResolutionType = 'ai_pass' | 'human_pass' | 'human_fail' | 'sla_auto_pass';

export type VerificationSubmission = Readonly<{
  id: string;
  submittedAt: string;
  slaDeadline: string;
  status: VerificationStatus;
  resolutionType: ResolutionType | null;
  appealAllowed: boolean;
}>;

export const statusCopy: Readonly<Record<VerificationStatus, Readonly<{
  label: string; title: string; body: string;
}>>> = Object.freeze({
  pending: { label: 'PENDING REVIEW', title: 'Pending review', body: 'Your proof is queued for the first-pass checklist review.' },
  in_review: { label: 'IN REVIEW', title: 'In review', body: 'A reviewer is checking your proof against the fixed checklist.' },
  passed: { label: 'PASSED', title: 'Passed', body: 'This proof met the checklist. No further action is needed.' },
  needs_review: { label: 'NEEDS REVIEW', title: 'Needs review', body: 'A human reviewer did not approve this proof. You can appeal below.' },
  appealed: { label: 'APPEALED', title: 'Appeal under review', body: 'A different human reviewer will check the decision.' },
});
