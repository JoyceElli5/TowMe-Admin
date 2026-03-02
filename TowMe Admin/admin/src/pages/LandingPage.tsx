import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center cursor-pointer overflow-hidden transition-colors duration-300"
      onClick={handleEnter}
    >
      {/* Subtle mint/green background accent */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-100 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2
          }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary-300 to-primary-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-200/40">
            <Truck className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* TowMe Text */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-5xl font-bold text-primary-700 mb-3"
        >
          Tow<span className="text-primary-500">Me</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-primary-400 text-lg mb-12"
        >
          Admin Dashboard
        </motion.p>

        {/* Click to continue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-primary-300 text-sm"
          >
            Click anywhere to continue
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
