import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class FileStorageService {
  private baseDir = './uploads';

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, 'patients'),
      path.join(this.baseDir, 'staff'),
      path.join(this.baseDir, 'organizations'),
      path.join(this.baseDir, 'documents'),
      path.join(this.baseDir, 'medical')
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async saveFile(buffer: Buffer, originalName: string, category: 'patients' | 'staff' | 'organizations' | 'documents' | 'medical'): Promise<string> {
    const fileId = randomUUID();
    const extension = path.extname(originalName);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(this.baseDir, category, fileName);

    await fs.writeFile(filePath, buffer);
    return fileName;
  }

  async getFile(fileName: string, category: 'patients' | 'staff' | 'organizations' | 'documents' | 'medical'): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.baseDir, category, fileName);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(fileName: string, category: 'patients' | 'staff' | 'organizations' | 'documents' | 'medical'): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, category, fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getFileUrl(fileName: string, category: 'patients' | 'staff' | 'organizations' | 'documents' | 'medical'): string {
    return `/api/files/${category}/${fileName}`;
  }
}

export const fileStorage = new FileStorageService();