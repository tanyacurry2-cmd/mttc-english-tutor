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
import { Button } from '../components/Button';
import { theme } from '../lib/theme';
import { iapManager, IAP_PRODUCT_ID } from '../lib/iap';

export default function PaywallScreen() {
  const router = useRouter();
  const setPurchase = useAppStore((state) => state.setPurchase);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    const initialized = await iapManager.initialize();
    if (initialized) {
      const products = await iapManager.getProducts();
      if (products.length > 0) {
        setProduct(products[0]);
      }
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const purchase = await iapManager.purchaseProduct(IAP_PRODUCT_ID);
      if (purchase) {
        // Finish the transaction (required for iOS)
        await iapManager.finishTransaction(purchase);
        
        // Update store - user is now premium
        setPurchase('lifetime');
        
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
        // User has purchased - restore premium access
        setPurchase('lifetime');
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
    { icon: 'timer', text: 'Exam mode with 25-min timer' },
    { icon: 'chart-line', text: 'Detailed progress analytics' },
    { icon: 'target', text: 'Personalized study recommendations' },
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
              color={theme.colors.accent}
            />
            <Text style={styles.title}>Unlock Full Access</Text>
            <Text style={styles.subtitle}>
              Get everything you need to ace the MTTC English exam
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <MaterialCommunityIcons
                  name={feature.icon as any}
                  size={24}
                  color={theme.colors.success}
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingContainer}>
            <TouchableOpacity
              style={styles.pricingCard}
              onPress={handlePurchase}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>ONE-TIME PURCHASE</Text>
              </View>
              <Text style={styles.pricingTitle}>Lifetime Premium Access</Text>
              <Text style={styles.pricingPrice}>${product?.price || '29.99'}</Text>
              <Text style={styles.pricingDescription}>One-time payment, yours forever</Text>
              <View style={styles.pricingFeatures}>
                <Text style={styles.pricingFeature}>✓ All 291 flashcards</Text>
                <Text style={styles.pricingFeature}>✓ All 302 practice questions</Text>
                <Text style={styles.pricingFeature}>✓ Unlimited assessments</Text>
                <Text style={styles.pricingFeature}>✓ AI Writing Lab</Text>
                <Text style={styles.pricingFeature}>✓ No recurring charges</Text>
                <Text style={styles.pricingFeature}>✓ Future updates included</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Button
            title="Restore Purchases"
            onPress={handleRestore}
            variant="outline"
            loading={loading}
            style={styles.restoreButton}
          />

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              Payment will be charged to your Apple ID account. Subscription automatically renews
              unless it is canceled at least 24 hours before the end of the current period.
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
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
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
  pricingContainer: {
    marginBottom: theme.spacing.lg,
  },
  pricingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryPricingCard: {
    borderColor: theme.colors.border,
    borderWidth: 2,
  },
  bestValueBadge: {
    backgroundColor: theme.colors.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  pricingTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  pricingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  pricingFeatures: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  pricingFeature: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  restoreButton: {
    marginBottom: theme.spacing.lg,
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
