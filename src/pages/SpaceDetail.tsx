import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, MapPin, Ruler, Calendar, CheckCircle2, 
  Info, ShieldCheck, TreePine, Loader2, Share2, Heart, 
  Sun, CloudRain, ChevronLeft, ChevronRight, MessageCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [isSpaceOccupied, setIsSpaceOccupied] = useState(false);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [gallery, setGallery] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchSpaceData();
  }, [id, user]);

  const fetchSpaceData = async () => {
    setLoading(true);
    try {
      const { data: spaceData, error } = await supabase.from("urban_farm_spaces").select("*").eq("id", id).single();
      if (error || !spaceData) { navigate("/"); return; }
      
      const { data: owner } = await supabase.from("profiles").select("name, avatar_url").eq("id", spaceData.owner_id).single();
      
      setSpace({ 
        ...spaceData, 
        owner_name: owner?.name || "เจ้าของพื้นที่",
        owner_avatar: owner?.avatar_url 
      });

      const images = spaceData.gallery && spaceData.gallery.length > 0 
        ? spaceData.gallery 
        : (spaceData.image_url ? [spaceData.image_url] : []);
      setGallery(images);

      const { data: occupiedCheck } = await supabase.from("space_requests").select("id").eq("space_id", id).eq("status", "active").maybeSingle();
      setIsSpaceOccupied(!!occupiedCheck);

      if (user && userRole === "gardener") {
        const { data: myRequest } = await supabase.from("space_requests").select("*").eq("space_id", id).eq("gardener_id", user.id).in("status", ['pending', 'approved', 'active']).maybeSingle();
        setActiveRequest(myRequest);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user) { navigate("/auth"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("space_requests").insert({
      space_id: id, gardener_id: user.id, message: requestMessage.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } else {
      toast({ title: "ส่งคำขอสำเร็จ", description: "รอเจ้าของพื้นที่ตอบกลับนะครับ" });
      fetchSpaceData();
    }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "คัดลอกลิงก์แล้ว", description: "แชร์ให้เพื่อนได้เลย!" });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!space) return null;

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans pb-24">
      
      {/* Navbar Overlay */}
      <header className="fixed top-0 w-full z-30 px-4 py-4 transition-all pointer-events-none">
        <div className="container mx-auto max-w-5xl flex justify-between items-center pointer-events-auto">
          <Button variant="secondary" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={handleShare} className="rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white">
              <Share2 className="h-5 w-5 text-slate-700" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setIsLiked(!isLiked)} className="rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white">
              <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : "text-slate-700"}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Gallery Section */}
      <div className="relative w-full h-[45vh] md:h-[60vh] bg-slate-200">
        {gallery.length > 0 ? (
          <>
            <img src={gallery[currentImageIndex]} alt="Space" className="w-full h-full object-cover transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
            
            {gallery.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"><ChevronLeft /></button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"><ChevronRight /></button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {gallery.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? "bg-white w-4" : "bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-700 to-emerald-900 text-white">
            <TreePine className="h-24 w-24 text-white/30 mb-4" />
            <p>ไม่มีรูปภาพ</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white max-w-5xl mx-auto">
          <Badge className="bg-primary/90 hover:bg-primary text-white border-none mb-3 backdrop-blur-sm px-3 py-1 text-sm">
             {space.farm_type || "พื้นที่เกษตร"}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg mb-2">{space.title}</h1>
          <div className="flex items-center gap-2 text-white/90 text-sm md:text-base">
            <MapPin className="h-4 w-4" /> {space.address}
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-4 -mt-8 relative z-10 grid md:grid-cols-3 gap-6 md:gap-8">
        
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarImage src={space.owner_avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-bold text-xl">
                      {space.owner_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">เจ้าของพื้นที่</p>
                    <h3 className="text-lg font-bold text-slate-800">{space.owner_name}</h3>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full hidden sm:flex">
                  <MessageCircle className="w-4 h-4 mr-2" /> ติดต่อ
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800">
                  <Info className="w-5 h-5 text-primary" /> รายละเอียด
                </h3>
                {/* Fixed: Now showing real description */}
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                  {space.description || "ยังไม่มีรายละเอียดเพิ่มเติมจากเจ้าของพื้นที่"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Grid with Sun/Rain Logic */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <Card className="border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors text-center p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Ruler className="w-6 h-6 text-blue-500" />
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">ขนาด</div>
                <div className="font-bold text-slate-800">{space.area_size || "-"}</div>
             </Card>
             
             {/* Sunlight Widget (Real Data) */}
             <Card className="border-none shadow-sm bg-orange-50/50 hover:bg-orange-50 transition-colors text-center p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Sun className="w-6 h-6 text-orange-500" />
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">แสงแดด</div>
                <div className="font-bold text-slate-800 text-sm line-clamp-2">
                  {space.sunlight || "ไม่ระบุ"}
                </div>
             </Card>

             <Card className="border-none shadow-sm bg-cyan-50/50 hover:bg-cyan-50 transition-colors text-center p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                <CloudRain className="w-6 h-6 text-cyan-500" />
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">แหล่งน้ำ</div>
                <div className="font-bold text-slate-800">{space.amenities?.includes("แหล่งน้ำ") ? "มีพร้อม" : "ไม่มี"}</div>
             </Card>
             <Card className="border-none shadow-sm bg-green-50/50 hover:bg-green-50 transition-colors text-center p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Calendar className="w-6 h-6 text-green-500" />
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">ว่างเมื่อ</div>
                <div className="font-bold text-slate-800 text-sm">
                   {space.available_from ? new Date(space.available_from).toLocaleDateString('th-TH') : "พร้อมทันที"}
                </div>
             </Card>
          </div>

          <Card className="border-none shadow-md rounded-3xl overflow-hidden">
             <CardContent className="p-8 space-y-8">
                <div>
                   <h3 className="font-bold text-lg mb-4 text-slate-800">สิ่งอำนวยความสะดวก</h3>
                   <div className="flex flex-wrap gap-3">
                      {space.amenities && space.amenities.length > 0 ? space.amenities.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                           <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                        </div>
                      )) : <p className="text-slate-400">ไม่มีข้อมูล</p>}
                   </div>
                </div>
                
                {space.rules && (
                  <div className="bg-orange-50/80 p-6 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 font-bold mb-3 text-orange-800">
                      <ShieldCheck className="h-5 w-5" /> กฎระเบียบ
                    </div>
                    <p className="text-orange-900/80 leading-relaxed">{space.rules}</p>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
              <div className="p-6 pb-4 border-b border-slate-50">
                <div className="flex items-end gap-2 mb-1">
                   <span className="text-3xl font-extrabold text-primary">
                      {space.price > 0 ? `฿${space.price.toLocaleString()}` : "ฟรี"}
                   </span>
                   <span className="text-sm text-slate-400 mb-1.5 font-medium">{space.price_unit || "บาท/เดือน"}</span>
                </div>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> ยืนยันตัวตนแล้ว
                </p>
              </div>
              
              <CardContent className="p-6 pt-6">
                {!user ? (
                  <Button asChild className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                    <Link to="/auth">เข้าสู่ระบบเพื่อจอง</Link>
                  </Button>
                ) : userRole !== 'gardener' ? (
                  <div className="text-center text-sm text-muted-foreground bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    เฉพาะบัญชี "นักปลูก" เท่านั้นที่สามารถส่งคำขอได้
                  </div>
                ) : activeRequest ? (
                  <div className="text-center p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <Badge className={`mb-3 px-3 py-1 text-sm ${
                      activeRequest.status === 'approved' ? 'bg-green-500' :
                      activeRequest.status === 'active' ? 'bg-green-600' : 'bg-blue-500'
                    }`}>
                      {activeRequest.status === 'approved' ? 'อนุมัติแล้ว' : 
                       activeRequest.status === 'active' ? 'กำลังใช้งาน' : 'รอการตอบรับ'}
                    </Badge>
                    <p className="text-sm text-slate-600 mb-4">
                      {activeRequest.status === 'active' ? "คุณกำลังปลูกผักอยู่ที่นี่!" : "คำขอของคุณถูกส่งแล้ว"}
                    </p>
                    <Button asChild className="w-full rounded-xl" variant="outline">
                      <Link to={`/requests/${activeRequest.id}/chat`}>ไปที่แชท</Link>
                    </Button>
                  </div>
                ) : isSpaceOccupied ? (
                  <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-100">
                    <p className="font-bold text-red-800 text-lg">ไม่ว่าง</p>
                    <p className="text-sm text-red-600/80 mt-1">กำลังมีเพื่อนเกษตรกรใช้งานอยู่</p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in zoom-in-95 duration-300">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">ข้อความถึงเจ้าของ</label>
                       <Textarea 
                        placeholder="สวัสดีครับ สนใจเช่าพื้นที่เพื่อปลูกผักสลัดครับ..." 
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        className="min-h-[100px] rounded-2xl resize-none bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/20"
                      />
                    </div>
                    <Button 
                      className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-primary/25 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                      onClick={handleSubmitRequest}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="animate-spin" /> : "ส่งคำขอเช่าพื้นที่"}
                    </Button>
                    <p className="text-xs text-center text-slate-400">ยังไม่มีการเก็บเงิน จนกว่าจะได้รับการอนุมัติ</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weather/Climate Widget (Static/Manual) */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-3xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Sun className="w-20 h-20" /></div>
               <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-2 text-orange-100 mb-4 text-sm font-medium">
                     <Sun className="w-4 h-4" /> ข้อมูลสภาพแสง
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="text-xl font-bold">{space.sunlight || "ไม่ระบุสภาพแสง"}</div>
                     <div className="text-orange-100 text-sm">การระบายน้ำ: {space.amenities?.includes("แหล่งน้ำ") ? "ดีเยี่ยม" : "ปานกลาง"}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-xs text-orange-100">
                     <span>เหมาะสำหรับ: พืชสวนครัว</span>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}