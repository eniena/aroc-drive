import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, ArrowLeft, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

interface BookingDetails {
  id: string;
  trip: {
    from_location: string;
    to_location: string;
    departure_time: string;
    driver: {
      name: string;
      phone: string;
    };
  };
  passenger: {
    name: string;
    phone: string;
  };
}

export default function Chat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookingId && user) {
      fetchChatData();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `booking_id=eq.${bookingId}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [bookingId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatData = async () => {
    if (!user || !bookingId) return;

    try {
      // Get current user's internal ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('لم نتمكن من العثور على بيانات المستخدم');
      }

      setCurrentUserId(userData.id);

      // Get booking details with trip and user info
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          trip_id,
          passenger_id,
          trips (
            from_location,
            to_location,
            departure_time,
            driver_id,
            driver:users!trips_driver_id_fkey (
              name,
              phone
            )
          ),
          passenger:users!bookings_passenger_id_fkey (
            name,
            phone
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('لم نتمكن من العثور على تفاصيل الحجز');
      }

      setBookingDetails(booking as any);

      // Check if user is authorized to view this chat
      const isDriver = booking.trips?.driver_id === userData.id;
      const isPassenger = booking.passenger_id === userData.id;

      if (!isDriver && !isPassenger) {
        toast({
          title: "غير مسموح",
          description: "ليس لديك صلاحية لعرض هذه المحادثة",
          variant: "destructive",
        });
        navigate('/my-trips');
        return;
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            name
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const formattedMessages = messagesData?.map(msg => ({
        ...msg,
        sender_name: (msg as any).sender?.name
      })) || [];

      setMessages(formattedMessages);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المحادثة",
        description: error.message,
        variant: "destructive",
      });
      navigate('/my-trips');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !bookingId || !currentUserId || sending) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          booking_id: bookingId,
          sender_id: currentUserId,
          content: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString('ar-MA', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md card-moroccan">
          <CardContent className="text-center py-12">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-arabic">تسجيل الدخول مطلوب</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              يجب تسجيل الدخول لعرض المحادثة
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
          <MessageCircle className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
          <p className="text-lg font-arabic">جاري تحميل المحادثة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <Card className="card-moroccan mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/my-trips')}
                className="font-arabic"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة
              </Button>
              <CardTitle className="text-center font-arabic text-xl flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                محادثة الرحلة
              </CardTitle>
              <div></div>
            </div>
            
            {bookingDetails && (
              <div className="text-center mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="font-arabic text-sm text-muted-foreground mb-2">
                  {bookingDetails.trip.from_location} ← {bookingDetails.trip.to_location}
                </p>
                <p className="font-arabic text-xs text-muted-foreground">
                  {formatDateTime(bookingDetails.trip.departure_time)}
                </p>
                
                <div className="flex justify-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-arabic">السائق: {bookingDetails.trip.driver.name}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="font-arabic">الراكب: {bookingDetails.passenger.name}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="card-moroccan h-[600px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground font-arabic">لا توجد رسائل بعد</p>
                    <p className="text-sm text-muted-foreground font-arabic">ابدأ المحادثة بإرسال رسالة</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="font-arabic text-xs">
                              {message.sender_name?.charAt(0) || '؟'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`rounded-lg p-3 ${
                            isOwnMessage 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="font-arabic text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {formatDateTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك..."
                  className="font-arabic"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  variant="moroccan"
                  size="sm"
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}