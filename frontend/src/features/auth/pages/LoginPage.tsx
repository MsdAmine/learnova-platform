import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { loginUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Input, FormField } from '../../../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const { token, user } = await loginUser(email, password);
      login(token, user);
      navigate('/');
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setFormError('Incorrect email or password.');
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
        <h1 className="text-headline text-text-primary mb-2">Welcome back</h1>
        <p className="text-body-lg text-text-secondary">Sign in to continue learning.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-xl">

        <FormField label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FormField>

        <div className="flex flex-col gap-xs">
          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
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
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-body-sm text-salem hover:underline focus-visible:outline-none focus-visible:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

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
          Sign in
        </Button>
      </form>

      <p className="mt-10 text-body text-text-secondary">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-salem font-medium hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Create one free
        </Link>
      </p>
    </>
  );
}
