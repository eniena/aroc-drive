import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Star, Phone, Calendar, Car, Users, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: 'driver' | 'passenger';
  rating: number;
  total_ratings: number;
  created_at: string;
}

interface Trip {
  id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  price_per_seat: number;
  total_seats: number;
  available_seats: number;
  role: 'driver' | 'passenger';
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && currentUser) {
      fetchUserProfile();
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    if (!userId || !currentUser) return;

    try {
      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        throw new Error('لم نتمكن من العثور على الملف الشخصي');
      }

      setProfile(userProfile);

      // Fetch trips as driver
      const { data: driverTrips, error: driverError } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', userId)
        .order('departure_time', { ascending: false })
        .limit(10);

      // Fetch trips as passenger
      const { data: passengerBookings, error: passengerError } = await supabase
        .from('bookings')
        .select(`
          trip_id,
          trips (
            id,
            from_location,
            to_location,
            departure_time,
            price_per_seat,
            total_seats,
            available_seats
          )
        `)
        .eq('passenger_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const allTrips: Trip[] = [];

      if (driverTrips && !driverError) {
        allTrips.push(...driverTrips.map(trip => ({ ...trip, role: 'driver' as const })));
      }

      if (passengerBookings && !passengerError) {
        const passengerTrips = passengerBookings
          .filter(booking => booking.trips)
          .map(booking => ({
            ...booking.trips,
            role: 'passenger' as const
          }));
        allTrips.push(...passengerTrips);
      }

      // Sort all trips by departure time
      allTrips.sort((a, b) => new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime());

      setTrips(allTrips);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الملف الشخصي",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('ar-MA', {
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md card-moroccan">
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-arabic">تسجيل الدخول مطلوب</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              يجب تسجيل الدخول لعرض الملفات الشخصية
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
          <User className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
          <p className="text-lg font-arabic">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md card-moroccan">
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-arabic">المستخدم غير موجود</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              لم نتمكن من العثور على هذا المستخدم
            </p>
            <Button onClick={() => navigate('/')} variant="moroccan" className="font-arabic">
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="font-arabic"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="card-moroccan mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl font-arabic">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-right">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h1 className="text-2xl font-bold font-arabic">{profile.name}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Badge variant={profile.user_type === 'driver' ? 'default' : 'secondary'} className="font-arabic">
                      {profile.user_type === 'driver' ? 'سائق' : 'راكب'}
                    </Badge>
                    {profile.total_ratings > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-arabic">
                          {profile.rating.toFixed(1)} ({profile.total_ratings})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {profile.phone && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-arabic">{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-arabic">
                      عضو منذ {new Date(profile.created_at).toLocaleDateString('ar-MA', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex justify-center md:justify-start gap-3 mt-4">
                  {profile.phone && (
                    <Button variant="outline" size="sm" className="font-arabic">
                      <Phone className="ml-2 h-4 w-4" />
                      اتصال
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="font-arabic">
                    <MessageCircle className="ml-2 h-4 w-4" />
                    رسالة
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip History */}
        <Card className="card-moroccan">
          <CardHeader>
            <CardTitle className="font-arabic flex items-center gap-2">
              <Car className="h-5 w-5" />
              سجل الرحلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground font-arabic">لا توجد رحلات في السجل</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip, index) => {
                  const { date, time } = formatDateTime(trip.departure_time);
                  const isExpired = isPastTrip(trip.departure_time);

                  return (
                    <div key={`${trip.id}-${index}`}>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {trip.role === 'driver' ? (
                                <Car className="h-4 w-4 text-primary" />
                              ) : (
                                <Users className="h-4 w-4 text-secondary" />
                              )}
                              <span className="font-semibold font-arabic text-lg">
                                {trip.from_location} ← {trip.to_location}
                              </span>
                            </div>
                            <Badge variant={trip.role === 'driver' ? 'default' : 'secondary'} className="font-arabic">
                              {trip.role === 'driver' ? 'سائق' : 'راكب'}
                            </Badge>
                            {isExpired && (
                              <Badge variant="outline" className="font-arabic">
                                منتهية
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span className="font-arabic">{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-arabic">{time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-arabic">{trip.price_per_seat} درهم</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < trips.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}