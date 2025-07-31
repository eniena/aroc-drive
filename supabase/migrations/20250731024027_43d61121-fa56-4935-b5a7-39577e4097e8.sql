-- Create table for driver locations
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for driver locations
CREATE POLICY "Drivers can insert their own location" 
ON public.driver_locations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE users.user_id = auth.uid() 
  AND users.id = driver_locations.driver_id
));

CREATE POLICY "Drivers can update their own location" 
ON public.driver_locations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.user_id = auth.uid() 
  AND users.id = driver_locations.driver_id
));

CREATE POLICY "Trip participants can view driver location" 
ON public.driver_locations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM bookings b
  JOIN trips t ON b.trip_id = t.id
  JOIN users u ON u.user_id = auth.uid()
  WHERE t.id = driver_locations.trip_id
  AND (u.id = t.driver_id OR u.id = b.passenger_id)
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_driver_locations_updated_at
BEFORE UPDATE ON public.driver_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time updates for driver locations
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;