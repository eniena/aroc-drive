import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Calendar, Clock, Users, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Trip {
  id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  total_seats: number;
  car_model?: string;
  car_plate?: string;
  notes?: string;
  created_at: string;
}

export default function MyTrips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyTrips();
    }
  }, [user]);

  const fetchMyTrips = async () => {
    if (!user) return;

    try {
      // Get the user's internal ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('لم نتمكن من العثور على بيانات المستخدم');
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', userData.id)
        .order('departure_time', { ascending: true });

      if (error) throw error;

      setTrips(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الرحلات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "تم حذف الرحلة",
        description: "تم حذف الرحلة بنجاح",
      });

      // Refresh the trips list
      fetchMyTrips();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الرحلة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('ar-MA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('ar-MA', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const isPastTrip = (datetime: string) => {
    return new Date(datetime) < new Date();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md card-moroccan">
          <CardContent className="text-center py-12">
            <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-arabic">تسجيل الدخول مطلوب</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              يجب تسجيل الدخول لعرض رحلاتك
            </p>
            <Button onClick={() => navigate('/auth')} variant="moroccan" className="font-arabic">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
          <p className="text-lg font-arabic">جاري تحميل رحلاتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold font-arabic">رحلاتي</h1>
            <Button onClick={() => navigate('/add-trip')} variant="moroccan" className="font-arabic">
              <Plus className="mr-2 h-4 w-4" />
              إضافة رحلة جديدة
            </Button>
          </div>

          {trips.length === 0 ? (
            <Card className="card-moroccan">
              <CardContent className="text-center py-12">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 font-arabic">لا توجد رحلات</h3>
                <p className="text-muted-foreground font-arabic mb-4">
                  لم تقم بإضافة أي رحلات بعد
                </p>
                <Button onClick={() => navigate('/add-trip')} variant="moroccan" className="font-arabic">
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة رحلة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const { date, time } = formatDateTime(trip.departure_time);
                const isExpired = isPastTrip(trip.departure_time);

                return (
                  <Card key={trip.id} className="card-moroccan">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-semibold font-arabic text-lg">
                              {trip.from_location} ← {trip.to_location}
                            </span>
                            {isExpired && (
                              <Badge variant="secondary" className="font-arabic">
                                منتهية
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span className="font-arabic">{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-arabic">{time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="font-arabic">
                                {trip.available_seats} من {trip.total_seats} متاح
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-arabic">{trip.price_per_seat} درهم</span>
                            </div>
                          </div>

                          {trip.car_model && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                              <Car className="h-4 w-4" />
                              <span className="font-arabic">{trip.car_model}</span>
                              {trip.car_plate && (
                                <span className="font-arabic">- {trip.car_plate}</span>
                              )}
                            </div>
                          )}

                          {trip.notes && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-sm text-muted-foreground font-arabic">
                                <strong>ملاحظات:</strong> {trip.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edit-trip/${trip.id}`)}
                            className="font-arabic"
                            disabled={isExpired}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            تعديل
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTrip(trip.id)}
                            className="font-arabic"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}