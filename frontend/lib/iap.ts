// NO-OP IAP module for TestFlight builds
// All purchase logic is bypassed - user is always premium

export const IAP_PRODUCTS = {
  MONTHLY: 'pro_monthly_899',
  LIFETIME: 'lifetime_unlock_2999',
};

export const IAP_SUBSCRIPTION_GROUP = 'mttc_english_pro';

// Mock IAP Manager that does nothing but doesn't crash
class IAPManager {
  private connected = false;
  private isSupported = false; // Disabled for TestFlight

  async initialize() {
    console.log('IAP disabled for TestFlight - user is always premium');
    this.connected = true;
  }

  async getProducts() {
    // Return empty array - no products needed for TestFlight
    return [];
  }

  async purchaseProduct(productId: string) {
    console.log('IAP purchase bypassed for TestFlight');
    return null;
  }

  async restorePurchases() {
    console.log('IAP restore bypassed for TestFlight');
    return [];
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    // Always valid for TestFlight
    return true;
  }

  async disconnect() {
    this.connected = false;
  }
}

export const iapManager = new IAPManager();