import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2, MessageSquare, Sprout, CheckCircle, Clock, Calendar, MapPin, FileText, Zap, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    name: string;
    avatar_url?: string;
  } | null;
}

const QUICK_ACTIONS = [
  { label: "นัดดูพื้นที่", icon: Calendar, text: "สะดวกให้เข้าไปดูพื้นที่จริงวันไหนดีครับ?" },
  { label: "ขอพิกัด", icon: MapPin, text: "รบกวนขอพิกัด Google Maps หน่อยครับ" },
  { label: "สนใจเช่า", icon: Zap, text: "สนใจเช่าพื้นที่นี้ครับ มีค่าใช้จ่ายอย่างไรบ้าง?" },
  { label: "ส่งสัญญา", icon: FileText, text: "ส่งร่างสัญญาเช่าให้พิจารณาครับ" },
];

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequestInfo();
      fetchMessages();
      const channel = supabase.channel(`room-${id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `request_id=eq.${id}` }, async (payload) => {
          const newMsg = payload.new as Message;
          const { data: profile } = await supabase.from("profiles").select("name, avatar_url").eq("id", newMsg.sender_id).single();
          setMessages((prev) => [...prev, { ...newMsg, sender_profile: profile }]);
          setTimeout(() => { if (scrollRef.current) { const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]'); if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight; } }, 100);
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [id, user]);

  const fetchRequestInfo = async () => {
    const { data, error } = await supabase.from("space_requests").select(`id, status, gardener_id, started_at, urban_farm_spaces (title, owner_id)`).eq("id", id).single();
    if (error || !data) { navigate("/"); return; }
    setRequestInfo({ 
        id: data.id, 
        status: data.status, 
        space_title: (data.urban_farm_spaces as any)?.title || "", 
        gardener_id: data.gardener_id, 
        owner_id: (data.urban_farm_spaces as any)?.owner_id || "" 
    });
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from("chat_messages").select("*").eq("request_id", id).order("created_at", { ascending: true });
    if (data) {
        const msgs = await Promise.all(data.map(async (msg: any) => {
            const { data: profile } = await supabase.from("profiles").select("name, avatar_url").eq("id", msg.sender_id).single();
            return { ...msg, sender_profile: profile };
        }));
        setMessages(msgs);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || newMessage;
    if (!textToSend.trim()) return;
    
    setSending(true);
    await supabase.from("chat_messages").insert({ request_id: id, sender_id: user!.id, message: textToSend.trim() });
    setNewMessage("");
    setSending(false);
  };

  const updateStatus = async (newStatus: 'active' | 'completed') => {
    setProcessingAction(true);
    const updates: any = { status: newStatus };
    if (newStatus === 'active') updates.started_at = new Date().toISOString();
    if (newStatus === 'completed') updates.finished_at = new Date().toISOString();
    
    const { error } = await supabase.from("space_requests").update(updates).eq("id", id);
    if (!error) {
      toast({ title: "สำเร็จ", description: newStatus === 'active' ? "เริ่มการปลูกผักแล้ว!" : "จบโครงการเรียบร้อย" });
      fetchRequestInfo();
      await supabase.from("chat_messages").insert({ request_id: id, sender_id: user!.id, message: newStatus === 'active' ? "🌱 เริ่มต้นการใช้งานพื้นที่อย่างเป็นทางการ" : "🏁 จบโครงการและส่งคืนพื้นที่เรียบร้อยแล้ว" });
    } else { toast({ title: "Error", variant: "destructive" }); }
    setProcessingAction(false);
  };

  const isSystemMessage = (msg: string) => msg.startsWith("🌱") || msg.startsWith("🏁");

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  
  const isGardener = user?.id === requestInfo?.gardener_id;
  const isLandowner = user?.id === requestInfo?.owner_id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px), radial-gradient(#10b981 0.5px, #f8fafc 0.5px)`, backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}>
      </div>

      <header className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-20 px-4 py-3 shadow-sm transition-all duration-300">
        <div className="container mx-auto flex items-center gap-3 max-w-2xl">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex-1 overflow-hidden">
            <h1 className="font-bold text-lg leading-tight truncate text-slate-800">{requestInfo?.space_title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {requestInfo?.status === 'active' && <span className="text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> กำลังใช้งาน</span>}
              {requestInfo?.status === 'completed' && <span className="text-slate-500 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> จบโครงการ</span>}
              {requestInfo?.status === 'approved' && <span className="text-blue-600 flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded-full">รอเริ่มงาน</span>}
              {requestInfo?.status === 'pending' && <span className="text-orange-500 flex items-center gap-1 font-medium bg-orange-50 px-2 py-0.5 rounded-full">รอการตอบรับ</span>}
            </div>
          </div>
          
          {/* Action Buttons */}
          {/* ปุ่มเริ่มปลูก (เฉพาะ Gardener) */}
          {isGardener && requestInfo?.status === 'approved' && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 shadow-md transition-all hover:scale-105">
                        <Sprout className="w-4 h-4 mr-1.5" /> เริ่มปลูก
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการเริ่มใช้งาน?</AlertDialogTitle>
                        <AlertDialogDescription>ระบบจะเริ่มนับเวลาการใช้งานตั้งแต่วันนี้เป็นต้นไป</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={() => updateStatus('active')} disabled={processingAction} className="bg-emerald-600">ยืนยัน</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}

          {/* ปุ่มจบโครงการ (ทั้ง Gardener และ Landowner) */}
          {(isGardener || isLandowner) && requestInfo?.status === 'active' && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-full px-4 transition-all">
                        {isLandowner ? <><XCircle className="w-4 h-4 mr-1.5" /> ยุติสัญญา</> : "จบโครงการ"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการจบโครงการ?</AlertDialogTitle>
                        <AlertDialogDescription>คุณต้องการจบโครงการและส่งคืนพื้นที่ใช่หรือไม่?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยังก่อน</AlertDialogCancel>
                        <AlertDialogAction onClick={() => updateStatus('completed')} className="bg-red-600 hover:bg-red-700">ยืนยันจบงาน</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <div className="flex-1 container mx-auto max-w-2xl w-full p-2 sm:p-4 flex flex-col h-[calc(100vh-65px)] z-10 relative">
        <Card className="flex-1 flex flex-col overflow-hidden border-0 sm:border shadow-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-6 pb-4">
              {messages.length === 0 ? (
                <div className="text-center py-20 opacity-60 flex flex-col items-center">
                  <div className="bg-emerald-100 p-4 rounded-full mb-3 animate-pulse">
                    <MessageSquare className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-slate-500 font-medium">เริ่มการสนทนาเกี่ยวกับพื้นที่นี้</p>
                  <p className="text-xs text-slate-400 mt-1">คุยรายละเอียดและนัดหมายกันได้เลย</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const isSystem = isSystemMessage(msg.message);

                  if (isSystem) {
                    return (
                        <div key={msg.id} className="flex justify-center my-4">
                            <div className="bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-600 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                                {msg.message}
                            </div>
                        </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"} group`}>
                      <Avatar className="h-9 w-9 mt-1 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={msg.sender_profile?.avatar_url} className="object-cover" />
                        <AvatarFallback className={`text-[10px] font-bold ${isOwn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                          {msg.sender_profile?.name?.substring(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[75%] space-y-1`}>
                        <div className={`px-4 py-2.5 text-sm shadow-sm transition-all ${
                          isOwn 
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl rounded-tr-sm" 
                            : "bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-sm"
                        }`}>
                          {msg.message}
                        </div>
                        <p className={`text-[10px] ${isOwn ? "text-right mr-1" : "ml-1"} text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {new Date(msg.created_at).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {requestInfo?.status !== 'completed' ? (
            <div className="bg-white/95 backdrop-blur border-t pb-2">
              
              {/* Smart Action Bar (Only for Gardener) */}
              {isGardener && (
                <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar mask-gradient">
                    {QUICK_ACTIONS.map((action, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setNewMessage(action.text)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-full text-xs font-medium text-slate-600 hover:text-emerald-700 transition-all whitespace-nowrap"
                        >
                            <action.icon className="w-3 h-3" /> {action.label}
                        </button>
                    ))}
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 items-center px-3 pb-3 pt-2">
                <div className="flex-1 bg-slate-50 p-1 rounded-3xl border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all flex items-center">
                    <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    disabled={sending}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none px-4 h-9 text-base"
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className={`rounded-full h-8 w-8 mr-1 shrink-0 shadow-sm transition-all ${newMessage.trim() ? "bg-emerald-500 hover:bg-emerald-600 scale-100" : "bg-slate-300 scale-90"}`}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                    </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border-t text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> โครงการนี้เสร็จสิ้นแล้ว
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}