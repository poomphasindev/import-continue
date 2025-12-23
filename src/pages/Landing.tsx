import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sprout, MapPin, TreePine, ArrowRight, LayoutDashboard, LogOut, Cloud, Sun, Leaf, Heart, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function Landing() {
  const { user, userRole, signOut } = useAuth();
  const [greeting, setGreeting] = useState("สวัสดี");
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("อรุณสวัสดิ์");
    else if (hour < 17) setGreeting("สวัสดีตอนบ่าย");
    else setGreeting("สวัสดีตอนเย็น");

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setUserProfile(data);
      };
      fetchProfile();
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Decoration (เก็บไว้เพราะน่ารักและไม่รก) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] text-green-200 animate-float-slow opacity-50"><Cloud className="w-24 h-24" /></div>
        <div className="absolute top-[15%] right-[10%] text-yellow-200 animate-pulse-soft opacity-60"><Sun className="w-32 h-32" /></div>
        <div className="absolute bottom-[20%] left-[10%] text-emerald-100 animate-float delay-700"><Leaf className="w-16 h-16 rotate-12" /></div>
        <div className="absolute bottom-[10%] right-[5%] text-primary/10 animate-float-slow delay-1000"><TreePine className="w-40 h-40" /></div>
      </div>

      {/* Navbar */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"}`}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-tr from-green-400 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-300">
              <TreePine className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-700 group-hover:text-primary transition-colors">
              Urban Farm <span className="text-primary">Share</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden md:flex text-slate-500 hover:text-primary hover:bg-green-50 rounded-full px-4 gap-2 transition-all">
                <Link to="/guide"><BookOpen className="w-4 h-4" /> คู่มือการใช้งาน</Link>
            </Button>
            {user ? (
              <Button variant="ghost" onClick={() => signOut()} className="text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full px-4">
                <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
              </Button>
            ) : (
              <Button asChild className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white transition-all px-6 h-11 hover:scale-105 active:scale-95">
                <Link to="/auth">เข้าสู่ระบบ / สมัครสมาชิก</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col justify-center">
        {user ? (
          // --- Logged In View ---
          <section className="py-20 px-4 min-h-[80vh] flex flex-col justify-center items-center">
            <div className="container mx-auto max-w-4xl text-center">
              <Link to="/profile">
                <div className="relative inline-block mb-8 group cursor-pointer">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
                  <Avatar className="h-28 w-28 mx-auto border-[6px] border-white shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
                    <AvatarImage src={userProfile?.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-green-50 to-emerald-100 text-primary text-4xl font-bold">
                      {userProfile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-lg border border-slate-100 z-20 animate-bounce">
                    {userRole === 'landowner' ? <MapPin className="h-6 w-6 text-orange-500" /> : <Sprout className="h-6 w-6 text-green-500" />}
                  </div>
                </div>
              </Link>
              
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-800 tracking-tight animate-in slide-in-from-bottom-4 duration-700">
                {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500">{userProfile?.name || user.email?.split('@')[0]}</span> !👋
              </h1>
              <p className="text-xl text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed animate-in slide-in-from-bottom-5 delay-150 duration-700">
                วันนี้อากาศดีนะ! พร้อมที่จะ {userRole === 'landowner' ? 'ดูแลพื้นที่ของคุณ' : 'ไปดูผักที่ปลูกไว้'} หรือยัง?
              </p>

              <div className="flex justify-center animate-in zoom-in-95 delay-300 duration-500">
                <Link to={userRole === 'landowner' ? "/dashboard/landowner" : "/dashboard/gardener"}>
                  <div className="group relative w-full max-w-sm">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
                    <div className="relative bg-white rounded-3xl p-8 flex items-center justify-between shadow-xl hover:translate-y-[-4px] transition-all duration-300 cursor-pointer border border-slate-100">
                      <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                          <LayoutDashboard className="h-8 w-8" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-slate-800">Dashboard</h3>
                          <p className="text-slate-500 text-sm group-hover:text-green-600 transition-colors">เข้าสู่ระบบจัดการ</p>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-green-100 group-hover:text-green-600 transition-all">
                        <ArrowRight className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          // --- Public Landing View (Clean Version) ---
          <section className="relative py-20 px-4 min-h-[85vh] flex flex-col justify-center">
            <div className="container mx-auto text-center max-w-5xl space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-green-100 shadow-md text-green-700 text-sm font-semibold mb-4 animate-in fade-in slide-in-from-top-4 duration-700 hover:scale-105 transition-transform cursor-default">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                พื้นที่สีเขียวเพื่อทุกคนในเมือง
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance leading-[1.1] text-slate-900 animate-in slide-in-from-bottom-8 duration-700">
                เปลี่ยนพื้นที่ว่าง <br className="hidden md:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-500 drop-shadow-sm">
                  ให้กลายเป็นฟาร์มสุข
                </span>
              </h1>

              <p className="text-xl text-slate-500 max-w-2xl mx-auto text-balance leading-relaxed animate-in slide-in-from-bottom-8 delay-150 duration-700">
                แพลตฟอร์มจับคู่ระหว่าง <strong className="text-green-600">เจ้าของที่ดิน</strong> และ <strong className="text-emerald-600">นักปลูกผัก</strong> เพื่อสร้างแหล่งอาหารปลอดภัยและสังคมที่ยั่งยืน
              </p>

              {/* Role Cards (จุดสำคัญที่ต้องเด่น) */}
              <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-4xl mx-auto animate-in slide-in-from-bottom-10 delay-300 duration-700">
                <Link to="/auth?role=landowner&tab=signup" className="group">
                  <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
                    <CardContent className="p-10 flex flex-col items-center text-center h-full">
                      <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <MapPin className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-slate-800">ฉันมีพื้นที่ว่าง</h3>
                      <p className="text-slate-500 mb-8 leading-relaxed">มีที่ดินว่างเปล่า? เปลี่ยนให้เป็นประโยชน์และรายได้</p>
                      <Button variant="outline" className="w-full mt-auto h-12 rounded-2xl border-2 border-green-100 text-green-700 hover:bg-green-50 hover:border-green-200 text-base font-semibold group-hover:bg-green-600 group-hover:text-white group-hover:border-transparent transition-all">
                        ลงทะเบียนเจ้าของพื้นที่
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/auth?role=gardener&tab=signup" className="group">
                  <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                    <CardContent className="p-10 flex flex-col items-center text-center h-full">
                      <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                        <Sprout className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-slate-800">ฉันอยากปลูกผัก</h3>
                      <p className="text-slate-500 mb-8 leading-relaxed">ไม่มีพื้นที่ไม่ใช่ปัญหา ค้นหาแปลงผักใกล้ตัวคุณ</p>
                      <Button variant="outline" className="w-full mt-auto h-12 rounded-2xl border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 text-base font-semibold group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent transition-all">
                        ลงทะเบียนนักปลูก
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="py-8 bg-white border-t border-slate-100 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-full animate-float">
              <Heart className="h-6 w-6 text-red-400 fill-red-400" />
            </div>
            <p className="font-bold text-lg text-slate-800">Urban Farm Share</p>
          </div>
          <p className="text-sm text-slate-500">โครงการวิจัยวิชาชีพเพื่อสังคมเมืองสีเขียว</p>
          <p className="text-xs text-slate-400 mt-2">วิทยาลัยเทคนิคธัญบุรี | สำนักงานคณะกรรมการอาชีวศึกษา</p>
        </div>
      </footer>
    </div>
  );
}