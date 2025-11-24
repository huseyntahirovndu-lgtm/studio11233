import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const slugify = (text: string) => {
  const azeToEng: { [key: string]: string } = {
    'ə': 'e', 'ç': 'c', 'ı': 'i', 'ğ': 'g', 'ö': 'o', 'ş': 's', 'ü': 'u',
  };
  return text
    .toLowerCase()
    .split('')
    .map(char => azeToEng[char] || char)
    .join('')
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

export async function handleFileUpload(req: Request, type: 'sekiller' | 'senedler') {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Fayl tapılmadı' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const originalName = file.name || 'fayl';
    const safeName = slugify(path.parse(originalName).name);
    const uniqueId = uuidv4().substring(0, 8);
    const extension = path.extname(originalName) || '.dat';
    const newFilename = `${safeName}-${uniqueId}${extension}`;
    const filePath = path.join(uploadDir, newFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const url = `/api/${type}/${newFilename}`;

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error(`${type} yükləmə xətası:`, error);
    return NextResponse.json({ success: false, error: `Server xətası: ${error.message}` }, { status: 500 });
  }
}
