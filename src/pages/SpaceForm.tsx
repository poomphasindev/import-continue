import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Calendar as CalendarIcon, MapPin, Leaf, ShieldAlert, ImagePlus, Ruler, X, DollarSign, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FARM_TYPES = ["สวนหลังบ้าน", "ดาดฟ้าตึก", "ที่ดินว่างเปล่า", "ระเบียงคอนโด", "สวนในหมู่บ้าน", "อื่นๆ"];
const AREA_UNITS = ["ตร.ม.", "ตร.ว.", "งาน", "ไร่"];
const PRICE_UNITS = ["บาท/เดือน", "บาท/ปี", "บาท/รอบการปลูก", "แบ่งผลผลิต (ไม่มีค่าใช้จ่าย)"];
const SUN_TYPES = ["แดดจัดตลอดวัน (Full Sun)", "แดดครึ่งวันเช้า", "แดดครึ่งวันบ่าย", "ร่มรำไร / แสงน้อย (Shade)"];
const AMENITIES = ["แหล่งน้ำ", "อุปกรณ์ทำสวน", "แสงแดดเต็มวัน", "ร่มเงา", "รั้วรอบขอบชิด", "ถังหมักปุ๋ย", "ที่จอดรถ", "ห้องน้ำ", "กล้องวงจรปิด", "Wi-Fi"];

