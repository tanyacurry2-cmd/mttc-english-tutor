import { Platform } from 'react-native';

// Apple IAP Product IDs for subscriptions
export const IAP_PRODUCTS = {
  MONTHLY: 'com.tanya.mttc_ela.premium_monthly',
  QUARTERLY: 'com.tanya.mttc_ela.premium_quarterly',
};

// Legacy product ID (for backward compatibility)
export const IAP_PRODUCT_ID = IAP_PRODUCTS.MONTHLY;

// Check if IAP module is available (not in Expo Go)
let InAppPurchases: any = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.log('IAP module not available (Expo Go) - using mock');
}

// IAP Manager for handling in-app purchases
class IAPManager {
  private connected = false;
  private products: any[] = [];
  private isAvailable = InAppPurchases !== null;

  /**
   * Initialize IAP connection
   */
  async initialize(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('IAP not available in Expo Go - skipping initialization');
      return false;
    }

    try {
      await InAppPurchases.connectAsync();
      this.connected = true;
      console.log('IAP initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      this.connected = false;
      return false;
    }
  }

  /**
   * Get available products from the store
   */
  async getProducts(): Promise<any[]> {
    if (!this.isAvailable) {
      console.log('IAP not available - returning mock products');
      return [
        {
          productId: IAP_PRODUCTS.WEEKLY,
          price: '4.99',
          title: 'Weekly Premium',
          description: 'Premium access for 1 week'
        },
        {
          productId: IAP_PRODUCTS.MONTHLY,
          price: '15.99',
          title: 'Monthly Premium',
          description: 'Premium access for 1 month'
        },
        {
          productId: IAP_PRODUCTS.QUARTERLY,
          price: '39.99',
          title: '3-Month Premium',
          description: 'Premium access for 3 months'
        }
      ];
    }

    if (!this.connected) {
      await this.initialize();
    }

    try {
      const productIds = Object.values(IAP_PRODUCTS);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.products = results || [];
        console.log('Loaded products:', this.products);
        return this.products;
      } else {
        console.error('Failed to load products, response code:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<any | null> {
    if (!this.isAvailable) {
      throw new Error('In-app purchases are only available in production builds. Please build with EAS to test purchases.');
    }

    if (!this.connected) {
      await this.initialize();
    }

    // Ensure products are loaded and contain the requested product
    if (this.products.length === 0) {
      await this.getProducts();
    }

    const hasProduct = this.products.some((p) => p.productId === productId);
    if (!hasProduct) {
      throw new Error('Subscriptions temporarily unavailable. Please try again later.');
    }

    try {
      // Set purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: any) => {
        console.log('Purchase response:', { responseCode, results, errorCode });
      });

      // Attempt purchase
      const result = await InAppPurchases.purchaseItemAsync(productId);
      
      console.log('Purchase result:', result);
      
      if (result && result.results && result.results.length > 0) {
        return result.results[0];
      }
      
      return null;
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<any[]> {
    if (!this.isAvailable) {
      throw new Error('In-app purchases are only available in production builds. Please build with EAS to test purchases.');
    }

    if (!this.connected) {
      await this.initialize();
    }

    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        console.log('Restored purchases:', results);
        
        // Filter for our specific products
        const productIds = Object.values(IAP_PRODUCTS);
        const relevantPurchases = results.filter(
          (purchase: any) => productIds.includes(purchase.productId)
        );
        
        return relevantPurchases;
      } else {
        console.log('No purchases to restore');
        return [];
      }
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }

  /**
   * Finish a transaction (iOS requirement)
   */
  async finishTransaction(purchase: any): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      if (Platform.OS === 'ios' && purchase.transactionIdentifier) {
        await InAppPurchases.finishTransactionAsync(purchase, false);
        console.log('Transaction finished:', purchase.transactionIdentifier);
      }
    } catch (error) {
      console.error('Error finishing transaction:', error);
    }
  }

  /**
   * Disconnect from IAP
   */
  async disconnect(): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      await InAppPurchases.disconnectAsync();
      this.connected = false;
      console.log('IAP disconnected');
    } catch (error) {
      console.error('Error disconnecting IAP:', error);
    }
  }

  /**
   * Check if IAP is supported on this device
   */
  isSupported(): boolean {
    // IAP is supported on iOS and Android (not web) AND module is available
    return this.isAvailable && (Platform.OS === 'ios' || Platform.OS === 'android');
  }
}

export const iapManager = new IAPManager();
