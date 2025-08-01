-- Update bookings table RLS policy to allow passengers to update their own bookings
CREATE POLICY "Passengers can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.id = bookings.passenger_id
  )
);