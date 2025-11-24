import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Fayl tapılmadı' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'sekiller');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const originalName = file.name || 'fayl';
  const safeName = slugify(path.parse(originalName).name);
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  const newFilename = `${safeName}_${timestamp}${extension}`;
  const filePath = path.join(uploadDir, newFilename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const url = `${baseUrl}/api/sekiller/${newFilename}`;

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Şəkil yükləmə xətası:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
