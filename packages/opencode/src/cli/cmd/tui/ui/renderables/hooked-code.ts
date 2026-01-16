import { CodeRenderable, type OptimizedBuffer } from "@opentui/core"

/**
 * Extends CodeRenderable to properly call renderBefore/renderAfter hooks.
 *
 * TextBufferRenderable.render() (which CodeRenderable inherits) does not call
 * these hooks, unlike the base Renderable.render(). This class adds the missing
 * hook calls to enable post-processing of rendered code content.
 */
export class HookedCodeRenderable extends CodeRenderable {
  override render(buffer: OptimizedBuffer, deltaTime: number) {
    if (!this.visible) return

    this.renderBefore?.call(this, buffer, deltaTime)
    super.render(buffer, deltaTime)
    this.renderAfter?.call(this, buffer, deltaTime)
  }
}
