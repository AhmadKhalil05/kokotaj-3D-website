import { useState } from 'preact/hooks';

export type DeviceType = 'desktop' | 'mobile';

interface DeviceTypeOptions {
  mobileBreakpoint?: number;
}

/**
  * Custom hook to detect and track device type based on screen width.
  * Locks the device type on page load to prevent double-fetching assets on resize.
  */
export function useDeviceType(_options: DeviceTypeOptions = {}): DeviceType {

  const [deviceType] = useState<DeviceType>(() => {
    return 'desktop'; // Forced to desktop for now
  });

  return deviceType;
}

