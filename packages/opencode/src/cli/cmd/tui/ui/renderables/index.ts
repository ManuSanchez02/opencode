import { extend } from "@opentui/solid"
import { HookableCodeRenderable } from "./hookable-code"

export { HookableCodeRenderable }

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
    hookable_code: HookableCodeRenderable,
  })
}

declare module "@opentui/solid" {
  interface OpenTUIComponents {
    hookable_code: typeof HookableCodeRenderable
  }
}
