import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../lib/store';
import { theme } from '../lib/theme';
import { iapManager, IAP_PRODUCTS } from '../lib/iap';

type PlanType = 'monthly' | 'quarterly';

interface PricingPlan {
  id: PlanType;
  productId: string;
  title: string;
  price: string;
  period: string;
  savings?: string;
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'monthly',
    productId: IAP_PRODUCTS.MONTHLY,
    title: 'Monthly',
    price: '$14.99',
    period: '/month',
    popular: true,
  },
  {
    id: 'quarterly',
    productId: IAP_PRODUCTS.QUARTERLY,
    title: '3 Months',
    price: '$34.99',
    period: '/3 months',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const setPurchase = useAppStore((state) => state.setPurchase);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const initialized = await iapManager.initialize();
    if (initialized) {
      const loadedProducts = await iapManager.getProducts();
      if (loadedProducts.length > 0) {
        setProducts(loadedProducts);
      }
    }
  };

  const getProductPrice = (productId: string): string => {
    const product = products.find(p => p.productId === productId);
    return product?.price ? `$${product.price}` : pricingPlans.find(p => p.productId === productId)?.price || '';
  };

  const handlePurchase = async () => {
    const plan = pricingPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      // Ensure products are loaded before purchase
      if (products.length === 0) {
        await loadProducts();
      }

      // Verify that the selected plan exists in the loaded products
      const hasProduct = products.some(p => p.productId === plan.productId);
      if (!hasProduct) {
        Alert.alert('Subscriptions Unavailable', 'Subscriptions temporarily unavailable. Please try again later.');
        return;
      }
      
      const purchase = await iapManager.purchaseProduct(plan.productId);
      if (purchase) {
        // Finish the transaction (required for iOS)
        await iapManager.finishTransaction(purchase);
        
        // Update store - user is now premium
        setPurchase(selectedPlan);
        
        Alert.alert('Success', 'Welcome to Premium! 🎉', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Purchase Error', error.message || 'Unable to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const purchases = await iapManager.restorePurchases();
      if (purchases.length > 0) {
        // Determine which plan was purchased
        const purchase = purchases[0];
        let planType: PlanType = 'monthly';
        if (purchase.productId === IAP_PRODUCTS.WEEKLY) planType = 'weekly';
        else if (purchase.productId === IAP_PRODUCTS.QUARTERLY) planType = 'quarterly';
        
        setPurchase(planType);
        Alert.alert('Success', 'Premium access restored! 🎉', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
        ]);
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (error: any) {
      Alert.alert('Restore Error', error.message || 'Unable to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: 'infinity', text: 'Unlimited flashcards' },
    { icon: 'clipboard-text', text: 'All practice questions' },
    { icon: 'timer', text: 'Exam mode with timer' },
    { icon: 'chart-line', text: 'Detailed progress analytics' },
    { icon: 'target', text: 'Personalized recommendations' },
    { icon: 'trophy', text: 'Track your readiness score' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <MaterialCommunityIcons
              name="star-circle"
              size={64}
              color="#4CAF50"
            />
            <Text style={styles.title}>Go Premium</Text>
            <Text style={styles.subtitle}>
              Unlock everything to ace the MTTC English exam
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <MaterialCommunityIcons
                  name={feature.icon as any}
                  size={24}
                  color="#4CAF50"
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {pricingPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                  plan.popular && styles.planCardPopular,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.7}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>
                    {getProductPrice(plan.productId) || plan.price}
                  </Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                {selectedPlan === plan.id && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="#4CAF50"
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Premium Button */}
          <TouchableOpacity
            style={[styles.premiumButton, loading && styles.premiumButtonDisabled]}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="crown" size={24} color="#FFFFFF" />
            <Text style={styles.premiumButtonText}>
              {loading ? 'Processing...' : 'Get Premium'}
            </Text>
          </TouchableOpacity>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={loading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              Payment will be charged to your Apple ID account at confirmation of purchase.
              Subscription automatically renews unless auto-renew is turned off at least
              24 hours before the end of the current period.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>•</Text>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueLimitedButton}
            onPress={() => router.back()}
          >
            <Text style={styles.continueLimitedText}>Continue with limited access</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: theme.spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  plansContainer: {
    marginBottom: theme.spacing.lg,
  },
  planCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  planCardPopular: {
    borderColor: '#4CAF50',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: theme.spacing.lg,
    backgroundColor: '#4CAF50',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  savingsBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: '#FF9800',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  planPeriod: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  checkIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.lg,
  },
  premiumButton: {
    backgroundColor: '#4CAF50',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumButtonDisabled: {
    opacity: 0.7,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  restoreButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  restoreButtonText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.md,
    textDecorationLine: 'underline',
  },
  legalContainer: {
    marginBottom: theme.spacing.lg,
  },
  legalText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLink: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
  continueLimitedButton: {
    padding: theme.spacing.md,
  },
  continueLimitedText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
