import { handleFileUpload } from '@/lib/upload-handler';

export async function POST(req: Request) {
  return handleFileUpload(req, 'sekiller');
}
