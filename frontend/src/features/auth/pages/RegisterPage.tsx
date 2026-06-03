import { useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { registerUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Input, FormField } from '../../../components/ui/Input';

type RegisterState = {
  fullName: string;
  email: string;
  password: string;
  isSubmitting: boolean;
  formError: string | null;
  fieldErrors: Record<string, string>;
};

type RegisterAction =
  | { type: 'SET_FIELD'; field: 'fullName' | 'email' | 'password'; value: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_FIELD_ERRORS'; errors: Record<string, string> }
  | { type: 'SUBMIT_END' };

function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case 'SET_FIELD':        return { ...state, [action.field]: action.value };
    case 'SUBMIT_START':     return { ...state, formError: null, fieldErrors: {}, isSubmitting: true };
    case 'SET_ERROR':        return { ...state, formError: action.error };
    case 'SET_FIELD_ERRORS': return { ...state, fieldErrors: action.errors };
    case 'SUBMIT_END':       return { ...state, isSubmitting: false };
    default:                 return state;
  }
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [{ fullName, email, password, isSubmitting, formError, fieldErrors }, dispatch] = useReducer(registerReducer, {
    fullName: '',
    email: '',
    password: '',
    isSubmitting: false,
    formError: null,
    fieldErrors: {},
  });
  const [showPassword, setShowPassword] = useState(false);

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
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_FIELD_ERRORS', errors });
      return;
    }
    dispatch({ type: 'SUBMIT_START' });

    try {
      const { token, user } = await registerUser(fullName.trim(), email.trim(), password);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          dispatch({ type: 'SET_FIELD_ERRORS', errors: { email: 'An account with this email already exists.' } });
        } else if (status === 400) {
          dispatch({ type: 'SET_ERROR', error: 'Please check your information and try again.' });
        } else {
          dispatch({ type: 'SET_ERROR', error: 'Something went wrong. Please try again.' });
        }
      } else {
        dispatch({ type: 'SET_ERROR', error: 'Something went wrong. Please try again.' });
      }
    } finally {
      dispatch({ type: 'SUBMIT_END' });
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
            onChange={e => dispatch({ type: 'SET_FIELD', field: 'fullName', value: e.target.value })}
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
            onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
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
            onChange={e => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
            autoComplete="new-password"
            hasError={!!fieldErrors.password}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="size-11 flex items-center justify-center rounded text-text-muted hover:text-text-secondary transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salem focus-visible:ring-offset-1"
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
          className="text-salem font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem focus-visible:rounded-sm"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
