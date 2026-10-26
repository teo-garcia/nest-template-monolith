import { ExpressAdapter } from '@nestjs/platform-express'

/** This monolith owns the entire HTTP surface, including unmatched root paths. */
export class ApplicationExpressAdapter extends ExpressAdapter {
  override setNotFoundHandler(
    handler: Parameters<ExpressAdapter['setNotFoundHandler']>[0]
  ): void {
    // Keep Nest's exception proxy and global filters on every unmatched path.
    super.setNotFoundHandler(handler)
  }
}
