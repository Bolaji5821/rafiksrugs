# Launch QA checklist

## Responsive and browser

- [ ] Chrome, Safari, Firefox, and Edge current releases
- [ ] iOS Safari and Android Chrome
- [ ] 375px, 768px, 1024px, and 1440px widths
- [ ] Browser zoom at 200 percent
- [ ] Reduced-motion mode

## Commerce

- [ ] Product and variant prices match source catalog
- [ ] Inventory changes propagate to listing, product, cart, and checkout
- [ ] Cart persists across navigation and authentication
- [ ] Shipping rates and delivery promises match configured regions
- [ ] Tax calculation is correct
- [ ] Payment success, decline, cancel, timeout, and duplicate-submit paths
- [ ] Order creation is idempotent
- [ ] Confirmation email and fulfillment handoff
- [ ] Refund, return, and out-of-stock recovery

## Experience and accessibility

- [ ] Keyboard-only navigation
- [ ] Visible focus and logical focus order
- [ ] Dialog focus trap, Escape close, and focus return
- [ ] Screen-reader labels and heading order
- [ ] Image alternatives and gallery behavior
- [ ] Form validation and error focus
- [ ] Empty, loading, error, and retry states

## SEO and performance

- [ ] Production canonical domain
- [ ] Sitemap and robots response
- [ ] Product structured-data validation
- [ ] Metadata and share cards on every route
- [ ] Redirect map from old URLs
- [ ] Image licensing, dimensions, optimization, and CDN behavior
- [ ] Core Web Vitals under production network conditions

## Integrations

- [ ] Newsletter provider
- [ ] Rug-request destination and notifications
- [ ] Analytics and consent
- [ ] Abandoned-cart automation
- [ ] Customer reviews provider
- [ ] Social destinations
