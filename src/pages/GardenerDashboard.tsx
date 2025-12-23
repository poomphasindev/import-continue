import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Sprout, LogOut, MessageCircle, TreePine, Calendar, CheckCircle2, Leaf, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GuideSection } from "@/components/GuideSection";

export default function GardenerDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("browse");
  const [spaces, setSpaces] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Active Farm Logic
  const activeFarm = requests.find(r => r.status === 'active');

  useEffect(() => {
    if (user) {
      fetchData();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    // ดึงข้อมูล Profile จริงๆ จากฐานข้อมูล
    const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
    if (data) setUserProfile(data);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: spacesData } = await supabase
        .from("urban_farm_spaces")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      const ownerIds = [...new Set(spacesData?.map(s => s.owner_id) || [])];
      // ดึงชื่อเจ้าของที่ดินมาแสดง
      const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", ownerIds);

      setSpaces(spacesData?.map(space => ({
        ...space,
        owner_name: profilesData?.find(p => p.id === space.owner_id)?.name || "ไม่ระบุชื่อ"
      })) || []);

      const { data: reqData } = await supabase
        .from("space_requests")
        .select("*, urban_farm_spaces(*)")
        .eq("gardener_id", user!.id)
        .order("created_at", { ascending: false });

      if (reqData) setRequests(reqData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (from: string, to: string) => {
    if (!from || !to) return "ไม่ระบุช่วงเวลา";
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: '2-digit' };
    return `${new Date(from).toLocaleDateString('th-TH', options)} - ${new Date(to).toLocaleDateString('th-TH', options)}`;
  };

  const getDaysRemaining = (request: any) => {
    if (!request.urban_farm_spaces.available_to) return { days: 0, percent: 0 };
    const start = new Date(request.started_at || request.created_at).getTime();
    const end = new Date(request.urban_farm_spaces.available_to).getTime();
    const now = new Date().getTime();
    const total = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const passed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const percent = Math.min(100, Math.max(0, (passed / total) * 100));
    return { days: remaining, percent };
  };

  const filteredSpaces = spaces.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-24 font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/50 px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between max-w-lg">
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-9 w-9 border cursor-pointer ring-2 ring-emerald-50">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                {userProfile?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">
                {userProfile?.name || "Gardener"}
              </p>
              <p className="text-[10px] text-muted-foreground">นักปลูกผัก</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        
        {/* Active Farm Section */}
        {!loading && activeFarm && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-2 mb-2 px-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">แปลงที่กำลังปลูก</h2>
            </div>
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-600 to-teal-700 text-white rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"><TreePine className="w-40 h-40 transform rotate-12 translate-x-10 -translate-y-10" /></div>
              <CardContent className="p-6 relative z-10">
                <h3 className="text-2xl font-bold mb-1">{activeFarm.urban_farm_spaces.title}</h3>
                <p className="text-emerald-100 text-sm flex items-center opacity-90 mb-6">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" /> {activeFarm.urban_farm_spaces.address}
                </p>

                <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between text-sm font-medium">
                    <span>ระยะเวลาโครงการ</span>
                    <span>เหลือ {getDaysRemaining(activeFarm).days} วัน</span>
                  </div>
                  <Progress value={getDaysRemaining(activeFarm).percent} className="h-2 bg-black/20" indicatorClassName="bg-white" />
                </div>

                <Button asChild className="w-full mt-5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold shadow-md h-11">
                  <Link to={`/requests/${activeFarm.id}/chat`}>
                    <MessageCircle className="w-4 h-4 mr-2" /> เข้าสู่พื้นที่ / พูดคุย
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar (Clean Version - No Filter Button) */}
        <div className="relative shadow-sm">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input 
                placeholder="ค้นหาพื้นที่..." 
                className="pl-10 h-12 rounded-xl border-none shadow-sm bg-white text-base focus-visible:ring-1 focus-visible:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActiveTab("browse"); }}
            />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl shadow-sm h-12">
            <TabsTrigger value="browse" className="rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-medium text-slate-500">
              สำรวจ
            </TabsTrigger>
            <TabsTrigger value="my-farms" className="rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-medium text-slate-500">
              ประวัติ
            </TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-medium text-slate-500">
               คู่มือ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {loading ? (
              [1,2].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)
            ) : filteredSpaces.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <TreePine className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500">ไม่พบพื้นที่</p>
              </div>
            ) : (
              filteredSpaces.map((space) => (
                <Link to={`/spaces/${space.id}`} key={space.id} className="block group">
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl bg-white h-full ring-1 ring-slate-100">
                    
                    {/* Image Area - Fix Square/Curve Issue */}
                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                      {space.image_url ? (
                        <img 
                          src={space.image_url} 
                          alt={space.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="absolute inset-0 bg-emerald-50 flex items-center justify-center">
                          <TreePine className="h-16 w-16 text-emerald-200" />
                        </div>
                      )}
                      
                      {/* Real Badges Only */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {space.farm_type && (
                            <Badge className="bg-white/90 text-slate-700 backdrop-blur-md border-none font-medium px-2 py-0.5 text-xs shadow-sm">
                                <Leaf className="w-3 h-3 mr-1 text-green-600" /> {space.farm_type}
                            </Badge>
                        )}
                      </div>
                      
                      {/* Price Tag (Real Data) */}
                      {space.price > 0 ? (
                        <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-md">
                            ฿{space.price.toLocaleString()}
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 bg-blue-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-md">
                            แบ่งปันฟรี
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
                        {space.title}
                      </h3>
                      
                      <div className="flex items-center text-sm text-slate-500 mb-4">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-500 shrink-0" />
                        <span className="truncate">{space.address}</span>
                      </div>

                      {/* Info Grid - Real Data */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="inline-flex items-center text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                           <Calendar className="h-3 w-3 mr-1.5 text-slate-400" />
                           {formatDateRange(space.available_from, space.available_to)}
                        </div>
                        {space.area_size && (
                             <div className="inline-flex items-center text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                <span className="font-medium">{space.area_size}</span>
                            </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {space.owner_name?.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-500">{space.owner_name}</span>
                         </div>
                         <div className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            รายละเอียด <ArrowRight className="w-3.5 h-3.5" />
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-farms" className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <Sprout className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500">ยังไม่มีประวัติการเช่า</p>
              </div>
            ) : (
             requests.map((req) => (
                <Card key={req.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden ring-1 ring-slate-100 hover:shadow-md transition-all">
                  <div className="p-4 flex gap-4">
                      {/* Thumbnail Small */}
                      <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                          {req.urban_farm_spaces?.image_url ? (
                              <img src={req.urban_farm_spaces.image_url} className="w-full h-full object-cover" />
                          ) : <TreePine className="w-8 h-8 m-auto mt-6 text-slate-300" />}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                             <div className="flex justify-between items-start">
                                <h3 className="font-bold text-slate-800 line-clamp-1 text-sm">{req.urban_farm_spaces?.title}</h3>
                                <Badge className={`rounded px-1.5 py-0 text-[10px] font-normal shadow-none ${
                                    req.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                    req.status === 'completed' ? 'bg-slate-100 text-slate-600 hover:bg-slate-100' :
                                    req.status === 'approved' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-50'
                                }`}>
                                    {req.status === 'active' ? 'กำลังปลูก' : req.status === 'completed' ? 'เสร็จสิ้น' : req.status === 'approved' ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                                </Badge>
                             </div>
                             <p className="text-xs text-slate-500 line-clamp-1 mt-1">{req.urban_farm_spaces?.address}</p>
                        </div>
                        
                        <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm" asChild className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-7 px-2 text-xs">
                                <Link to={`/requests/${req.id}/chat`}>
                                    พูดคุย / รายละเอียด <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </Button>
                        </div>
                      </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="guide">
            <GuideSection role="gardener" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}