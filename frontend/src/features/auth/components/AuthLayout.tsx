import { Link, Outlet, useLocation } from 'react-router-dom';
import { Check, BookOpen, GraduationCap, Award } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import logoPrimaryUrl from '../../../assets/logo-primary.png';

const LOGIN_BENEFITS = [
  'Track your progress across all enrolled courses',
  'Earn certificates recognized by top employers',
  'Learn from industry experts at your own pace',
];

const REGISTER_STEPS = [
  {
    Icon: BookOpen,
    title: 'Join as a learner',
    description: 'Create your free account and start exploring courses immediately.',
  },
  {
    Icon: GraduationCap,
    title: 'Build real skills',
    description: 'Complete courses at your own pace and earn verifiable certificates.',
  },
  {
    Icon: Award,
    title: 'Become an instructor',
    description: 'Request instructor access from your profile settings at any time.',
  },
];

function LoginPitch() {
  return (
    <>
      <h2 className="text-headline text-text-primary mb-3">New to Learnova?</h2>
      <p className="text-body-lg text-text-secondary mb-10">
        Join thousands of professionals building skills that matter.
      </p>
      <ul className="flex flex-col gap-lg mb-12">
        {LOGIN_BENEFITS.map(benefit => (
          <li key={benefit} className="flex items-start gap-3">
            <Check size={20} className="text-salem mt-0.5 shrink-0" aria-hidden="true" />
            <span className="text-body-lg text-text-primary">{benefit}</span>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto">
        <Link to="/register">Create a free account</Link>
      </Button>
    </>
  );
}

function RegisterPitch() {
  return (
    <>
      <h2 className="text-headline text-text-primary mb-3">Your path on Learnova</h2>
      <p className="text-body-lg text-text-secondary mb-10">
        Every journey starts with learning.
      </p>
      <ol className="flex flex-col gap-xl mb-12">
        {REGISTER_STEPS.map(({ Icon, title, description }, i) => (
          <li key={title} className="flex items-start gap-4">
            <span className="w-8 h-8 rounded-full bg-salem-50 text-salem flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={16} aria-hidden="true" />
            </span>
            <div>
              <p className="text-body font-semibold text-text-primary">
                <span className="text-text-muted mr-2 text-body-sm font-normal">{i + 1}.</span>
                {title}
              </p>
              <p className="text-body-sm text-text-secondary mt-xs">{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button variant="ghost" size="lg" asChild>
        <Link to="/login">Already a member? Sign in</Link>
      </Button>
    </>
  );
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname === '/register';

  return (
    <div className="relative min-h-screen flex">

      {/* Logo — centered at top, floats above both panels */}
      <div className="absolute inset-x-0 top-8 flex justify-center z-10">
        <Link to="/">
          <img
            src={logoPrimaryUrl}
            alt="Learnova"
            className="h-9 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Form panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center pt-24 pb-12 px-6 sm:px-10 bg-surface">
        <div
          key={pathname}
          className="motion-safe:animate-auth-enter w-full max-w-md"
        >
          <Outlet />
        </div>
      </div>

      {/* Value panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center pt-24 pb-12 px-6 sm:px-10 bg-surface-elevated">
        <div
          key={`${pathname}-pitch`}
          className="motion-safe:animate-auth-enter w-full max-w-md"
        >
          {isRegister ? <RegisterPitch /> : <LoginPitch />}
        </div>
      </div>

    </div>
  );
}
