import { CodeRenderable, type OptimizedBuffer } from "@opentui/core"
import { extend } from "@opentui/solid"

/**
 * HexCodeRenderable extends CodeRenderable to properly call renderBefore/renderAfter hooks.
 *
 * TextBufferRenderable.render() (which CodeRenderable inherits) does not call these hooks,
 * unlike the base Renderable.render() which does. This class adds the missing hook calls
 * to enable post-processing of rendered code content (e.g., hex color highlighting).
 */
class HexCodeRenderable extends CodeRenderable {
  override render(buffer: OptimizedBuffer, deltaTime: number) {
    if (!this.visible) return

    const renderBuffer = this.buffered && this.frameBuffer ? this.frameBuffer : buffer

    if (this.renderBefore) {
      this.renderBefore.call(this, renderBuffer, deltaTime)
    }

    super.render(buffer, deltaTime)

    if (this.renderAfter) {
      this.renderAfter.call(this, renderBuffer, deltaTime)
    }
  }
}

extend({ hexcode: HexCodeRenderable })

declare module "@opentui/solid" {
  interface OpenTUIComponents {
    hexcode: typeof HexCodeRenderable
  }
}
