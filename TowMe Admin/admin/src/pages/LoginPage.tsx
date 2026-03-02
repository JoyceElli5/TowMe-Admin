import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Login form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

// Tow Truck SVG Component
const TowTruck = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Truck Body */}
    <rect x="80" y="35" width="70" height="35" rx="4" fill="#F5A623" />
    <rect x="130" y="25" width="35" height="45" rx="4" fill="#F5A623" />
    
    {/* Cabin Windows */}
    <rect x="135" y="30" width="25" height="15" rx="2" fill="#1a1b1e" />
    
    {/* Tow Arm */}
    <path d="M80 50 L30 50 L20 60" stroke="#F5A623" strokeWidth="6" strokeLinecap="round" />
    <path d="M20 60 L10 70" stroke="#F5A623" strokeWidth="4" strokeLinecap="round" />
    
    {/* Hook */}
    <circle cx="10" cy="75" r="5" fill="#d98b0a" />
    <path d="M10 70 L10 80 Q10 85 15 85" stroke="#d98b0a" strokeWidth="2" fill="none" />
    
    {/* Small Car on Tow */}
    <rect x="25" y="55" width="40" height="18" rx="4" fill="#4a4d55" />
    <rect x="35" y="50" width="20" height="10" rx="2" fill="#3d3f45" />
    
    {/* Car Wheels */}
    <circle cx="35" cy="73" r="6" fill="#1a1b1e" stroke="#3d3f45" strokeWidth="2" />
    <circle cx="55" cy="73" r="6" fill="#1a1b1e" stroke="#3d3f45" strokeWidth="2" />
    
    {/* Truck Wheels */}
    <circle cx="100" cy="73" r="10" fill="#1a1b1e" stroke="#3d3f45" strokeWidth="3" />
    <circle cx="100" cy="73" r="4" fill="#3d3f45" />
    <circle cx="150" cy="73" r="10" fill="#1a1b1e" stroke="#3d3f45" strokeWidth="3" />
    <circle cx="150" cy="73" r="4" fill="#3d3f45" />
    
    {/* Headlights */}
    <rect x="163" y="45" width="4" height="8" rx="1" fill="#fef7e6" />
    <ellipse cx="175" cy="49" rx="10" ry="5" fill="rgba(254, 247, 230, 0.3)" />
    
    {/* Details */}
    <rect x="85" y="40" width="15" height="8" rx="1" fill="#d98b0a" />
    <text x="88" y="47" fontSize="6" fill="#1a1b1e" fontWeight="bold">TOW</text>
  </svg>
);

// Road Animation
const RoadLines = () => (
  <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
    <div className="absolute bottom-4 left-0 right-0 h-1 bg-gray-300" />
    <motion.div
      className="absolute bottom-4 left-0 flex gap-8"
      animate={{ x: [0, -100] }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    >
      {[...Array(30)].map((_, i) => (
        <div key={i} className="w-12 h-1 bg-primary-500/50" />
      ))}
    </motion.div>
  </div>
);

// Pre-computed star positions for stable rendering
const starData = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: `${(i * 7 + 13) % 100}%`,
  top: `${(i * 11 + 5) % 60}%`,
  duration: 2 + (i % 5) * 0.4,
  delay: (i % 8) * 0.25,
}));

// Stars/particles in background
const Stars = () => (
  <div className="absolute inset-0 overflow-hidden">
    {starData.map((star) => (
      <motion.div
        key={star.id}
        className="absolute w-1 h-1 bg-primary-500/30 rounded-full"
        style={{
          left: star.left,
          top: star.top,
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: star.duration,
          delay: star.delay,
        }}
      />
    ))}
  </div>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'driving' | 'parked' | 'showForm'>('driving');
  const [error, setError] = useState<string | null>(null);
  const { signIn, loading: authLoading, adminUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('parked'), 2000);
    const timer2 = setTimeout(() => setAnimationPhase('showForm'), 2500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (adminUser) {
      navigate('/dashboard');
    }
  }, [adminUser, navigate]);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      setError(error.message || 'Invalid email or password');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Stars */}
      <Stars />
      
      {/* City Skyline Silhouette */}
      <div className="absolute bottom-16 left-0 right-0 h-32">
        <svg viewBox="0 0 1440 120" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,120 L0,80 L50,80 L50,60 L80,60 L80,80 L120,80 L120,40 L150,40 L150,80 L200,80 L200,50 L220,50 L220,30 L240,30 L240,50 L280,50 L280,80 L350,80 L350,45 L380,45 L380,80 L450,80 L450,60 L500,60 L500,20 L530,20 L530,60 L600,60 L600,80 L700,80 L700,35 L740,35 L740,80 L800,80 L800,55 L850,55 L850,80 L950,80 L950,25 L1000,25 L1000,80 L1100,80 L1100,50 L1150,50 L1150,80 L1250,80 L1250,40 L1300,40 L1300,80 L1440,80 L1440,120 Z"
            fill="#e5e7eb"
          />
        </svg>
      </div>
      
      {/* Road */}
      <RoadLines />
      
      {/* Tow Truck Animation */}
      <motion.div
        className="absolute bottom-8 w-64 h-32"
        initial={{ x: '-100vw' }}
        animate={{
          x: animationPhase === 'driving' ? '10vw' : 'calc(50vw - 300px)',
        }}
        transition={{
          duration: animationPhase === 'driving' ? 2 : 0.5,
          ease: animationPhase === 'driving' ? 'easeOut' : 'easeInOut',
        }}
      >
        <TowTruck className="w-full h-full" />
        
        {/* Headlight Glow */}
        <motion.div
          className="absolute right-0 top-1/2 w-32 h-8 bg-gradient-to-r from-yellow-200/20 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </motion.div>

      {/* Logo & Title */}
      <motion.div
        className="z-10 text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: animationPhase !== 'driving' ? 1 : 0, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-4"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Tow<span className="text-primary-500">Me</span>
          </h1>
        </motion.div>
        <p className="text-gray-500 text-lg">Admin Dashboard</p>
      </motion.div>

      {/* Login Form */}
      <AnimatePresence>
        {animationPhase === 'showForm' && (
          <motion.div
            className="z-10 w-full max-w-md px-6"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="glass-card p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500 mb-6">Sign in to access the admin panel</p>

              {error && (
                <motion.div
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-field"
                    placeholder="admin@towme.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="input-field pr-12"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-400 text-center text-sm">
                  Authorized personnel only
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.p
        className="absolute bottom-4 text-gray-400 text-sm z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: animationPhase === 'showForm' ? 1 : 0 }}
      >
        © 2024 TowMe. All rights reserved.
      </motion.p>
    </div>
  );
}
