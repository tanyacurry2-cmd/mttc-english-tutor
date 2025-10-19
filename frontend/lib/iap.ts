import { 
  connectAsync,
  disconnectAsync,
  getProductsAsync,
  purchaseItemAsync,
  getPurchaseHistoryAsync,
  IAPItemDetails,
  InAppPurchase
} from 'expo-in-app-purchases';

export const IAP_PRODUCTS = {
  MONTHLY: 'pro_monthly_899',
  LIFETIME: 'lifetime_unlock_2999',
};

export const IAP_SUBSCRIPTION_GROUP = 'mttc_english_pro';

class IAPManager {
  private connected = false;

  async initialize() {
    try {
      await connectAsync();
      this.connected = true;
      console.log('IAP initialized');
    } catch (error) {
      console.error('IAP initialization error:', error);
    }
  }

  async getProducts(): Promise<IAPItemDetails[]> {
    try {
      const { results } = await getProductsAsync([IAP_PRODUCTS.MONTHLY, IAP_PRODUCTS.LIFETIME]);
      return results || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<InAppPurchase | null> {
    try {
      const purchase = await purchaseItemAsync(productId);
      // Stub receipt validation - replace with real validation later
      return purchase;
    } catch (error) {
      console.error('Purchase error:', error);
      return null;
    }
  }

  async restorePurchases(): Promise<InAppPurchase[]> {
    try {
      const { results } = await getPurchaseHistoryAsync();
      return results || [];
    } catch (error) {
      console.error('Restore purchases error:', error);
      return [];
    }
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    // STUB: Replace with real server-side validation
    // Should call your backend which validates with Apple's servers
    console.log('Stub receipt validation - replace with real validation');
    return true;
  }

  async disconnect() {
    if (this.connected) {
      await disconnectAsync();
      this.connected = false;
    }
  }
}

export const iapManager = new IAPManager();