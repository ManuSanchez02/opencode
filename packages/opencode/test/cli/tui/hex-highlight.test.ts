import { describe, expect, test } from "bun:test"
import { highlightHexColors } from "../../../src/cli/cmd/tui/ui/buffer/hex-highlight"
import type { OptimizedBuffer } from "@opentui/core"

interface Cell {
  ch: string
  fg?: unknown
  bg?: unknown
}

function makeBufferFromString(rows: string[]): {
  buffer: OptimizedBuffer
  cells: { ch: string; fg?: unknown; bg?: unknown }[]
} {
  function rowToCodepoints(s: string) {
    const cps: number[] = []
    for (let i = 0; i < s.length; ) {
      const cp = s.codePointAt(i) ?? 0
      cps.push(cp)
      i += cp > 0xffff ? 2 : 1
    }
    return cps
  }

  const rowsCp = rows.map(rowToCodepoints)
  const width = Math.max(...rowsCp.map((r) => r.length))
  const height = rows.length

  const char = new Uint32Array(width * height)
  for (let y = 0; y < height; y++) {
    const cps = rowsCp[y]
    for (let x = 0; x < width; x++) {
      char[y * width + x] = cps[x] ?? 0
    }
  }

  const cells: Cell[] = new Array(width * height).fill(null).map(() => ({ ch: " " }))

  const buffer = {
    width,
    height,
    buffers: { char },
    setCellWithAlphaBlending(x: number, y: number, ch: string, fg: unknown, bg: unknown) {
      cells[y * width + x] = { ch, fg, bg }
    },
  } as unknown as OptimizedBuffer

  return { buffer, cells }
}

function anyHighlighted(buf: OptimizedBuffer, cells: Cell[]) {
  for (let i = 0; i < buf.width; i++) if (cells[i].bg) return true
  return false
}

function anyHighlightedRow(buf: OptimizedBuffer, cells: Cell[], rowIndex: number) {
  for (let i = 0; i < buf.width; i++) if (cells[rowIndex * buf.width + i].bg) return true
  return false
}

function didHighlight(buf: OptimizedBuffer, cells: Cell[], rowIndex: number, startCol = 0, length = 0) {
  for (let i = 0; i < length; i++) {
    const c = cells[rowIndex * buf.width + startCol + i]
    if (!c || !c.bg) return false
  }
  return true
}

describe("hex-highlight", () => {
  test("highlights 3/6/8-char hex codes", () => {
    const rows = ["#fff", "#ffffff", "#ffffff80"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(didHighlight(buf, cells, 0, 0, 4)).toBe(true) // #fff -> '#' + 3
    expect(didHighlight(buf, cells, 1, 0, 7)).toBe(true) // #ffffff -> '#' + 6
    expect(didHighlight(buf, cells, 2, 0, 9)).toBe(true) // #ffffff80 -> '#' + 8
  })

  test("matches when preceded by word characters (foo#fff)", () => {
    const rows = ["foo#fff"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    const c = cells[0 * buf.width + 3]
    expect(c && c.bg).toBeTruthy()
  })

  test("does not match invalid-length hex like #1234", () => {
    const rows = ["#1234"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(anyHighlighted(buf, cells)).toBe(false)
  })

  test("does not match when trailing word char exists (#fff_bar)", () => {
    const rows = ["#fff_bar"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(anyHighlighted(buf, cells)).toBe(false)
  })

  test("handles hex at end of line without throwing", () => {
    const rows = ["prefix #fff"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    const start = rows[0].indexOf("#")
    expect(didHighlight(buf, cells, 0, start, 4)).toBeTruthy()
  })

  test("rejects invalid hex tokens like #INVHEX and #GHIJKL", () => {
    const rows = ["#INVHEX", "#GHIJKL"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(anyHighlighted(buf, cells)).toBe(false)
  })

  test("mixed-case hex and alpha edge cases", () => {
    const rows = ["#AbC", "#AAbbCc", "#AABBCC00", "#000000FF"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(cells[0 * buf.width + 0].bg).toBeTruthy()
    expect(cells[1 * buf.width + 0].bg).toBeTruthy()
    expect(cells[2 * buf.width + 0].bg).toBeTruthy()
    expect(cells[3 * buf.width + 0].bg).toBeTruthy()
  })

  test("punctuation and boundary cases", () => {
    const rows = ["(#fff)", "start:#FFF,end", "#1234567", "#123456789"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(didHighlight(buf, cells, 0, 1, 4)).toBeTruthy()
    expect(didHighlight(buf, cells, 1, 6, 4)).toBeTruthy()

    expect(anyHighlightedRow(buf, cells, 2)).toBe(false)
    expect(anyHighlightedRow(buf, cells, 3)).toBe(false)
  })

  test("emoji or wide chars before hex do not break offsets", () => {
    const rows = ["😀#fff", "😀 #fff"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    for (let y = 0; y < buf.height; y++) {
      const offset = y * buf.width
      let sharpIndex = -1
      for (let x = 0; x < buf.width; x++) {
        if ((buf as any).buffers.char[offset + x] === 0x23) {
          sharpIndex = x
          break
        }
      }
      expect(sharpIndex).not.toBe(-1)
      expect(didHighlight(buf, cells, y, sharpIndex, 4)).toBeTruthy()
    }
  })

  test("hex at row end (partial) does not throw and is not highlighted", () => {
    const rows = ["end#"]
    const { buffer: buf, cells } = makeBufferFromString(rows)
    highlightHexColors(buf)

    expect(didHighlight(buf, cells, 0, 3, 1)).toBeFalsy()
  })
})
