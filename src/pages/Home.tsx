import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Calendar, User, Car, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { moroccanCities } from '@/data/moroccanCities';
import { toast } from '@/hooks/use-toast';
import heroImage from '@/assets/hero-morocco.jpg';

interface Trip {
  id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  total_seats: number;
  car_model?: string;
  notes?: string;
  users?: {
    name: string;
    rating?: number;
  };
}

export default function Home() {
  const { user } = useAuth();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchTrips = async () => {
    if (!fromCity || !toCity || !date) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول للبحث",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          users:driver_id (
            name,
            rating
          )
        `)
        .eq('from_location', fromCity)
        .eq('to_location', toCity)
        .gte('departure_time', `${date}T00:00:00`)
        .lt('departure_time', `${date}T23:59:59`)
        .gt('available_seats', 0)
        .order('departure_time', { ascending: true });

      if (error) throw error;

      setTrips(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "لا توجد رحلات",
          description: "لا توجد رحلات متاحة للمسار والتاريخ المحددين",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في البحث",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ar-MA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('ar-MA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-arabic">تشاركي</h1>
          <p className="text-lg md:text-xl font-arabic">شارك رحلتك عبر المغرب بأمان وراحة</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto card-moroccan">
          <CardHeader>
            <CardTitle className="text-center font-arabic text-xl">ابحث عن رحلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="font-arabic">من</Label>
                <Select value={fromCity} onValueChange={setFromCity}>
                  <SelectTrigger className="font-arabic">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {moroccanCities.map((city) => (
                      <SelectItem key={city} value={city} className="font-arabic">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-arabic">إلى</Label>
                <Select value={toCity} onValueChange={setToCity}>
                  <SelectTrigger className="font-arabic">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {moroccanCities.map((city) => (
                      <SelectItem key={city} value={city} className="font-arabic">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-arabic">التاريخ</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="font-arabic"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={searchTrips} 
                  disabled={loading || !user}
                  variant="moroccan" 
                  className="w-full font-arabic"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'جاري البحث...' : 'بحث'}
                </Button>
              </div>
            </div>

            {!user && (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground font-arabic text-sm">
                  يجب تسجيل الدخول للبحث عن الرحلات
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searching && (
          <div className="mt-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 font-arabic">نتائج البحث</h2>
            
            {trips.length === 0 && !loading ? (
              <Card className="card-moroccan">
                <CardContent className="text-center py-12">
                  <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 font-arabic">لا توجد رحلات متاحة</h3>
                  <p className="text-muted-foreground font-arabic">
                    لم نجد أي رحلات متاحة للمسار والتاريخ المحددين
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <Card key={trip.id} className="card-moroccan">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-semibold font-arabic">
                              {trip.from_location} ← {trip.to_location}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span className="font-arabic">{formatDate(trip.departure_time)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-arabic">{formatTime(trip.departure_time)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span className="font-arabic">{trip.users?.name}</span>
                            </div>
                          </div>

                          {trip.car_model && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                              <Car className="h-4 w-4" />
                              <span className="font-arabic">{trip.car_model}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span className="font-arabic">{trip.available_seats} مقاعد متاحة</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="text-lg font-bold text-primary font-arabic">
                                {trip.price_per_seat} درهم
                              </span>
                            </div>
                          </div>

                          <Button variant="moroccan" className="font-arabic">
                            احجز الآن
                          </Button>
                        </div>
                      </div>

                      {trip.notes && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground font-arabic">
                            <strong>ملاحظات:</strong> {trip.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}