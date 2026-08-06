import { describe, it, expect } from 'vitest'
import {
  validateUploadFile,
  buildSafeStorageKey,
  getMaxFileSize,
  DEFAULT_MAX_FILE_SIZE,
} from '../file-upload'

// Helpers to build File objects with a controlled byte signature.
const PDF_SIG = [0x25, 0x50, 0x44, 0x46] // %PDF
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIG = [0xff, 0xd8, 0xff]

function makeFile(
  name: string,
  type: string,
  leadingBytes: number[] = [],
  size = 1024
): File {
  const head = new Uint8Array(leadingBytes)
  const tail = new Uint8Array(Math.max(0, size - head.length))
  return new File([head, tail], name, { type })
}

describe('validateUploadFile', () => {
  it('accepts a genuine PDF (extension + MIME + signature agree)', async () => {
    const file = makeFile('devis.pdf', 'application/pdf', PDF_SIG)
    expect(await validateUploadFile(file)).toEqual({ isValid: true })
  })

  it('accepts a genuine PNG and JPEG', async () => {
    expect(
      (await validateUploadFile(makeFile('a.png', 'image/png', PNG_SIG))).isValid
    ).toBe(true)
    expect(
      (await validateUploadFile(makeFile('b.jpg', 'image/jpeg', JPEG_SIG))).isValid
    ).toBe(true)
  })

  it('rejects a disallowed extension', async () => {
    const file = makeFile('malware.exe', 'application/octet-stream', [0x4d, 0x5a])
    const res = await validateUploadFile(file)
    expect(res.isValid).toBe(false)
    expect(res.error).toMatch(/non supporté/i)
  })

  it('rejects an HTML/SVG payload renamed to .pdf (MIME mismatch)', async () => {
    const file = makeFile('xss.pdf', 'text/html', [0x3c, 0x21]) // "<!"
    const res = await validateUploadFile(file)
    expect(res.isValid).toBe(false)
  })

  it('rejects a spoofed extension whose bytes are not a real PDF', async () => {
    // Correct MIME header but wrong content (no %PDF signature).
    const file = makeFile('fake.pdf', 'application/pdf', [0x00, 0x01, 0x02, 0x03])
    const res = await validateUploadFile(file)
    expect(res.isValid).toBe(false)
    expect(res.error).toMatch(/contenu/i)
  })

  it('rejects an oversized file', async () => {
    const file = makeFile('big.pdf', 'application/pdf', PDF_SIG, 20 * 1024 * 1024)
    const res = await validateUploadFile(file, { maxSize: 1024 })
    expect(res.isValid).toBe(false)
    expect(res.error).toMatch(/dépasser/i)
  })

  it('rejects an empty file', async () => {
    const file = makeFile('empty.pdf', 'application/pdf', [], 0)
    const res = await validateUploadFile(file)
    expect(res.isValid).toBe(false)
  })
})

describe('buildSafeStorageKey', () => {
  it('never includes the original file name or traversal sequences', () => {
    const key = buildSafeStorageKey('user-123', '../../etc/passwd.png')
    expect(key.startsWith('user-123/')).toBe(true)
    expect(key).not.toContain('..')
    expect(key).not.toContain('passwd')
    expect(key.endsWith('.png')).toBe(true)
  })

  it('produces distinct keys for identical names', () => {
    const a = buildSafeStorageKey('u', 'doc.pdf')
    const b = buildSafeStorageKey('u', 'doc.pdf')
    expect(a).not.toBe(b)
  })

  it('drops a suspicious extension rather than propagating it', () => {
    const key = buildSafeStorageKey('u', 'x.php%00')
    // Extension does not match /^[a-z0-9]{1,8}$/ -> no extension appended.
    expect(/\/[0-9a-f-]+$/i.test(key)).toBe(true)
  })
})

describe('getMaxFileSize', () => {
  it('falls back to the 10 MiB default', () => {
    expect(getMaxFileSize()).toBe(DEFAULT_MAX_FILE_SIZE)
  })
})
