import { Platform, Alert } from 'react-native';

// Check if running on web
const isWeb = Platform.OS === 'web';

// Conditionally import IAP for native platforms only
let IAPModule: any = null;

if (!isWeb) {
  try {
    IAPModule = require('expo-in-app-purchases');
  } catch (e) {
    console.log('IAP not available on this platform');
  }
}

export const IAP_PRODUCTS = {
  MONTHLY: 'pro_monthly_899',
  LIFETIME: 'lifetime_unlock_2999',
};

export const IAP_SUBSCRIPTION_GROUP = 'mttc_english_pro';

class IAPManager {
  private connected = false;
  private isSupported = !isWeb && IAPModule !== null;

  async initialize() {
    if (!this.isSupported) {
      console.log('IAP not supported on web platform');
      return;
    }

    try {
      await IAPModule.connectAsync();
      this.connected = true;
      console.log('IAP initialized');
    } catch (error) {
      console.error('IAP initialization error:', error);
    }
  }

  async getProducts() {
    if (!this.isSupported) return [];

    try {
      const { results } = await IAPModule.getProductsAsync([IAP_PRODUCTS.MONTHLY, IAP_PRODUCTS.LIFETIME]);
      return results || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async purchaseProduct(productId: string) {
    if (!this.isSupported) {
      Alert.alert('Not Available', 'In-app purchases are only available on iOS devices.');
      return null;
    }

    try {
      const purchase = await IAPModule.purchaseItemAsync(productId);
      return purchase;
    } catch (error) {
      console.error('Purchase error:', error);
      return null;
    }
  }

  async restorePurchases() {
    if (!this.isSupported) {
      Alert.alert('Not Available', 'Purchase restoration is only available on iOS devices.');
      return [];
    }

    try {
      const { results } = await IAPModule.getPurchaseHistoryAsync();
      return results || [];
    } catch (error) {
      console.error('Restore purchases error:', error);
      return [];
    }
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    // STUB: Replace with real server-side validation
    console.log('Stub receipt validation - replace with real validation');
    return true;
  }

  async disconnect() {
    if (this.connected && this.isSupported) {
      await IAPModule.disconnectAsync();
      this.connected = false;
    }
  }
}

export const iapManager = new IAPManager();