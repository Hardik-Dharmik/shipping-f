import { api } from '../services/api';

const unavailable = () => Promise.reject(new Error('Pickup scheduling is not available for this carrier yet.'));
const fedexPayload = (payload) => ({
  awbNumber: payload.awbNumber,
  carrier: 'FedEx',
  countryCode: payload.countryCode || payload.country,
  pickupDate: payload.pickupDate,
  readyTime: payload.readyTime,
  closingTime: payload.closingTime,
  packageCount: payload.packageCount,
  totalWeight: payload.totalWeight,
  packageLocation: payload.packageLocation,
  remarks: payload.remarks,
  ...(payload.pickupAddressMode === 'alternate' && payload.alternatePickupAddress ? { alternatePickupAddress: payload.alternatePickupAddress } : {}),
});

// Carrier-specific API contracts are intentionally isolated here.
export const pickupActions = {
  fedex: {
    schedule: (payload) => api.createPickup(fedexPayload(payload)),
    edit: (pickupId, payload) => api.updatePickup(pickupId, fedexPayload(payload)),
    cancel: (pickupId) => api.cancelPickup(pickupId),
  },
  ups: { schedule: unavailable, edit: unavailable, cancel: unavailable },
  dhl: { schedule: unavailable, edit: unavailable, cancel: unavailable },
};

export const carrierKey = (carrier = '') => String(carrier).trim().toLowerCase();
export const isPickupAvailable = (carrier) => carrierKey(carrier) === 'fedex';
