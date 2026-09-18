import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Support both single file ('file') and multiple files ('files' or multiple 'file' entries)
    const rawFiles: (FormDataEntryValue | null)[] = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ];

    const files: File[] = rawFiles.filter(
      (item): item is File => item instanceof File && item.size > 0
    );

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const uploadedResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate safe unique filename with random suffix to prevent collisions in same millisecond
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const filename = `${Date.now()}-${i}-${randomSuffix}-${safeName}`;
      const filePath = path.join(uploadsDir, filename);

      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/${filename}`;
      uploadedResults.push({
        fileUrl,
        fileName: file.name,
        fileType: file.type || 'image/jpeg',
      });
    }

    // Return both multi-file list and backward-compatible single file properties
    const first = uploadedResults[0];
    return NextResponse.json({
      success: true,
      fileUrl: first?.fileUrl,
      fileName: first?.fileName,
      fileType: first?.fileType,
      files: uploadedResults,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to upload file' }, { status: 500 });
  }
}
