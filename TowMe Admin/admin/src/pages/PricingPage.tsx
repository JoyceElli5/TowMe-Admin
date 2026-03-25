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
  History,
  CalendarClock,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { pricingApi } from '../lib/api';
import type { PricingConfig, PricingVersion } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/audit';

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
      className="glass-card p-6 hover:shadow-[0_18px_45px_rgba(15,23,42,0.16)] transition-shadow"
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
            <h3 className="text-gray-900 font-semibold text-lg">{pricing.vehicle_type}</h3>
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

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-dark-700/40 rounded-lg p-2">
          <p className="text-dark-400 text-xs">Service Fee</p>
          <p className="text-white text-sm font-medium">GHS {pricing.service_fee ?? 0}</p>
        </div>
        <div className="bg-dark-700/40 rounded-lg p-2">
          <p className="text-dark-400 text-xs">Surge x</p>
          <p className="text-white text-sm font-medium">{pricing.surge_multiplier ?? 1}</p>
        </div>
        <div className="bg-dark-700/40 rounded-lg p-2">
          <p className="text-dark-400 text-xs">Zone x</p>
          <p className="text-white text-sm font-medium">{pricing.zone_multiplier ?? 1}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-700">
        <p className="text-dark-400 text-sm">Example: 10 km trip</p>
        <p className="text-primary-500 font-semibold">
          GHS {(pricing.base_fee + pricing.per_km_rate * 10 + (pricing.service_fee ?? 0)) * (pricing.surge_multiplier ?? 1) * (pricing.zone_multiplier ?? 1)}
        </p>
        {pricing.effective_from && (
          <p className="text-dark-400 text-xs mt-2">
            Effective {new Date(pricing.effective_from).toLocaleString()}
          </p>
        )}
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
  const [serviceFee, setServiceFee] = useState(pricing?.service_fee || 0);
  const [surgeMultiplier, setSurgeMultiplier] = useState(pricing?.surge_multiplier || 1);
  const [zoneMultiplier, setZoneMultiplier] = useState(pricing?.zone_multiplier || 1);
  const [effectiveFromLocal, setEffectiveFromLocal] = useState('');
  const [isActive, setIsActive] = useState(pricing?.is_active ?? true);

  // Reset form when pricing changes
  useEffect(() => {
    if (pricing) {
      setBaseFee(pricing.base_fee);
      setPerKmRate(pricing.per_km_rate);
      setServiceFee(pricing.service_fee || 0);
      setSurgeMultiplier(pricing.surge_multiplier || 1);
      setZoneMultiplier(pricing.zone_multiplier || 1);
      const effective = pricing.effective_from ? new Date(pricing.effective_from) : new Date();
      setEffectiveFromLocal(new Date(effective.getTime() - effective.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setIsActive(pricing.is_active);
    }
  }, [pricing]);

  if (!pricing) return null;

  const Icon = vehicleIcons[pricing.vehicle_type] || Car;

  const handleSave = () => {
    const effectiveFromIso = effectiveFromLocal ? new Date(effectiveFromLocal).toISOString() : new Date().toISOString();

    onSave({
      base_fee: baseFee,
      per_km_rate: perKmRate,
      service_fee: serviceFee,
      surge_multiplier: surgeMultiplier,
      zone_multiplier: zoneMultiplier,
      effective_from: effectiveFromIso,
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
              <PriceInput label="Service Fee" value={serviceFee} onChange={setServiceFee} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark-400 text-sm mb-2">Surge Multiplier</label>
                  <input
                    type="number"
                    value={surgeMultiplier}
                    onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value) || 1)}
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-dark-400 text-sm mb-2">Zone Multiplier</label>
                  <input
                    type="number"
                    value={zoneMultiplier}
                    onChange={(e) => setZoneMultiplier(parseFloat(e.target.value) || 1)}
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-dark-400 text-sm mb-2">Effective From</label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="datetime-local"
                    value={effectiveFromLocal}
                    onChange={(e) => setEffectiveFromLocal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

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
                    <p className="text-white font-medium">GHS {(baseFee + perKmRate * 5 + serviceFee) * surgeMultiplier * zoneMultiplier}</p>
                  </div>
                  <div>
                    <p className="text-dark-500">10 km</p>
                    <p className="text-white font-medium">GHS {(baseFee + perKmRate * 10 + serviceFee) * surgeMultiplier * zoneMultiplier}</p>
                  </div>
                  <div>
                    <p className="text-dark-500">20 km</p>
                    <p className="text-white font-medium">GHS {(baseFee + perKmRate * 20 + serviceFee) * surgeMultiplier * zoneMultiplier}</p>
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

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManagePricing = hasPermission('pricing.manage');

  // Fetch pricing
  const { data: pricingList = [], isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: pricingApi.getAll,
  });

  const { data: pricingVersions = [] } = useQuery({
    queryKey: ['pricing-versions'],
    queryFn: () => pricingApi.getVersions(),
  });

  // Update pricing mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PricingConfig> }) =>
      pricingApi.update(id, data),
    onSuccess: async (_, variables) => {
      const pricingBefore = pricingList.find((item) => item.id === variables.id);

      await logAuditEvent({
        action: 'pricing.update',
        resourceType: 'pricing_rule',
        resourceId: variables.id,
        before: pricingBefore,
        after: variables.data,
        metadata: {
          source: 'admin-web',
        },
      });

      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-versions'] });
      setIsEditModalOpen(false);
      setSelectedPricing(null);
    },
  });

  const handleEdit = (pricing: PricingConfig) => {
    if (!canManagePricing) {
      return;
    }

    setSelectedPricing(pricing);
    setIsEditModalOpen(true);
  };

  const handleSave = (data: Partial<PricingConfig>) => {
    if (selectedPricing && canManagePricing) {
      updateMutation.mutate({ id: selectedPricing.id, data });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Pricing Configuration
          </h1>
          <p className="text-gray-500 mt-1">
            Manage pricing for different vehicle types
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-card border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-600 font-medium">How pricing works</p>
          <p className="text-sm mt-1 text-blue-700/80">
            The total price is calculated as: <span className="font-mono">Base Fee + (Per KM Rate × Distance)</span>
          </p>
        </div>
      </div>

      {/* Pricing Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading pricing...</p>
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

      {/* Version History */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">Pricing Version History</h3>
        </div>
        {pricingVersions.length === 0 ? (
          <p className="text-gray-500 text-sm">No pricing versions recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {pricingVersions.slice(0, 30).map((version: PricingVersion) => (
              <div key={version.id} className="rounded-xl bg-dark-700/40 p-3 border border-dark-600/50">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-medium">{version.vehicle_type}</p>
                  <span className="text-xs text-dark-300">{new Date(version.changed_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-dark-300 mt-1">
                  Base GHS {version.base_fee} | Per KM GHS {version.per_km_rate} | Service GHS {version.service_fee ?? 0} | Surge x{version.surge_multiplier ?? 1} | Zone x{version.zone_multiplier ?? 1}
                </p>
                <p className="text-xs text-dark-400 mt-1">
                  Effective from {new Date(version.effective_from).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
