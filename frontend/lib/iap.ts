import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';

// Apple IAP Product ID
export const IAP_PRODUCT_ID = 'com.tanyacode.mttcenglish.premium';

// IAP Manager for handling in-app purchases
class IAPManager {
  private connected = false;
  private products: InAppPurchases.IAPItemDetails[] = [];

  /**
   * Initialize IAP connection
   */
  async initialize(): Promise<boolean> {
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
  async getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      const { results, responseCode } = await InAppPurchases.getProductsAsync([IAP_PRODUCT_ID]);
      
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
  async purchaseProduct(productId: string): Promise<InAppPurchases.InAppPurchase | null> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      // Set purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
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
  async restorePurchases(): Promise<InAppPurchases.InAppPurchase[]> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        console.log('Restored purchases:', results);
        
        // Filter for our specific product
        const relevantPurchases = results.filter(
          (purchase) => purchase.productId === IAP_PRODUCT_ID
        );
        
        return relevantPurchases;
      } else {
        console.log('No purchases to restore');
        return [];
      }
    } catch (error) {
      console.error('Restore error:', error);
      return [];
    }
  }

  /**
   * Finish a transaction (iOS requirement)
   */
  async finishTransaction(purchase: InAppPurchases.InAppPurchase): Promise<void> {
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
    // IAP is supported on iOS and Android (not web)
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }
}

export const iapManager = new IAPManager();
