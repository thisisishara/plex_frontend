import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const sourceName = formData.get('sourceName') as string;

  if (!file || !sourceName) {
    return NextResponse.json({ success: false, message: 'File and source name are required.' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, `${sourceName}.txt`);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, fileBuffer);

  return NextResponse.json({ success: true, message: 'File uploaded successfully!' });
}