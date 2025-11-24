import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

// Azərbaycan hərflərini ingilis hərflərinə çevir
const slugify = (text: string): string => {
  const azeToEng: { [key: string]: string } = {
    'ə': 'e', 'Ə': 'E',
    'ç': 'c', 'Ç': 'C',
    'ı': 'i', 'I': 'I',
    'ğ': 'g', 'Ğ': 'G',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };
  
  return text
    .split('')
    .map(char => azeToEng[char] || char)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Fayl validasiyası
const validateFile = (file: File, type: 'sekiller' | 'senedler') => {
  const maxSize = 20 * 1024 * 1024; // 20MB (10-dan 20-yə dəyişdim)
  
  const allowedTypes = {
    sekiller: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    senedler: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  };

  if (file.size > maxSize) {
    return { valid: false, error: 'Fayl həcmi 20MB-dan çox ola bilməz' }; // Xəta mesajını da dəyişdim
  }

  if (!allowedTypes[type].includes(file.type)) {
    return { 
      valid: false, 
      error: type === 'sekiller' 
        ? 'Yalnız şəkil faylları (JPG, PNG, WEBP, GIF) yükləyə bilərsiniz' 
        : 'Yalnız sənəd faylları (PDF, DOC, DOCX, XLS, XLSX) yükləyə bilərsiniz'
    };
  }

  return { valid: true };
};

export async function handleFileUpload(req: Request, type: 'sekiller' | 'senedler') {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fayl tapılmadı' }, 
        { status: 400 }
      );
    }

    // Fayl validasiyası
    const validation = validateFile(file, type);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error }, 
        { status: 400 }
      );
    }

    // Yükləmə qovluğunu yarat
    const uploadDir = path.join(process.cwd(), 'api', type);
    await fs.mkdir(uploadDir, { recursive: true });

    // Fayl adını hazırla
    const originalName = file.name || 'fayl';
    const safeName = slugify(path.parse(originalName).name);
    const uniqueId = randomBytes(4).toString('hex');
    const extension = path.extname(originalName).toLowerCase() || '.dat';
    const newFilename = `${safeName}-${uniqueId}${extension}`;
    const filePath = path.join(uploadDir, newFilename);

    // Faylı yaz
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // URL qaytар
    const url = `/api/${type}/${newFilename}`;
    
    return NextResponse.json({ 
      success: true, 
      url,
      filename: newFilename,
      size: file.size,
      type: file.type
    });

  } catch (error: any) {
    console.error(`${type} yükləmə xətası:`, error);
    return NextResponse.json(
      { success: false, error: 'Server xətası baş verdi' }, 
      { status: 500 }
    );
  }
}
