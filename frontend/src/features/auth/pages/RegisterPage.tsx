import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { registerUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Input, FormField } from '../../../components/ui/Input';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.length > 150) {
      errors.fullName = 'Name must be 150 characters or fewer.';
    }
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { token, user } = await registerUser(fullName.trim(), email.trim(), password);
      login(token, user);
      navigate('/');
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setFieldErrors({ email: 'An account with this email already exists.' });
        } else if (status === 400) {
          setFormError('Please check your information and try again.');
        } else {
          setFormError('Something went wrong. Please try again.');
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-headline text-text-primary mb-2">Create your account</h1>
        <p className="text-body-lg text-text-secondary">Start learning for free today.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-xl">

        <FormField label="Full name" htmlFor="fullName" error={fieldErrors.fullName}>
          <Input
            id="fullName"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            autoComplete="name"
            hasError={!!fieldErrors.fullName}
            required
          />
        </FormField>

        <FormField label="Email address" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            hasError={!!fieldErrors.email}
            required
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={fieldErrors.password}
          hint={!fieldErrors.password ? 'Minimum 8 characters' : undefined}
        >
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            hasError={!!fieldErrors.password}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="text-text-muted hover:text-text-secondary transition-colors duration-fast"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </FormField>

        {formError && (
          <p className="text-body-sm text-error -mt-sm" role="alert">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          Create account
        </Button>
      </form>

      <p className="mt-10 text-body text-text-secondary">
        Already a member?{' '}
        <Link
          to="/login"
          className="text-salem font-medium hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
