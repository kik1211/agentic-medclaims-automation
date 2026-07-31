export interface FileUploadInput {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StoredFile {
  filePath: string;
  fileName: string;
  fileSize: number;
}

export interface IStorageService {
  save(claimId: string, file: FileUploadInput): Promise<StoredFile>;
  delete(filePath: string): Promise<boolean>;
  exists(filePath: string): Promise<boolean>;
  getPath(filePath: string): string;
}
