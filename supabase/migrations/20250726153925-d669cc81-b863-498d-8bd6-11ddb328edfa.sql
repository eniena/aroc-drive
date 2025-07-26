-- Create booking_status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  seats_booked INTEGER NOT NULL DEFAULT 1,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND (users.id = bookings.passenger_id OR users.id IN (
      SELECT trips.driver_id FROM trips WHERE trips.id = bookings.trip_id
    ))
  )
);

CREATE POLICY "Passengers can insert their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.id = bookings.passenger_id
  )
);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND (users.id = bookings.passenger_id OR users.id IN (
      SELECT trips.driver_id FROM trips WHERE trips.id = bookings.trip_id
    ))
  )
);

-- Create function to automatically update trip seats when bookings change
CREATE OR REPLACE FUNCTION public.update_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trips 
    SET available_seats = available_seats - NEW.seats_booked
    WHERE id = NEW.trip_id;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from confirmed to cancelled, add seats back
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.trips 
      SET available_seats = available_seats + OLD.seats_booked
      WHERE id = OLD.trip_id;
    -- If status changed from pending/cancelled to confirmed, remove seats
    ELSIF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE public.trips 
      SET available_seats = available_seats - NEW.seats_booked
      WHERE id = NEW.trip_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'confirmed' THEN
      UPDATE public.trips 
      SET available_seats = available_seats + OLD.seats_booked
      WHERE id = OLD.trip_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic seat management
CREATE TRIGGER update_trip_seats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_seats();