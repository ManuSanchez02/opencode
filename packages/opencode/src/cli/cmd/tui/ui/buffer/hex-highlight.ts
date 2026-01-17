import { RGBA, type OptimizedBuffer } from "@opentui/core"

const HEX_PATTERN = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : hex.slice(0, 6)

  return {
    r: parseInt(normalized.slice(0, 2), 16) / 255,
    g: parseInt(normalized.slice(2, 4), 16) / 255,
    b: parseInt(normalized.slice(4, 6), 16) / 255,
  }
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function isValidCodePoint(code: number): boolean {
  return code > 0 && code <= 0x10ffff
}

function readRow(buffer: OptimizedBuffer, y: number): string {
  const { width } = buffer
  let row = ""
  for (let x = 0; x < width; x++) {
    const code = buffer.buffers.char[y * width + x]
    row += isValidCodePoint(code) ? String.fromCodePoint(code) : " "
  }
  return row
}

/**
 * Highlight hex color codes in a buffer with their actual color as background.
 * Automatically chooses black or white text for contrast.
 */
export function highlightHexColors(buffer: OptimizedBuffer): void {
  const { width, height } = buffer

  for (let y = 0; y < height; y++) {
    const row = readRow(buffer, y)

    for (const match of row.matchAll(HEX_PATTERN)) {
      const color = match[0]
      const { r, g, b } = parseHex(color.slice(1))
      const text = luminance(r, g, b) > 0.5 ? 0 : 1

      const fg = RGBA.fromValues(text, text, text, 1)
      const bg = RGBA.fromValues(r, g, b, 1)

      for (let i = 0; i < color.length; i++) {
        const x = match.index + i
        if (x >= width) break

        const code = buffer.buffers.char[y * width + x]
        buffer.setCell(x, y, isValidCodePoint(code) ? String.fromCodePoint(code) : " ", fg, bg)
      }
    }
  }
}
