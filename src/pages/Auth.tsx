import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Car, UserPlus, LogIn } from 'lucide-react';
import { useEffect } from 'react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'driver' | 'passenger'>('passenger');
  const [loading, setLoading] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      await signUp(email, password, name, phone);
    } else {
      await signIn(email, password);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-moroccan">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary font-arabic">تشاركي</span>
            </div>
          </div>
          <CardTitle className="text-xl font-arabic">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </CardTitle>
          <CardDescription className="font-arabic">
            {isSignUp 
              ? 'انضم إلى مجتمع تشاركي وشارك رحلاتك' 
              : 'مرحباً بك مرة أخرى في تشاركي'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-arabic">الاسم الكامل</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="font-arabic"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-arabic">رقم الهاتف (اختياري)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="font-arabic"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType" className="font-arabic">نوع المستخدم</Label>
                  <Select value={userType} onValueChange={(value: 'driver' | 'passenger') => setUserType(value)}>
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
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-arabic">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-arabic"
                placeholder="example@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-arabic">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-arabic"
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-arabic" 
              variant="moroccan"
              disabled={loading}
            >
              {loading ? (
                "جاري المعالجة..."
              ) : isSignUp ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  إنشاء حساب
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground font-arabic">
              {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
            </p>
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-arabic"
            >
              {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}