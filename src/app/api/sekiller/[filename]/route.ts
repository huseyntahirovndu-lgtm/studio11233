import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filePath = path.join(process.cwd(), 'api', 'sekiller', filename);

    // Faylın mövcudluğunu yoxla
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Fayl tapılmadı' },
        { status: 404 }
      );
    }

    // Faylı oxu
    const fileBuffer = await fs.readFile(filePath);
    
    // MIME type təyin et
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Faylı qaytар
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Şəkil yükləmə xətası:', error);
    return NextResponse.json(
      { error: 'Server xətası' },
      { status: 500 }
    );
  }
}
