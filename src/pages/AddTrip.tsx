import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Car, MapPin, Calendar, Clock, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { moroccanCities } from '@/data/moroccanCities';
import { toast } from '@/hooks/use-toast';

export default function AddTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لإضافة رحلة",
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
      // Get the user's internal ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, user_type')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData) {
        toast({
          title: "خطأ في البيانات",
          description: "لم نتمكن من العثور على بيانات المستخدم",
          variant: "destructive",
        });
        return;
      }

      if (userData.user_type !== 'driver') {
        toast({
          title: "غير مسموح",
          description: "يمكن للسائقين فقط إضافة رحلات",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time
      const departureDateTime = `${formData.departure_date}T${formData.departure_time}:00`;

      const tripData = {
        driver_id: userData.id,
        from_location: formData.from_location,
        to_location: formData.to_location,
        departure_time: departureDateTime,
        price_per_seat: parseFloat(formData.price_per_seat),
        total_seats: parseInt(formData.total_seats),
        available_seats: parseInt(formData.total_seats),
        car_model: formData.car_model || null,
        car_plate: formData.car_plate || null,
        notes: formData.notes || null,
        gender_preference: formData.gender_preference
      };

      const { error } = await supabase
        .from('trips')
        .insert([tripData]);

      if (error) throw error;

      toast({
        title: "تم إضافة الرحلة بنجاح",
        description: "تم نشر رحلتك وستظهر في نتائج البحث",
      });

      navigate('/my-trips');
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الرحلة",
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
              يجب تسجيل الدخول لإضافة رحلة جديدة
            </p>
            <Button onClick={() => navigate('/auth')} variant="moroccan" className="font-arabic">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto card-moroccan">
          <CardHeader>
            <CardTitle className="text-center font-arabic text-2xl flex items-center justify-center gap-2">
              <Plus className="h-6 w-6" />
              إضافة رحلة جديدة
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
                    عدد المقاعد المتاحة
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

              <Button 
                type="submit" 
                disabled={loading} 
                variant="moroccan" 
                className="w-full font-arabic text-lg py-3"
              >
                {loading ? 'جاري النشر...' : 'نشر الرحلة'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}