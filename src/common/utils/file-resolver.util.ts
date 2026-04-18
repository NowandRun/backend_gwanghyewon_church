import { FileUpload } from 'graphql-upload-ts';

export class FileResolver {
  /**
   * GraphQL Upload 스트림을 Express.Multer.File 형식의 버퍼로 변환합니다.
   */
  static async resolveFiles(files: Promise<FileUpload>[]): Promise<Express.Multer.File[]> {
    return Promise.all(
      files.map(async (filePromise) => {
        const { createReadStream, filename, mimetype } = await filePromise;
        const stream = createReadStream();

        const buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });

        return {
          fieldname: 'file',
          originalname: filename,
          encoding: '7bit',
          mimetype,
          size: buffer.length,
          buffer,
        } as Express.Multer.File;
      }),
    );
  }
}