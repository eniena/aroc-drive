import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, User, Edit, Trash2, MessageCircle, Map } from 'lucide-react';
import LocationMap from './LocationMap';
import { useNavigate } from 'react-router-dom';

interface BookingCardProps {
  booking: {
    id: string;
    trip_id: string;
    status: string;
    seats_booked: number;
    created_at: string;
    trips: {
      id: string;
      from_location: string;
      to_location: string;
      departure_time: string;
      price_per_seat: number;
      status?: string;
      users: {
        id: string;
        name: string;
      };
    };
  };
  customerName?: string;
  onCancel: (bookingId: string) => void;
  onUpdate: (bookingId: string, seats: number) => void;
}

export default function BookingCard({ booking, customerName, onCancel, onUpdate }: BookingCardProps) {
  const navigate = useNavigate();
  const [editingBooking, setEditingBooking] = useState(false);
  const [editSeats, setEditSeats] = useState(booking.seats_booked);
  const [showLocationMap, setShowLocationMap] = useState(false);

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('ar-MA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ar-MA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOngoingTrip = () => {
    return booking.trips.status === 'en cours';
  };

  const isPastTrip = () => {
    return new Date(booking.trips.departure_time) < new Date();
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold font-arabic">
              {booking.trips.from_location} ← {booking.trips.to_location}
            </span>
            {isOngoingTrip() && (
              <Badge variant="default" className="font-arabic bg-green-500">
                جارية
              </Badge>
            )}
            {isPastTrip() && (
              <Badge variant="outline" className="font-arabic">
                منتهية
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="font-arabic">{formatDateTime(booking.trips.departure_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="font-arabic">{formatTime(booking.trips.departure_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="font-arabic">{booking.trips.users.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-bold text-primary font-arabic">
              {booking.seats_booked * booking.trips.price_per_seat} درهم
            </span>
            <span className="text-sm text-muted-foreground font-arabic">
              ({booking.seats_booked} {booking.seats_booked === 1 ? 'مقعد' : 'مقاعد'})
            </span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {isOngoingTrip() && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationMap(!showLocationMap)}
                className="font-arabic"
              >
                <Map className="mr-2 h-4 w-4" />
                {showLocationMap ? 'إخفاء' : 'خريطة'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/chat/${booking.id}`)}
                className="font-arabic"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                محادثة
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            {!isPastTrip() && (
              <Dialog open={editingBooking} onOpenChange={setEditingBooking}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-arabic"
                    onClick={() => setEditSeats(booking.seats_booked)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    تعديل
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-arabic text-center">
                      تعديل الحجز
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <p className="font-arabic text-sm text-muted-foreground">
                        {booking.trips.from_location} ← {booking.trips.to_location}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-arabic">عدد المقاعد</Label>
                      <Select 
                        value={editSeats.toString()} 
                        onValueChange={(value) => setEditSeats(parseInt(value))}
                      >
                        <SelectTrigger className="font-arabic">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 4}, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()} className="font-arabic">
                              {i + 1} {i === 0 ? 'مقعد' : 'مقاعد'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="font-arabic text-sm text-muted-foreground">إجمالي السعر الجديد</p>
                      <p className="font-arabic text-xl font-bold text-primary">
                        {editSeats * booking.trips.price_per_seat} درهم
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 font-arabic"
                        onClick={() => setEditingBooking(false)}
                      >
                        إلغاء
                      </Button>
                      <Button 
                        variant="moroccan" 
                        className="flex-1 font-arabic"
                        onClick={() => {
                          onUpdate(booking.id, editSeats);
                          setEditingBooking(false);
                        }}
                      >
                        حفظ التغييرات
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking.id)}
              className="font-arabic text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </div>
      </div>
      
      {/* Location Map */}
      {showLocationMap && isOngoingTrip() && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="font-semibold mb-2 font-arabic">تتبع موقع السائق</h4>
          <LocationMap
            tripId={booking.trips.id}
            isDriver={false}
            driverName={booking.trips.users.name}
            customerName={customerName}
          />
        </div>
      )}
    </div>
  );
}