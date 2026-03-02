import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit2,
  Save,
  X,
  Car,
  Truck,
  Bike,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { pricingApi } from '../lib/api';
import type { PricingConfig } from '../types';

// Vehicle icon mapping
const vehicleIcons: Record<string, React.ElementType> = {
  Motorcycle: Bike,
  Saloon: Car,
  SUV: Car,
  Van: Truck,
  Truck: Truck,
};

// Price input component
const PriceInput = ({
  label,
  value,
  onChange,
  prefix = 'GHS',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}) => (
  <div>
    <label className="block text-dark-400 text-sm mb-2">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">{prefix}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min="0"
        step="0.5"
        className="w-full pl-14 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
      />
    </div>
  </div>
);

// Pricing card component
const PricingCard = ({
  pricing,
  onEdit,
}: {
  pricing: PricingConfig;
  onEdit: (pricing: PricingConfig) => void;
}) => {
  const Icon = vehicleIcons[pricing.vehicle_type] || Car;

  return (
    <motion.div
      className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{pricing.vehicle_type}</h3>
            {pricing.is_active ? (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active
              </span>
            ) : (
              <span className="text-dark-400 text-sm flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Inactive
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onEdit(pricing)}
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-400 hover:text-white"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-700/50 rounded-xl p-4">
          <p className="text-dark-400 text-sm mb-1">Base Fee</p>
          <p className="text-white font-semibold text-xl">GHS {pricing.base_fee}</p>
        </div>
        <div className="bg-dark-700/50 rounded-xl p-4">
          <p className="text-dark-400 text-sm mb-1">Per KM Rate</p>
          <p className="text-white font-semibold text-xl">GHS {pricing.per_km_rate}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-700">
        <p className="text-dark-400 text-sm">Example: 10 km trip</p>
        <p className="text-primary-500 font-semibold">
          GHS {pricing.base_fee + pricing.per_km_rate * 10}
        </p>
      </div>
    </motion.div>
  );
};

// Edit pricing modal
const EditPricingModal = ({
  isOpen,
  onClose,
  pricing,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  pricing: PricingConfig | null;
  onSave: (data: Partial<PricingConfig>) => void;
  isLoading: boolean;
}) => {
  const [baseFee, setBaseFee] = useState(pricing?.base_fee || 0);
  const [perKmRate, setPerKmRate] = useState(pricing?.per_km_rate || 0);
  const [isActive, setIsActive] = useState(pricing?.is_active ?? true);

  // Reset form when pricing changes
  useEffect(() => {
    if (pricing) {
      setBaseFee(pricing.base_fee);
      setPerKmRate(pricing.per_km_rate);
      setIsActive(pricing.is_active);
    }
  }, [pricing]);

  if (!pricing) return null;

  const Icon = vehicleIcons[pricing.vehicle_type] || Car;

  const handleSave = () => {
    onSave({
      base_fee: baseFee,
      per_km_rate: perKmRate,
      is_active: isActive,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            className="relative bg-dark-800 rounded-2xl w-full max-w-md mx-4 p-6"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit Pricing</h2>
                  <p className="text-dark-400 text-sm">{pricing.vehicle_type}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <PriceInput label="Base Fee" value={baseFee} onChange={setBaseFee} />
              <PriceInput label="Per KM Rate" value={perKmRate} onChange={setPerKmRate} />

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-3">
                <span className="text-white">Active</span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    isActive ? 'bg-primary-500' : 'bg-dark-600'
                  )}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    animate={{ left: isActive ? '1.5rem' : '0.25rem' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Preview */}
              <div className="bg-dark-700/50 rounded-xl p-4">
                <p className="text-dark-400 text-sm mb-2">Price Preview</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-dark-500">5 km</p>
                    <p className="text-white font-medium">GHS {baseFee + perKmRate * 5}</p>
                  </div>
                  <div>
                    <p className="text-dark-500">10 km</p>
                    <p className="text-white font-medium">GHS {baseFee + perKmRate * 10}</p>
                  </div>
                  <div>
                    <p className="text-dark-500">20 km</p>
                    <p className="text-white font-medium">GHS {baseFee + perKmRate * 20}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-dark-700 text-white font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-dark-900 font-medium hover:bg-primary-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function PricingPage() {
  const [selectedPricing, setSelectedPricing] = useState<PricingConfig | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch pricing
  const { data: pricingList = [], isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: pricingApi.getAll,
  });

  // Update pricing mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PricingConfig> }) =>
      pricingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setIsEditModalOpen(false);
      setSelectedPricing(null);
    },
  });

  const handleEdit = (pricing: PricingConfig) => {
    setSelectedPricing(pricing);
    setIsEditModalOpen(true);
  };

  const handleSave = (data: Partial<PricingConfig>) => {
    if (selectedPricing) {
      updateMutation.mutate({ id: selectedPricing.id, data });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing Configuration</h1>
          <p className="text-dark-400 mt-1">
            Manage pricing for different vehicle types
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-medium">How pricing works</p>
          <p className="text-blue-300/70 text-sm mt-1">
            The total price is calculated as: <span className="font-mono">Base Fee + (Per KM Rate × Distance)</span>
          </p>
        </div>
      </div>

      {/* Pricing Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading pricing...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingList.map((pricing) => (
            <PricingCard key={pricing.id} pricing={pricing} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditPricingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPricing(null);
        }}
        pricing={selectedPricing}
        onSave={handleSave}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
