import { extend } from "@opentui/solid"
import { HookedCodeRenderable } from "./hooked-code"

export { HookedCodeRenderable }

export { highlightHexColors } from "./buffer/hex-highlight"

let registered = false

/**
 * Register custom OpenTUI renderables.
 * Safe to call multiple times - only registers once.
 */
export function registerRenderables() {
  if (registered) return
  registered = true

  extend({
    hooked_code: HookedCodeRenderable,
  })
}

declare module "@opentui/solid" {
  interface OpenTUIComponents {
    hooked_code: typeof HookedCodeRenderable
  }
}
