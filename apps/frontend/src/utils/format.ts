export const formatPrice = (amount: number) => {
  // Prices are stored in the smallest currency unit (e.g. cents).
  // Convert to major units for display.
  const majorUnits = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(majorUnits);
};

export const formatDuration = (ms: number | null) => {
  if (ms === null || ms < 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
};

export const getDiscountPercentage = (original: number, sale: number) => {
  return Math.round(((original - sale) / original) * 100);
};
