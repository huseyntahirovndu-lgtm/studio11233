import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { lookup } from 'mime-types';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const { filename } = params;

  // Path Traversal hücumlarının qarşısını almaq üçün təhlükəsizlik yoxlaması
  const safeFilename = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
  if (safeFilename !== filename) {
    return NextResponse.json({ error: 'Giriş qadağandır' }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', 'senedler', safeFilename);

  try {
    // Faylın mövcudluğunu yoxla
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Fayl tapılmadı' }, { status: 404 });
    }

    // Faylı oxu
    const fileBuffer = fs.readFileSync(filePath);

    // Mime növünü təyin et
    const mimeType = lookup(filePath) || 'application/octet-stream';

    // Faylı düzgün header ilə qaytar
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        // 'attachment' faylı yükləməyə, 'inline' isə göstərməyə məcbur edir
        'Content-Disposition': `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    console.error('Fayl göstərmə xətası:', error);
    return NextResponse.json({ error: 'Daxili server xətası' }, { status: 500 });
  }
}
