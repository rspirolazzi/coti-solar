import { WizardShell } from '@/components/wizard/wizard-shell';

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <WizardShell>{children}</WizardShell>;
}
