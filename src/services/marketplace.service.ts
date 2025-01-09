import { prisma } from '../../../lib/prisma';
import { MarketplaceListing, MarketplacePurchase } from '@prisma/client';
import { TransactionService } from './transaction.service';

export class MarketplaceService {
  constructor(private transactionService: TransactionService) {}

  async createListing(data: {
    title: string;
    description: string;
    price: number;
    sellerId: string;
    condition: string;
  }): Promise<MarketplaceListing> {
    return prisma.marketplaceListing.create({
      data: {
        ...data,
        status: 'AVAILABLE'
      }
    });
  }

  async purchaseItem(data: {
    listingId: string;
    buyerId: string;
    offeredPrice?: number;
    message?: string;
  }): Promise<MarketplacePurchase> {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: data.listingId }
    });
    if (!listing) throw new Error('Listing not found');

    return prisma.marketplacePurchase.create({
      data: {
        listingId: data.listingId,
        buyerId: data.buyerId,
        price: data.offeredPrice || listing.price,
        message: data.message,
        status: 'PENDING_APPROVAL'
      }
    });
  }

  async approvePurchase(id: string, approved: boolean, notes?: string): Promise<MarketplacePurchase> {
    const purchase = await prisma.marketplacePurchase.findUnique({
      where: { id },
      include: { listing: true }
    });
    if (!purchase) throw new Error('Purchase not found');

    if (approved) {
      // Create transaction for purchase
      await this.transactionService.requestTransaction({
        fromAccountId: purchase.buyerId,
        toAccountId: purchase.listing.sellerId,
        amount: purchase.price,
        category: 'MARKETPLACE_PURCHASE',
        description: `Purchase: ${purchase.listing.title}`
      });

      await prisma.marketplaceListing.update({
        where: { id: purchase.listingId },
        data: { status: 'SOLD' }
      });

      return prisma.marketplacePurchase.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          notes
        }
      });
    } else {
      return prisma.marketplacePurchase.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes
        }
      });
    }
  }
}
