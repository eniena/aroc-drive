import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Car, MapPin, Calendar, Clock, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { moroccanCities } from '@/data/moroccanCities';
import { toast } from '@/hooks/use-toast';

export default function EditTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    from_location: '',
    to_location: '',
    departure_date: '',
    departure_time: '',
    price_per_seat: '',
    total_seats: '',
    car_model: '',
    car_plate: '',
    notes: '',
    gender_preference: 'any' as 'any' | 'men' | 'women'
  });
  
  const [loading, setLoading] = useState(false);
  const [tripLoading, setTripLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchTripData();
    }
  }, [id, user]);

  const fetchTripData = async () => {
    if (!user || !id) return;

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

      const { data: trip, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .eq('driver_id', userData.id)
        .single();

      if (error) throw error;

      if (!trip) {
        toast({
          title: "خطأ",
          description: "لم نتمكن من العثور على هذه الرحلة",
          variant: "destructive",
        });
        navigate('/my-trips');
        return;
      }

      // Parse the departure_time to get date and time
      const departureDate = new Date(trip.departure_time);
      const date = departureDate.toISOString().split('T')[0];
      const time = departureDate.toISOString().split('T')[1].substring(0, 5);

      setFormData({
        from_location: trip.from_location,
        to_location: trip.to_location,
        departure_date: date,
        departure_time: time,
        price_per_seat: trip.price_per_seat.toString(),
        total_seats: trip.total_seats.toString(),
        car_model: trip.car_model || '',
        car_plate: trip.car_plate || '',
        notes: trip.notes || '',
        gender_preference: trip.gender_preference
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل بيانات الرحلة",
        description: error.message,
        variant: "destructive",
      });
      navigate('/my-trips');
    } finally {
      setTripLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لتعديل الرحلة",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.from_location || !formData.to_location || !formData.departure_date || 
        !formData.departure_time || !formData.price_per_seat || !formData.total_seats) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (formData.from_location === formData.to_location) {
      toast({
        title: "خطأ في البيانات",
        description: "لا يمكن أن تكون مدينة المغادرة والوصول نفسها",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const departureDateTime = `${formData.departure_date}T${formData.departure_time}:00`;

      const tripData = {
        from_location: formData.from_location,
        to_location: formData.to_location,
        departure_time: departureDateTime,
        price_per_seat: parseFloat(formData.price_per_seat),
        total_seats: parseInt(formData.total_seats),
        car_model: formData.car_model || null,
        car_plate: formData.car_plate || null,
        notes: formData.notes || null,
        gender_preference: formData.gender_preference,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('trips')
        .update(tripData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم تحديث الرحلة بنجاح",
        description: "تم حفظ التعديلات على رحلتك",
      });

      navigate('/my-trips');
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الرحلة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md card-moroccan">
          <CardContent className="text-center py-12">
            <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-arabic">تسجيل الدخول مطلوب</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              يجب تسجيل الدخول لتعديل الرحلة
            </p>
            <Button onClick={() => navigate('/auth')} variant="moroccan" className="font-arabic">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
          <p className="text-lg font-arabic">جاري تحميل بيانات الرحلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto card-moroccan">
          <CardHeader>
            <CardTitle className="text-center font-arabic text-2xl flex items-center justify-center gap-2">
              <Edit className="h-6 w-6" />
              تعديل الرحلة
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-arabic flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    من
                  </Label>
                  <Select 
                    value={formData.from_location} 
                    onValueChange={(value) => handleInputChange('from_location', value)}
                  >
                    <SelectTrigger className="font-arabic">
                      <SelectValue placeholder="اختر مدينة المغادرة" />
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
                  <Label className="font-arabic flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    إلى
                  </Label>
                  <Select 
                    value={formData.to_location} 
                    onValueChange={(value) => handleInputChange('to_location', value)}
                  >
                    <SelectTrigger className="font-arabic">
                      <SelectValue placeholder="اختر مدينة الوصول" />
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
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-arabic flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاريخ المغادرة
                  </Label>
                  <Input
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-arabic flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    وقت المغادرة
                  </Label>
                  <Input
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) => handleInputChange('departure_time', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Pricing and Seats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-arabic flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    السعر لكل مقعد (درهم)
                  </Label>
                  <Input
                    type="number"
                    value={formData.price_per_seat}
                    onChange={(e) => handleInputChange('price_per_seat', e.target.value)}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-arabic flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    عدد المقاعد الإجمالي
                  </Label>
                  <Select 
                    value={formData.total_seats} 
                    onValueChange={(value) => handleInputChange('total_seats', value)}
                  >
                    <SelectTrigger className="font-arabic">
                      <SelectValue placeholder="اختر عدد المقاعد" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <SelectItem key={num} value={num.toString()} className="font-arabic">
                          {num} مقاعد
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Car Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-arabic flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    نوع السيارة (اختياري)
                  </Label>
                  <Input
                    value={formData.car_model}
                    onChange={(e) => handleInputChange('car_model', e.target.value)}
                    placeholder="تويوتا كورولا، رينو كليو..."
                    className="font-arabic"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-arabic">رقم اللوحة (اختياري)</Label>
                  <Input
                    value={formData.car_plate}
                    onChange={(e) => handleInputChange('car_plate', e.target.value)}
                    placeholder="12345-أ-23"
                    className="font-arabic"
                  />
                </div>
              </div>

              {/* Gender Preference */}
              <div className="space-y-2">
                <Label className="font-arabic">تفضيل الجنس</Label>
                <Select 
                  value={formData.gender_preference} 
                  onValueChange={(value) => handleInputChange('gender_preference', value)}
                >
                  <SelectTrigger className="font-arabic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any" className="font-arabic">أي جنس</SelectItem>
                    <SelectItem value="men" className="font-arabic">رجال فقط</SelectItem>
                    <SelectItem value="women" className="font-arabic">نساء فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="font-arabic">ملاحظات إضافية (اختياري)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أي معلومات إضافية للركاب..."
                  className="font-arabic min-h-[100px]"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/my-trips')}
                  className="flex-1 font-arabic"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  variant="moroccan" 
                  className="flex-1 font-arabic text-lg py-3"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}