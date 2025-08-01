import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Car, Star, Activity, Edit, Save, X, Calendar, Clock, MapPin, Trash2, MessageCircle, Map } from 'lucide-react';
import LocationMap from '@/components/LocationMap';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  user_type: 'driver' | 'passenger';
  rating?: number;
  total_ratings?: number;
  created_at: string;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  description?: string;
  created_at: string;
}

interface Booking {
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
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone_number: '',
    user_type: 'passenger' as 'driver' | 'passenger'
  });
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [editBookingForm, setEditBookingForm] = useState({
    seats_booked: 1
  });
  const [showLocationMap, setShowLocationMap] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActivityLogs();
      fetchBookings();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditForm({
        name: data.name,
        phone_number: data.phone_number || '',
        user_type: data.user_type
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الملف الشخصي",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchActivityLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setActivityLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // First get user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      // Then get bookings with trip details
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips (
            id,
            from_location,
            to_location,
            departure_time,
            price_per_seat,
            status,
            users (
              id,
              name
            )
          )
        `)
        .eq('passenger_id', userData.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          phone_number: editForm.phone_number || null,
          user_type: editForm.user_type
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ التغييرات بنجاح",
      });

      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجزك بنجاح",
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: "خطأ في الإلغاء",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          seats_booked: editBookingForm.seats_booked,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "تم تحديث الحجز",
        description: "تم تحديث عدد المقاعد بنجاح",
      });

      setEditingBooking(null);
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isOngoingTrip = (booking: Booking) => {
    return booking.trips.status === 'en cours';
  };

  const isPastTrip = (datetime: string) => {
    return new Date(datetime) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ar-MA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('ar-MA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trip_created':
        return <Car className="h-4 w-4" />;
      case 'trip_booked':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityText = (type: string, description?: string) => {
    switch (type) {
      case 'trip_created':
        return 'تم إنشاء رحلة جديدة';
      case 'trip_booked':
        return 'تم حجز رحلة';
      case 'profile_updated':
        return 'تم تحديث الملف الشخصي';
      default:
        return description || 'نشاط غير محدد';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md card-moroccan">
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-arabic">تسجيل الدخول مطلوب</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              يجب تسجيل الدخول لعرض الملف الشخصي
            </p>
            <Button onClick={() => navigate('/auth')} variant="moroccan" className="font-arabic">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
          <p className="text-lg font-arabic">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-arabic mb-8">الملف الشخصي</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bookings Section */}
              <Card className="card-moroccan">
                <CardHeader>
                  <CardTitle className="font-arabic">حجوزاتي</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-muted-foreground text-center font-arabic py-8">لا توجد حجوزات حتى الآن</p>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-semibold font-arabic">
                                  {booking.trips.from_location} ← {booking.trips.to_location}
                                </span>
                                {isOngoingTrip(booking) && (
                                  <Badge variant="default" className="font-arabic bg-green-500">
                                    جارية
                                  </Badge>
                                )}
                                {isPastTrip(booking.trips.departure_time) && (
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
                              {isOngoingTrip(booking) && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowLocationMap(showLocationMap === booking.id ? null : booking.id)}
                                    className="font-arabic"
                                  >
                                    <Map className="mr-2 h-4 w-4" />
                                    {showLocationMap === booking.id ? 'إخفاء' : 'خريطة'}
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
                                {!isPastTrip(booking.trips.departure_time) && (
                                  <Dialog open={editingBooking === booking.id} onOpenChange={(open) => {
                                    setEditingBooking(open ? booking.id : null);
                                    if (open) {
                                      setEditBookingForm({ seats_booked: booking.seats_booked });
                                    }
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="font-arabic"
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
                                            value={editBookingForm.seats_booked.toString()} 
                                            onValueChange={(value) => setEditBookingForm(prev => ({...prev, seats_booked: parseInt(value)}))}
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
                                            {editBookingForm.seats_booked * booking.trips.price_per_seat} درهم
                                          </p>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                          <Button 
                                            variant="outline" 
                                            className="flex-1 font-arabic"
                                            onClick={() => setEditingBooking(null)}
                                          >
                                            إلغاء
                                          </Button>
                                          <Button 
                                            variant="moroccan" 
                                            className="flex-1 font-arabic"
                                            onClick={() => updateBooking(booking.id)}
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
                                  onClick={() => cancelBooking(booking.id)}
                                  className="font-arabic text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Location Map */}
                          {showLocationMap === booking.id && isOngoingTrip(booking) && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <h4 className="font-semibold mb-2 font-arabic">تتبع موقع السائق</h4>
                              <LocationMap
                                tripId={booking.trips.id}
                                isDriver={false}
                                driverName={booking.trips.users.name}
                                customerName={profile?.name}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-moroccan">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-arabic">المعلومات الشخصية</CardTitle>
                    {!editing ? (
                      <Button 
                        onClick={() => setEditing(true)} 
                        variant="outline" 
                        size="sm"
                        className="font-arabic"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        تعديل
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          onClick={updateProfile} 
                          variant="moroccan" 
                          size="sm"
                          className="font-arabic"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          حفظ
                        </Button>
                        <Button 
                          onClick={() => setEditing(false)} 
                          variant="outline" 
                          size="sm"
                          className="font-arabic"
                        >
                          <X className="mr-2 h-4 w-4" />
                          إلغاء
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <>
                      <div className="space-y-2">
                        <Label className="font-arabic">الاسم الكامل</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="font-arabic"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-arabic">رقم الهاتف</Label>
                        <Input
                          value={editForm.phone_number}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                          placeholder="+212 6XX XXX XXX"
                          className="font-arabic"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-arabic">نوع المستخدم</Label>
                        <Select 
                          value={editForm.user_type} 
                          onValueChange={(value: 'driver' | 'passenger') => 
                            setEditForm(prev => ({ ...prev, user_type: value }))
                          }
                        >
                          <SelectTrigger className="font-arabic">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passenger" className="font-arabic">راكب</SelectItem>
                            <SelectItem value="driver" className="font-arabic">سائق</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold font-arabic">{profile.name}</p>
                          <p className="text-sm text-muted-foreground font-arabic">الاسم الكامل</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-arabic">{profile.email}</p>
                          <p className="text-sm text-muted-foreground font-arabic">البريد الإلكتروني</p>
                        </div>
                      </div>
                      
                      {profile.phone_number && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-arabic">{profile.phone_number}</p>
                            <p className="text-sm text-muted-foreground font-arabic">رقم الهاتف</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Badge variant={profile.user_type === 'driver' ? 'default' : 'secondary'} className="font-arabic">
                            {profile.user_type === 'driver' ? 'سائق' : 'راكب'}
                          </Badge>
                          <p className="text-sm text-muted-foreground font-arabic">نوع المستخدم</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Statistics and Activity */}
            <div className="space-y-6">
              {/* Statistics */}
              <Card className="card-moroccan">
                <CardHeader>
                  <CardTitle className="font-arabic">الإحصائيات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-2xl font-bold">{profile.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-arabic">
                      التقييم ({profile.total_ratings || 0} تقييم)
                    </p>
                  </div>
                  
                  <div className="text-center pt-4 border-t border-border">
                    <p className="text-lg font-semibold">{formatDate(profile.created_at)}</p>
                    <p className="text-sm text-muted-foreground font-arabic">عضو منذ</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="card-moroccan">
                <CardHeader>
                  <CardTitle className="font-arabic">النشاط الأخير</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center font-arabic">لا يوجد نشاط حتى الآن</p>
                  ) : (
                    <div className="space-y-3">
                      {activityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-start gap-3">
                          <div className="mt-1">
                            {getActivityIcon(log.activity_type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-arabic">{getActivityText(log.activity_type, log.description)}</p>
                            <p className="text-xs text-muted-foreground font-arabic">
                              {formatDate(log.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}