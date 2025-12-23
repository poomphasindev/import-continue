import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreePine, Plus, MapPin, Edit, Trash2, Eye, EyeOff, MessageSquare, LogOut, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LandownerRequests from "./LandownerRequests";
import { GuideSection } from "@/components/GuideSection";

export default function LandownerDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("spaces");

  useEffect(() => {
    if (user) {
      fetchSpaces();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    // ใช้ maybeSingle เพื่อป้องกัน Error กรณีไม่มีข้อมูล
    const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
    if (data) setUserProfile(data);
  };

  const fetchSpaces = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("urban_farm_spaces")
      .select("*")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSpaces(data);
      const counts: Record<string, number> = {};
      for (const space of data) {
        const { count } = await supabase
          .from("space_requests")
          .select("*", { count: "exact", head: true })
          .eq("space_id", space.id)
          .eq("status", "pending");
        counts[space.id] = count || 0;
      }
      setRequestCounts(counts);
    }
    setLoading(false);
  };

  const handleToggleActive = async (spaceId: string, currentStatus: boolean) => {
    setSpaces(spaces.map(s => s.id === spaceId ? { ...s, is_active: !currentStatus } : s));
    await supabase.from("urban_farm_spaces").update({ is_active: !currentStatus }).eq("id", spaceId);
  };

  const handleDelete = async (spaceId: string) => {
    if(!confirm("ยืนยันการลบพื้นที่นี้?")) return;
    await supabase.from("urban_farm_spaces").delete().eq("id", spaceId);
    fetchSpaces();
    toast({ title: "ลบพื้นที่สำเร็จ" });
  };

  // Real Stats Calculation
  const totalSpaces = spaces.length;
  const activeSpaces = spaces.filter(s => s.is_active).length;
  const totalRequests = Object.values(requestCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-20 font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/50 px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between max-w-4xl">
           <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-9 w-9 border cursor-pointer ring-2 ring-green-50">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-green-100 text-green-700 font-bold">
                {userProfile?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground leading-none">
                {userProfile?.name || "Landowner"}
              </p>
              <p className="text-[10px] text-muted-foreground">เจ้าของพื้นที่</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        
        {/* Header & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">จัดการพื้นที่</h1>
            <p className="text-slate-500 mt-1">บริหารจัดการพื้นที่และตรวจสอบคำขอเช่า</p>
          </div>
          <Button asChild className="rounded-full shadow-lg bg-green-600 hover:bg-green-700 px-6 h-11 text-base transition-transform hover:scale-105 active:scale-95">
            <Link to="/dashboard/landowner/spaces/new">
              <Plus className="mr-2 h-5 w-5" /> เพิ่มพื้นที่ใหม่
            </Link>
          </Button>
        </div>

        {/* Stats Grid (Real Data) */}
        {!loading && spaces.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                        <TreePine className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{totalSpaces}</div>
                    <div className="text-xs text-slate-500">พื้นที่ทั้งหมด</div>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{activeSpaces}</div>
                    <div className="text-xs text-slate-500">เปิดใช้งาน</div>
                </Card>
                <Card className={`border-none shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center text-center ${totalRequests > 0 ? "bg-orange-50" : "bg-white"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${totalRequests > 0 ? "bg-white text-orange-600" : "bg-slate-50 text-slate-400"}`}>
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className={`text-2xl font-bold ${totalRequests > 0 ? "text-orange-600" : "text-slate-800"}`}>{totalRequests}</div>
                    <div className="text-xs text-slate-500">คำขอรอตรวจสอบ</div>
                </Card>
            </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
            <TabsTrigger value="spaces" className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700 font-medium text-slate-500 transition-all">
               <TreePine className="w-4 h-4 mr-2" /> พื้นที่ของฉัน
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 font-medium text-slate-500 relative transition-all">
               <MessageSquare className="w-4 h-4 mr-2" /> คำขอเช่า
               {totalRequests > 0 && (
                   <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
               )}
            </TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 font-medium text-slate-500 transition-all">
               <BookOpen className="w-4 h-4 mr-2" /> คู่มือ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spaces" className="space-y-6">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map(i => <Skeleton key={i} className="h-[280px] w-full rounded-[2rem]" />)}
              </div>
            ) : spaces.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center">
                <div className="bg-green-50 p-6 rounded-full mb-6">
                    <MapPin className="h-12 w-12 text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">ยังไม่มีพื้นที่ลงทะเบียน</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">เริ่มแบ่งปันพื้นที่ว่างของคุณวันนี้ เพื่อสร้างรายได้และสังคมสีเขียว</p>
                <Button className="rounded-full h-12 px-8 text-base bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all" asChild>
                    <Link to="/dashboard/landowner/spaces/new">เพิ่มพื้นที่เลย</Link>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {spaces.map((space) => (
                  <Card key={space.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white overflow-hidden ring-1 ring-slate-100 hover:-translate-y-1">
                    <div className="p-0">
                        {/* Image Header - Fix Animation */}
                        <div className="h-40 bg-slate-100 relative overflow-hidden">
                             {space.image_url ? 
                                <img src={space.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> :
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100"><TreePine className="text-green-200 w-16 h-16" /></div>
                             }
                             
                             {/* Status Badge */}
                             <div className="absolute top-4 left-4">
                                <Badge variant={space.is_active ? "default" : "secondary"} className={`rounded-lg px-2.5 py-1 font-semibold shadow-sm backdrop-blur-md border-none ${space.is_active ? "bg-green-500/90 hover:bg-green-600 text-white" : "bg-slate-500/80 text-white"}`}>
                                  {space.is_active ? "• เปิดใช้งาน" : "• ปิดชั่วคราว"}
                                </Badge>
                             </div>

                             {/* Edit Button (Visible on Hover) */}
                             <Link to={`/dashboard/landowner/spaces/${space.id}/edit`} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-slate-600 hover:text-green-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                <Edit className="w-4 h-4" />
                             </Link>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold line-clamp-1 text-slate-800 group-hover:text-green-700 transition-colors mb-2">{space.title}</h3>
                          
                          <div className="flex items-center text-slate-500 text-sm mb-6 bg-slate-50 p-2 rounded-lg">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-green-500 shrink-0" />
                            <span className="truncate">{space.address}</span>
                          </div>

                          <div className="flex gap-2 mt-auto">
                            <Button variant="outline" size="sm" className={`flex-1 rounded-xl border-slate-200 h-10 ${space.is_active ? 'text-slate-600 hover:bg-slate-50' : 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'}`} onClick={() => handleToggleActive(space.id, space.is_active)}>
                              {space.is_active ? <><EyeOff className="h-4 w-4 mr-2" /> ซ่อนพื้นที่</> : <><Eye className="h-4 w-4 mr-2" /> แสดงพื้นที่</>}
                            </Button>
                             <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 border border-transparent hover:border-red-100" onClick={() => handleDelete(space.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* New Requests Notification */}
                          {requestCounts[space.id] > 0 && (
                             <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                <Button variant="ghost" className="w-full text-white bg-orange-500 hover:bg-orange-600 hover:shadow-md rounded-xl justify-between h-10 px-4 transition-all" onClick={() => setActiveTab("requests")}>
                                    <span className="text-xs font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4 fill-white" /> มี {requestCounts[space.id]} คำขอใหม่</span>
                                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">ตรวจสอบเลย</span>
                                </Button>
                             </div>
                          )}
                        </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
             <LandownerRequests />
          </TabsContent>

          <TabsContent value="guide">
             <GuideSection role="landowner" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}