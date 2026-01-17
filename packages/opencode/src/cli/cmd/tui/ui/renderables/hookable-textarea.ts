import { TextareaRenderable, type OptimizedBuffer } from "@opentui/core"
import { extend } from "@opentui/solid"

/**
 * Extends TextareaRenderable to properly call renderBefore/renderAfter hooks.
 *
 * EditBufferRenderable.render() (which TextareaRenderable inherits) does not call
 * these hooks, unlike the base Renderable.render(). This class adds the missing
 * hook calls to enable post-processing of rendered content.
 */
export class HookableTextareaRenderable extends TextareaRenderable {
  override render(buffer: OptimizedBuffer, deltaTime: number) {
    if (!this.visible) return

    this.renderBefore?.call(this, buffer, deltaTime)
    super.render(buffer, deltaTime)
    this.renderAfter?.call(this, buffer, deltaTime)
  }
}

extend({ hookable_textarea: HookableTextareaRenderable })

declare module "@opentui/solid" {
  interface OpenTUIComponents {
    hookable_textarea: typeof HookableTextareaRenderable
  }
}
