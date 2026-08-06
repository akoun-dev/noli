/**
 * Centralised, defensive validation for user file uploads.
 *
 * The previous upload path (DocumentsPage) trusted the browser-supplied
 * `file.type` and pushed the raw `file.name` straight into Supabase Storage,
 * with no size limit and no content check. This module replaces that with:
 *
 *   - an allowlist keyed on the file *extension* AND the declared MIME type,
 *   - a magic-byte (file signature) sniff for the binary types, so a `.exe`
 *     renamed to `.pdf` (or an HTML/SVG payload) is rejected regardless of the
 *     spoofable MIME header,
 *   - an enforced maximum size (VITE_MAX_FILE_SIZE, default 10 MiB),
 *   - a safe, non-guessable storage key so path traversal and overwrites are
 *     impossible.
 *
 * Client-side validation is a first line of defence only; the Storage bucket
 * RLS policies and the bucket-level size / MIME limits (see
 * supabase/migrations/20251121001000_storage_documents_security.sql) are the
 * authoritative server-side control.
 */

export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MiB

export function getMaxFileSize(): number {
  const raw = import.meta.env?.VITE_MAX_FILE_SIZE
  const parsed = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_FILE_SIZE
}

interface AllowedType {
  /** Accepted lowercase extensions (without the dot). */
  extensions: string[]
  /** Accepted MIME types as declared by the browser. */
  mimeTypes: string[]
  /**
   * Magic-byte matcher. Receives the first bytes of the file and returns true
   * when the signature is valid. Omitted for formats we cannot reliably sniff
   * (e.g. legacy .doc / OOXML zip containers), which fall back to
   * extension+MIME agreement only.
   */
  signature?: (bytes: Uint8Array) => boolean
}

const startsWith = (bytes: Uint8Array, sig: number[]): boolean =>
  sig.every((b, i) => bytes[i] === b)

export const ALLOWED_DOCUMENT_TYPES: AllowedType[] = [
  {
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
    // "%PDF"
    signature: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]),
  },
  {
    extensions: ['jpg', 'jpeg'],
    mimeTypes: ['image/jpeg', 'image/jpg'],
    // JPEG SOI marker
    signature: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  {
    extensions: ['png'],
    mimeTypes: ['image/png'],
    signature: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    extensions: ['doc'],
    mimeTypes: ['application/msword'],
    // OLE compound file header (D0 CF 11 E0)
    signature: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]),
  },
  {
    extensions: ['docx'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    // OOXML is a ZIP container ("PK\x03\x04")
    signature: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  },
]

export const ACCEPTED_UPLOAD_ATTR = '.pdf,.jpg,.jpeg,.png,.doc,.docx'

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : ''
}

/**
 * Read the leading bytes of a file for signature checking.
 * Kept small; 16 bytes is enough for every signature above.
 */
async function readMagicBytes(file: File, length = 16): Promise<Uint8Array> {
  const slice = file.slice(0, length)

  // Prefer Blob.arrayBuffer() (browsers, Node/undici); fall back to FileReader
  // for environments where it is unavailable (e.g. jsdom in unit tests).
  if (typeof slice.arrayBuffer === 'function') {
    try {
      return new Uint8Array(await slice.arrayBuffer())
    } catch {
      // fall through to FileReader
    }
  }

  return await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsArrayBuffer(slice)
  })
}

/**
 * Validate a single file against the document allowlist.
 *
 * Performs synchronous checks (size, extension, MIME agreement) and, when a
 * signature matcher exists for the type, an async magic-byte check.
 */
export async function validateUploadFile(
  file: File,
  options: { maxSize?: number } = {}
): Promise<FileValidationResult> {
  const maxSize = options.maxSize ?? getMaxFileSize()

  if (file.size === 0) {
    return { isValid: false, error: 'Le fichier est vide.' }
  }

  if (file.size > maxSize) {
    const mb = Math.round(maxSize / (1024 * 1024))
    return { isValid: false, error: `Le fichier ne doit pas dépasser ${mb} Mo.` }
  }

  const ext = getExtension(file.name)
  const match = ALLOWED_DOCUMENT_TYPES.find((t) => t.extensions.includes(ext))

  if (!match) {
    return {
      isValid: false,
      error: 'Type de fichier non supporté. Types acceptés : PDF, JPG, PNG, DOC, DOCX.',
    }
  }

  // The browser-declared MIME type must also be one we expect for this
  // extension (some browsers send an empty string for uncommon types; we allow
  // empty and rely on the signature check below instead of rejecting outright).
  if (file.type && !match.mimeTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: "Le type déclaré du fichier ne correspond pas à son extension.",
    }
  }

  if (match.signature) {
    try {
      const bytes = await readMagicBytes(file)
      if (!match.signature(bytes)) {
        return {
          isValid: false,
          error: "Le contenu du fichier ne correspond pas à son extension.",
        }
      }
    } catch {
      return { isValid: false, error: 'Impossible de lire le fichier pour vérification.' }
    }
  }

  return { isValid: true }
}

/**
 * Build a safe, collision-resistant storage key for a user's upload.
 *
 * Layout: `<userId>/<uuid>.<ext>`. The original name is never used in the path,
 * which removes any path-traversal (`../`), control-character or overwrite risk.
 * The original name should be persisted separately as metadata for display.
 */
export function buildSafeStorageKey(userId: string, fileName: string): string {
  const ext = getExtension(fileName)
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
  const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : ''
  return `${userId}/${uuid}${safeExt}`
}
