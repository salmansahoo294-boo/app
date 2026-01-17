import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'register';
  
  const [mode, setMode] = useState(initialMode);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    full_name: '',
    referral_code: '',
    ageConfirmed: false,
  });

  const navigate = useNavigate();
  const { login, register, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password, isAdmin);
        if (result.success) {
          if (result.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/home');
          }
        }
      } else {
        // Registration validations
        if (!formData.ageConfirmed) {
          toast.error('You must be 18+ to register');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const registerData = {
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          full_name: formData.full_name || null,
          referral_code: formData.referral_code || null,
        };

        const result = await register(registerData);
        if (result.success) {
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-white"
          data-testid="back-to-home-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-8">
          <h1 className="font-primary font-bold text-3xl text-white mb-2" data-testid="auth-title">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 mb-6">
            {mode === 'login' ? 'Login to your WINPKRHUB account' : 'Join WINPKRHUB and start winning'}
          </p>

          {/* Admin Toggle */}
          {mode === 'login' && (
            <div className="flex items-center space-x-2 mb-6 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
              <Checkbox
                id="admin-mode"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
                data-testid="admin-mode-checkbox"
              />
              <label htmlFor="admin-mode" className="text-gold-500 text-sm font-medium cursor-pointer">
                Admin Login
              </label>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">Full Name (Optional)</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50"
                  placeholder="Enter your name"
                  data-testid="input-full-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50"
                placeholder="your@email.com"
                data-testid="input-email"
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50"
                  placeholder="03XX-XXXXXXX"
                  data-testid="input-phone"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50"
                placeholder="Enter password"
                data-testid="input-password"
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50"
                    placeholder="Confirm password"
                    data-testid="input-confirm-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral_code" className="text-white">Referral Code (Optional)</Label>
                  <Input
                    id="referral_code"
                    name="referral_code"
                    type="text"
                    value={formData.referral_code}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50"
                    placeholder="Enter referral code"
                    data-testid="input-referral-code"
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <Checkbox
                    id="age-confirm"
                    checked={formData.ageConfirmed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ageConfirmed: checked }))}
                    required
                    data-testid="age-confirm-checkbox"
                  />
                  <label htmlFor="age-confirm" className="text-red-300 text-sm cursor-pointer">
                    I confirm that I am 18 years or older
                  </label>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-wider py-6 text-base"
              data-testid="submit-btn"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gold-500 hover:text-gold-400 text-sm"
              data-testid="toggle-mode-btn"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
