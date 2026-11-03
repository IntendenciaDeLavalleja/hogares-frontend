import type { DocumentType } from '../types/application'

// Keep a session-only copy for retries; reset/submission releases these files.
const preparedFiles = new Map<DocumentType, File>()

export function setPreparedDocumentFile(type: DocumentType, file: File): void {
  preparedFiles.set(type, file)
}

export function getPreparedDocumentFile(type: DocumentType): File | undefined {
  return preparedFiles.get(type)
}

export function removePreparedDocumentFile(type: DocumentType): void {
  preparedFiles.delete(type)
}

export function clearPreparedDocumentFiles(): void {
  preparedFiles.clear()
}
