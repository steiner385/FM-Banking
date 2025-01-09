import { Context } from 'hono';
import { MarketplaceService } from '../../services/banking/marketplace.service';

export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  async createListing(c: Context) {
    const data = await c.req.json();
    const listing = await this.marketplaceService.createListing(data);
    return c.json({ data: listing });
  }

  async getListings(c: Context) {
    const { familyId, sellerId, priceMin, priceMax, condition, status } = c.req.query();
    const listings = await this.marketplaceService.getListings({
      familyId,
      sellerId,
      priceMin: Number(priceMin),
      priceMax: Number(priceMax),
      condition,
      status
    });
    return c.json({ data: listings });
  }

  async updateListing(c: Context) {
    const { id } = c.req.param();
    const data = await c.req.json();
    const listing = await this.marketplaceService.updateListing(id, data);
    return c.json({ data: listing });
  }

  async purchaseItem(c: Context) {
    const data = await c.req.json();
    const purchase = await this.marketplaceService.purchaseItem(data);
    return c.json({ data: purchase });
  }

  async approvePurchase(c: Context) {
    const { id } = c.req.param();
    const { approved, notes } = await c.req.json();
    const purchase = await this.marketplaceService.approvePurchase(id, approved, notes);
    return c.json({ data: purchase });
  }
}
