import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// Custom icons for driver and customer
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMapProps {
  tripId: string;
  isDriver: boolean;
  driverName?: string;
  customerName?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ tripId, isDriver, driverName, customerName }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [customerLocation, setCustomerLocation] = useState<GeolocationPosition | null>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([33.9716, -6.8498], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update driver marker
  useEffect(() => {
    if (driverLocation && mapInstanceRef.current) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
      }
      
      driverMarkerRef.current = L.marker([driverLocation.latitude, driverLocation.longitude], { icon: driverIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>🚗 السائق</strong>
            ${driverName ? `<p>${driverName}</p>` : ''}
            <p style="font-size: 12px; color: #666;">
              آخر تحديث: ${new Date(driverLocation.updated_at).toLocaleTimeString('ar-MA')}
            </p>
          </div>
        `);
      
      // Center map on driver location
      mapInstanceRef.current.setView([driverLocation.latitude, driverLocation.longitude], 13);
    }
  }, [driverLocation, driverName]);

  // Update customer marker
  useEffect(() => {
    if (customerLocation && mapInstanceRef.current && !isDriver) {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.remove();
      }
      
      customerMarkerRef.current = L.marker([customerLocation.coords.latitude, customerLocation.coords.longitude], { icon: customerIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>👤 الزبون</strong>
            ${customerName ? `<p>${customerName}</p>` : ''}
            <p style="font-size: 12px; color: #666;">موقعك الحالي</p>
          </div>
        `);
    }
  }, [customerLocation, customerName, isDriver]);

  // Get current user's location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "تحديد الموقع غير متاح",
        description: "متصفحك لا يدعم تحديد الموقع",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation(position);
        if (isDriver) {
          updateDriverLocation(position.coords.latitude, position.coords.longitude);
        }
      },
      (error) => {
        toast({
          title: "خطأ في تحديد الموقع",
          description: "تعذر الحصول على موقعك الحالي",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Update driver location in database
  const updateDriverLocation = async (latitude: number, longitude: number) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get current user's profile
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile) return;

      // Upsert driver location
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: profile.id,
          trip_id: tripId,
          latitude,
          longitude,
        });

      if (error) {
        console.error('Error updating driver location:', error);
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  // Start location tracking for drivers
  const startLocationTracking = () => {
    if (!isDriver) return;

    setIsTrackingEnabled(true);
    getCurrentLocation();

    // Update location every 30 seconds
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateDriverLocation(position.coords.latitude, position.coords.longitude);
          },
          (error) => console.error('Location tracking error:', error),
          { enableHighAccuracy: true }
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  // Subscribe to driver location updates
  useEffect(() => {
    const channel = supabase
      .channel('driver-location-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newLocation = payload.new as any;
            setDriverLocation({
              latitude: Number(newLocation.latitude),
              longitude: Number(newLocation.longitude),
              updated_at: newLocation.updated_at,
            });
          }
        }
      )
      .subscribe();

    // Initial load of driver location
    const loadDriverLocation = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, updated_at')
        .eq('trip_id', tripId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setDriverLocation({
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          updated_at: data.updated_at,
        });
      }
    };

    loadDriverLocation();
    getCurrentLocation();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return (
    <div className="space-y-4">
      {isDriver && (
        <div className="flex items-center gap-2">
          <button
            onClick={isTrackingEnabled ? () => setIsTrackingEnabled(false) : startLocationTracking}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isTrackingEnabled 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isTrackingEnabled ? 'إيقاف تتبع الموقع' : 'بدء تتبع الموقع'}
          </button>
          {isTrackingEnabled && (
            <span className="text-sm text-muted-foreground">
              🔴 يتم تتبع موقعك حالياً
            </span>
          )}
        </div>
      )}

      <div 
        ref={mapRef}
        className="h-96 w-full rounded-lg overflow-hidden border"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <h5 className="font-arabic font-semibold">مفتاح الخريطة</h5>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-arabic">🚗 السائق</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-arabic">👤 الزبون</span>
          </div>
        </div>
        {!driverLocation && (
          <p className="mt-2 text-amber-600 text-sm font-arabic">
            ⏳ لم يتم تفعيل تتبع موقع السائق بعد
          </p>
        )}
        {driverLocation && (
          <p className="mt-2 text-green-600 text-sm font-arabic">
            ✅ تتبع الموقع المباشر نشط
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationMap;