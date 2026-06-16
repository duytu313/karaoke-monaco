import { NextResponse } from "next/server";
import { initializeCollections } from "@/lib/database-schema";

export async function GET() {
  try {
    // Hàm này sẽ ghi dữ liệu vào Realtime Database
    await initializeCollections();
    
    return NextResponse.json({ 
      message: "Khởi tạo dữ liệu thành công! Hãy kiểm tra Realtime Database trên Firebase Console." 
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Lỗi seeding", error: error.message }, { status: 500 });
  }
}