export default function SpaceForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  
  const [areaValue, setAreaValue] = useState("");
  const [areaUnit, setAreaUnit] = useState("ตร.ม.");

  const [form, setForm] = useState({
    title: "",
    description: "", // เพิ่มช่องนี้
    address: "",
    tags: "",
    farm_type: "",
    available_from: "",
    available_to: "",
    rules: "",
    amenities: [] as string[],
    price: "",
    price_unit: "บาท/เดือน",
    sunlight: "" // เพิ่มช่องนี้
  });
  
  // Gallery Logic
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing && user) fetchSpace();
  }, [id, user]);

  const fetchSpace = async () => {
    const { data, error } = await supabase.from("urban_farm_spaces").select("*").eq("id", id).single();
    if (!error && data) {
      let loadedAreaValue = "", loadedAreaUnit = "ตร.ม.";
      if (data.area_size) {
        const parts = data.area_size.split(" ");
        if (parts.length >= 2) { loadedAreaValue = parts[0]; loadedAreaUnit = parts[1]; } 
        else { loadedAreaValue = data.area_size; }
      }

      setAreaValue(loadedAreaValue);
      setAreaUnit(loadedAreaUnit);
      setForm({
        title: data.title,
        description: data.description || "",
        address: data.address,
        tags: data.tags || "",
        farm_type: data.farm_type || "",
        available_from: data.available_from || "",
        available_to: data.available_to || "",
        rules: data.rules || "",
        amenities: data.amenities || [],
        price: data.price ? data.price.toString() : "",
        price_unit: data.price_unit || "บาท/เดือน",
        sunlight: data.sunlight || "" // ดึงข้อมูลแดด
      });
      
      const images = data.gallery || (data.image_url ? [data.image_url] : []);
      setExistingGallery(images);
    }
    setFetching(false);
  };

  const handleAmenityChange = (item: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(item) ? prev.amenities.filter(i => i !== item) : [...prev.amenities, item]
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + galleryFiles.length + existingGallery.length > 5) {
      toast({ title: "จำกัดรูปภาพ", description: "อัปโหลดได้สูงสุด 5 รูป", variant: "destructive" });
      return;
    }
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setGalleryFiles(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.address.trim()) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกชื่อและที่อยู่", variant: "destructive" });
      return;
    }

    setLoading(true);

    const uploadedUrls: string[] = [];
    for (const file of galleryFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('farm-images').upload(filePath, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('farm-images').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }

    const finalGallery = [...existingGallery, ...uploadedUrls];
    const mainImage = finalGallery.length > 0 ? finalGallery[0] : null;

    const spaceData = { 
      ...form, 
      area_size: `${areaValue} ${areaUnit}`,
      owner_id: user!.id,
      image_url: mainImage,
      gallery: finalGallery,
      price: parseFloat(form.price) || 0
    };

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase.from("urban_farm_spaces").update(spaceData).eq("id", id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("urban_farm_spaces").insert(spaceData);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "สำเร็จ", description: "บันทึกข้อมูลพื้นที่เรียบร้อยแล้ว" });
      navigate("/dashboard/landowner");
    }
  };

  if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="container mx-auto max-w-2xl flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{isEditing ? "แก้ไขข้อมูลพื้นที่" : "ลงทะเบียนพื้นที่ใหม่"}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Gallery Section */}
          <Card className="shadow-sm border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 border-b p-4 flex items-center gap-2 font-semibold text-slate-700">
               <ImagePlus className="w-5 h-5 text-primary" /> รูปภาพพื้นที่ (สูงสุด 5 รูป)
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {existingGallery.map((url, idx) => (
                  <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border">
                    <img src={url} alt="Existing" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {galleryPreviews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group border border-primary/20">
                    <img src={url} alt="New" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(existingGallery.length + galleryFiles.length < 5) && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <ImagePlus className="w-8 h-8 text-slate-400" />
                    <span className="text-xs text-slate-500 mt-2">เพิ่มรูปภาพ</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="shadow-sm border-slate-200 rounded-2xl overflow-hidden">
             <div className="bg-slate-50 border-b p-4 flex items-center gap-2 font-semibold text-slate-700">
               <MapPin className="w-5 h-5 text-primary" /> ข้อมูลทั่วไป
            </div>
            <CardContent className="p-6 space-y-4">
               <div>
                  <Label>ชื่อพื้นที่ *</Label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="เช่น สวนผักหลังบ้านลาดพร้าว" className="h-11 rounded-xl mt-1.5" required />
               </div>
               
               {/* Description Field (New!) */}
               <div>
                  <Label>รายละเอียดพื้นที่ *</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="อธิบายเกี่ยวกับพื้นที่ของคุณ เช่น ดินดีไหม น้ำท่วมไหม..." className="rounded-xl mt-1.5" rows={4} required />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>ประเภท</Label>
                    <Select value={form.farm_type} onValueChange={v => setForm({...form, farm_type: v})}>
                      <SelectTrigger className="h-11 rounded-xl mt-1.5"><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
                      <SelectContent>{FARM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ขนาดพื้นที่</Label>
                    <div className="flex gap-2 mt-1.5">
                        <div className="relative flex-1">
                            <Ruler className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" value={areaValue} onChange={e => setAreaValue(e.target.value)} placeholder="ระบุขนาด" className="pl-9 h-11 rounded-xl" />
                        </div>
                        <Select value={areaUnit} onValueChange={setAreaUnit}>
                          <SelectTrigger className="w-[100px] h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>{AREA_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                  </div>
               </div>
               
               <div>
                  <Label>ที่อยู่ / จุดสังเกต *</Label>
                  <Textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="รายละเอียดที่ตั้ง..." className="rounded-xl mt-1.5" rows={2} required />
               </div>
               
               <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <Label className="text-green-800">ค่าเช่า / ค่าใช้จ่าย</Label>
                  <div className="flex gap-2 mt-2">
                     <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-green-600" />
                        <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="เช่น 1500" className="pl-9 h-11 rounded-xl border-green-200 focus-visible:ring-green-500" />
                     </div>
                     <Select value={form.price_unit} onValueChange={v => setForm({...form, price_unit: v})}>
                        <SelectTrigger className="w-[160px] h-11 rounded-xl border-green-200"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRICE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                     </Select>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Details & Sunlight Section */}
          <Card className="shadow-sm border-slate-200 rounded-2xl overflow-hidden">
             <div className="bg-slate-50 border-b p-4 flex items-center gap-2 font-semibold text-slate-700">
               <Leaf className="w-5 h-5 text-primary" /> สภาพแวดล้อม & สิ่งอำนวยความสะดวก
            </div>
            <CardContent className="p-6 space-y-5">
               
               {/* Sunlight Field (New!) */}
               <div>
                  <Label>สภาพแสงแดด (สำคัญสำหรับพืช)</Label>
                  <div className="relative mt-1.5">
                    <Sun className="absolute left-3 top-3.5 h-4 w-4 text-orange-500" />
                    <Select value={form.sunlight} onValueChange={v => setForm({...form, sunlight: v})}>
                        <SelectTrigger className="pl-9 h-11 rounded-xl"><SelectValue placeholder="เลือกสภาพแสงแดด" /></SelectTrigger>
                        <SelectContent>{SUN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ว่างตั้งแต่</Label>
                    <div className="relative mt-1.5"><CalendarIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-9 h-11 rounded-xl" value={form.available_from} onChange={e => setForm({...form, available_from: e.target.value})} /></div>
                  </div>
                  <div>
                    <Label>ถึงวันที่</Label>
                    <div className="relative mt-1.5"><CalendarIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-9 h-11 rounded-xl" value={form.available_to} onChange={e => setForm({...form, available_to: e.target.value})} /></div>
                  </div>
               </div>
               
               <div>
                  <Label className="mb-3 block">สิ่งอำนวยความสะดวก</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AMENITIES.map(item => (
                      <div key={item} className={`flex items-center space-x-2 border rounded-xl p-3 transition-all cursor-pointer ${form.amenities.includes(item) ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}>
                        <Checkbox id={item} checked={form.amenities.includes(item)} onCheckedChange={() => handleAmenityChange(item)} />
                        <label htmlFor={item} className="text-sm cursor-pointer w-full select-none">{item}</label>
                      </div>
                    ))}
                  </div>
               </div>

               <div>
                 <Label className="mb-2 block flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> กฎระเบียบเพิ่มเติม</Label>
                 <Textarea value={form.rules} onChange={e => setForm({...form, rules: e.target.value})} placeholder="เช่น ห้ามส่งเสียงดังหลัง 2 ทุ่ม..." className="rounded-xl" rows={3} />
               </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => navigate(-1)}>ยกเลิก</Button>
            <Button type="submit" className="flex-1 h-12 rounded-xl shadow-lg bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "บันทึกข้อมูล"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}