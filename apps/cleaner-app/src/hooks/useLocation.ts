import { useState, useCallback, useRef } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface TrackingState {
  isTracking: boolean;
  withinRadius: boolean | null;
  graceRemaining: number | null;
  lastLogTime: string | null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingState>({
    isTracking: false,
    withinRadius: null,
    graceRemaining: null,
    lastLogTime: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingActiveRef = useRef(false);
  const locationRef = useRef<Location | null>(null);

  const getCurrentPosition = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          locationRef.current = loc;
          setError(null);
          resolve(loc);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied'
              : err.code === err.TIMEOUT
                ? 'Location request timed out'
                : 'Could not get location';
          setError(message);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    });
  }, []);

  const checkRadius = useCallback(
    (loc: Location, targetLat?: number, targetLng?: number, radius = 100): boolean => {
      if (targetLat == null || targetLng == null) return true;
      const dist = haversineDistance(loc.latitude, loc.longitude, targetLat, targetLng);
      return dist <= radius;
    },
    [],
  );

  const stopTracking = useCallback(() => {
    trackingActiveRef.current = false;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (logIntervalRef.current !== null) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
    setTracking({ isTracking: false, withinRadius: null, graceRemaining: null, lastLogTime: null });
  }, []);

  const startTracking = useCallback(
    async (
      assignmentId: string,
      serviceLat?: number,
      serviceLng?: number,
      onGraceExpired?: () => void,
    ) => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported');
        return;
      }

      stopTracking();
      trackingActiveRef.current = true;

      let graceSeconds = 0;
      const GRACE_LIMIT = 600;
      let alerted = false;

      const handlePosition = (loc: Location) => {
        if (!trackingActiveRef.current) return;
        setLocation(loc);
        locationRef.current = loc;
        const within = checkRadius(loc, serviceLat, serviceLng);

        setTracking((prev) => ({
          ...prev,
          isTracking: true,
          withinRadius: within,
          lastLogTime: new Date().toISOString(),
        }));

        if (!within && serviceLat != null && serviceLng != null) {
          graceSeconds++;
          if (graceSeconds >= GRACE_LIMIT && !alerted) {
            alerted = true;
            setTracking((prev) => ({ ...prev, graceRemaining: 0 }));
            onGraceExpired?.();
          }
          const remaining = Math.max(0, GRACE_LIMIT - graceSeconds);
          setTracking((prev) => ({ ...prev, graceRemaining: remaining }));
        } else {
          graceSeconds = 0;
          setTracking((prev) => ({ ...prev, graceRemaining: null }));
        }
      };

      const loc = await getCurrentPosition();
      handlePosition(loc);

      const { api } = await import('../services/api');
      await api.location.log({
        assignmentId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: new Date().toISOString(),
        isWithinRadius: true,
      });

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          handlePosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
      watchIdRef.current = watchId;

      logIntervalRef.current = setInterval(async () => {
        if (!trackingActiveRef.current) return;
        const currentLoc = locationRef.current;
        if (!currentLoc) return;
        try {
          const { api: apiMod } = await import('../services/api');
          const within = checkRadius(currentLoc, serviceLat, serviceLng);
          await apiMod.location.log({
            assignmentId,
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            accuracy: currentLoc.accuracy,
            timestamp: new Date().toISOString(),
            isWithinRadius: within,
          });
        } catch {}
      }, 300000);
    },
    [getCurrentPosition, checkRadius, stopTracking],
  );

  return {
    location,
    error,
    tracking,
    getCurrentPosition,
    startTracking,
    stopTracking,
  };
}
