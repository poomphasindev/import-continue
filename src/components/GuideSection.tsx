import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Sprout, MessageSquare, CheckCircle2, UserPlus } from "lucide-react";

interface GuideSectionProps {
  role: "landowner" | "gardener";
}

export function GuideSection({ role }: GuideSectionProps) {
  if (role === "landowner") {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-lg text-green-700 flex items-center gap-2"><UserPlus className="w-5 h-5" /> 1. เริ่มต้น</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-600">ลงทะเบียนและยืนยันตัวตน เพื่อเข้าใช้งาน Dashboard สำหรับจัดการพื้นที่</CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-lg text-green-700 flex items-center gap-2"><MapPin className="w-5 h-5" /> 2. เพิ่มพื้นที่</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-600">กดปุ่ม "เพิ่มพื้นที่" อัปโหลดรูปภาพ ระบุขนาดและสิ่งอำนวยความสะดวกให้ชัดเจน</CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-lg text-green-700 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> 3. อนุมัติ</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-600">ตรวจสอบคำขอเช่า พูดคุยผ่านแชท และกด "อนุมัติ" เพื่อเริ่มสัญญา</CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="text-base text-slate-800">คำถามที่พบบ่อย (FAQ)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="px-6 border-b">
                <AccordionTrigger className="hover:no-underline hover:text-green-600">ต้องเตรียมเอกสารอะไรบ้าง?</AccordionTrigger>
                <AccordionContent className="text-slate-500">
                  เบื้องต้นใช้เพียงรูปถ่ายพื้นที่จริง และรายละเอียดโฉนด (ถ้ามี) เพื่อความน่าเชื่อถือ
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="px-6 border-b">
                <AccordionTrigger className="hover:no-underline hover:text-green-600">ปฏิเสธคำขอได้ไหม?</AccordionTrigger>
                <AccordionContent className="text-slate-500">
                  ได้ คุณสามารถปฏิเสธคำขอที่ไม่ตรงตามเงื่อนไขได้ตลอดเวลาก่อนการอนุมัติ
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-lg text-emerald-700 flex items-center gap-2"><Sprout className="w-5 h-5" /> 1. ค้นหา</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">สำรวจพื้นที่ว่างใกล้ตัวคุณ ดูรายละเอียดและกฎระเบียบต่างๆ</CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-lg text-emerald-700 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> 2. ส่งคำขอ</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">กด "ขอเช่าพื้นที่" แนะนำตัวกับเจ้าของที่ และรอการตอบรับ</CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-lg text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> 3. เริ่มปลูก</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">เมื่ออนุมัติ กดปุ่ม "เริ่มปลูก" เพื่อเริ่มนับเวลาใช้งานพื้นที่</CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-base text-slate-800">คำแนะนำสำหรับนักปลูก</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
             <AccordionItem value="item-1" className="px-6 border-b">
                <AccordionTrigger className="hover:no-underline hover:text-emerald-600">ถ้าพื้นที่ไม่ตรงปกทำอย่างไร?</AccordionTrigger>
                <AccordionContent className="text-slate-500">
                  แนะนำให้นัดดูพื้นที่จริงก่อนกด "เริ่มปลูก" ในระบบ หากไม่ตรงปกสามารถยกเลิกคำขอได้
                </AccordionContent>
              </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}