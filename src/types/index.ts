export type TransactionStatus = 'completed' | 'flagged_fraud' | 'pending_approval' | 'pending' | 'rejected' | 'refunded';
export type PaymentMethod = 'cash' | 'qris' | 'card' | 'bank_transfer' | 'debt' | 'cod';
export type TransactionChannel = 'pos' | 'pwa_client' | 'offline_pos' | 'client_pwa';
export type RiskSeverity = 'clean' | 'low' | 'medium' | 'high' | 'critical' | 'warning';
export type PackageType = 'carton' | 'unit';

export interface StoreConfig {
  id: string;
  name: string;
  ownerEmail: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  fraudThresholdScore: number; // e.g. 60
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  category: string;
  barcode: string;
  piecesPerCarton: number; // e.g. 40 pcs per dus
  stockInUnits: number; // total units currently in stock
  costPerUnit: number; // COGS
  pricePerUnit: number; // retail price
  pricePerCarton: number; // wholesale price for whole carton
  minStockAlert: number;
  imageUrl?: string;
  storageLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionItem {
  id: string;
  storeId: string;
  transactionId: string;
  productId: string;
  productName: string;
  packageType: PackageType;
  quantityOrdered: number;
  unitsDeducted: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  storeId: string;
  channel: TransactionChannel;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  totalCost: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  fulfillmentStatus?: 'pending' | 'processing' | 'ready' | 'completed';
  fraudScore: number; // 0 - 100
  fraudFlags: string[];
  riskLevel: RiskSeverity;
  riskScore?: number;
  cartonBreakdown?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  distanceToStoreMeters?: number;
  gpsAccuracy?: number;
  isMockGpsSuspected?: boolean;
  aiExplanation?: string;
  cashierId?: string;
  items?: TransactionItem[];
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface FraudLog {
  id: string;
  storeId: string;
  transactionId: string;
  riskLevel: RiskSeverity;
  anomalyType: string;
  summary: string;
  aiDetails: string;
  resolved: boolean;
  timestamp: string;
}

export interface RestockRecommendation {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  currentStockUnits: number;
  piecesPerCarton: number;
  suggestedCartons: number;
  estimatedCost: number;
  urgency: 'urgent' | 'medium' | 'optimal';
  aiRationale: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  packageType: PackageType;
  quantity: number;
}
