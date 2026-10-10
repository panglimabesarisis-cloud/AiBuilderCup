import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, StoreConfig, Transaction, FraudLog } from '../types';

export const DEMO_STORE_ID = 'store_demo_01';

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: DEMO_STORE_ID,
  name: 'RiskCart Flagship Mart (AI Cup 2026)',
  ownerEmail: '',
  latitude: -6.2088, // Central Jakarta benchmark
  longitude: 106.8456,
  geofenceRadiusMeters: 500, // 500m boundary for verified high-trust checkout
  fraudThresholdScore: 65,
  currency: 'IDR',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_PRODUCTS: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'prod_nipis_botol',
    storeId: DEMO_STORE_ID,
    name: 'Nipis Madu Botol 330ml',
    sku: 'DRK-NPS-001',
    category: 'Flavors',
    barcode: '899123456001',
    piecesPerCarton: 24,
    stockInUnits: 96,
    costPerUnit: 39000,
    pricePerUnit: 54000,
    pricePerCarton: 1209000,
    minStockAlert: 24,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_nipis_gelas',
    storeId: DEMO_STORE_ID,
    name: 'Nipis Madu Gelas Cup',
    sku: 'DRK-NPS-002',
    category: 'Flavors',
    barcode: '899123456002',
    piecesPerCarton: 24,
    stockInUnits: 72,
    costPerUnit: 17000,
    pricePerUnit: 25000,
    pricePerCarton: 542500,
    minStockAlert: 20,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_kopi_nongkrong',
    storeId: DEMO_STORE_ID,
    name: 'Kopi Nongkrong Cold Brew',
    sku: 'DRK-KOP-003',
    category: 'Coffee',
    barcode: '899123456003',
    piecesPerCarton: 24,
    stockInUnits: 48,
    costPerUnit: 18500,
    pricePerUnit: 28000,
    pricePerCarton: 589000,
    minStockAlert: 24,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_hydro_coco',
    storeId: DEMO_STORE_ID,
    name: 'Hydro Coco Original 250ml',
    sku: 'DRK-HYD-004',
    category: 'Mineral',
    barcode: '899123456004',
    piecesPerCarton: 24,
    stockInUnits: 120,
    costPerUnit: 13000,
    pricePerUnit: 19500,
    pricePerCarton: 418500,
    minStockAlert: 30,
    imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_granita_dus',
    storeId: DEMO_STORE_ID,
    name: 'Granita Cappuccino (Dus/Carton)',
    sku: 'DRK-GRN-005',
    category: 'Mineral Dus',
    barcode: '899123456005',
    piecesPerCarton: 24,
    stockInUnits: 144, // 6 whole cartons
    costPerUnit: 6000,
    pricePerUnit: 10000,
    pricePerCarton: 225000,
    minStockAlert: 48,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_teh_botol',
    storeId: DEMO_STORE_ID,
    name: 'Teh Botol Sosro 450ml',
    sku: 'DRK-TEH-006',
    category: 'Tea',
    barcode: '899123456006',
    piecesPerCarton: 24,
    stockInUnits: 168,
    costPerUnit: 8000,
    pricePerUnit: 12500,
    pricePerCarton: 271000,
    minStockAlert: 40,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_gas_3kg',
    storeId: DEMO_STORE_ID,
    name: 'LPG Gas Canister 3 Kg',
    sku: 'GAS-LPG-007',
    category: 'Gas',
    barcode: '899123456007',
    piecesPerCarton: 1,
    stockInUnits: 35,
    costPerUnit: 23000,
    pricePerUnit: 34000,
    pricePerCarton: 34000,
    minStockAlert: 10,
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_mineral_galon',
    storeId: DEMO_STORE_ID,
    name: 'Aqua Mineral Gallon 19L',
    sku: 'DRK-GAL-008',
    category: 'Mineral Galon',
    barcode: '899123456008',
    piecesPerCarton: 1,
    stockInUnits: 50,
    costPerUnit: 18500,
    pricePerUnit: 29500,
    pricePerCarton: 29500,
    minStockAlert: 15,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_indomie_01',
    storeId: DEMO_STORE_ID,
    name: 'Indomie Mi Goreng Special (Dus)',
    sku: 'NDL-IND-001',
    category: 'Mineral Dus',
    barcode: '8998866200112',
    piecesPerCarton: 40,
    stockInUnits: 280, // = 7 whole cartons
    costPerUnit: 5500,
    pricePerUnit: 8500,
    pricePerCarton: 310000,
    minStockAlert: 80,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_pocari_02',
    storeId: DEMO_STORE_ID,
    name: 'Pocari Sweat Ion Supply 500ml',
    sku: 'DRK-POC-002',
    category: 'Mineral',
    barcode: '8993388100223',
    piecesPerCarton: 24,
    stockInUnits: 144,
    costPerUnit: 12500,
    pricePerUnit: 20000,
    pricePerCarton: 434000,
    minStockAlert: 48,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_cola',
    storeId: DEMO_STORE_ID,
    name: 'Coca Cola Slim Can 330ml',
    sku: 'DRK-COL-009',
    category: 'Cola',
    barcode: '899123456009',
    piecesPerCarton: 24,
    stockInUnits: 96,
    costPerUnit: 8500,
    pricePerUnit: 14000,
    pricePerCarton: 302000,
    minStockAlert: 24,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'prod_susu_milk',
    storeId: DEMO_STORE_ID,
    name: 'Ultra Milk Full Cream 1L',
    sku: 'DRK-MLK-010',
    category: 'Susu',
    barcode: '899123456010',
    piecesPerCarton: 12,
    stockInUnits: 60,
    costPerUnit: 18500,
    pricePerUnit: 27000,
    pricePerCarton: 307000,
    minStockAlert: 24,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_rc_1001',
    storeId: DEMO_STORE_ID,
    channel: 'pos',
    customerName: 'Marcus Vance',
    totalAmount: 287000,
    totalCost: 173500,
    paymentMethod: 'qris',
    status: 'completed',
    fraudScore: 8,
    fraudFlags: ['VERIFIED_POS_CHECKOUT'],
    riskLevel: 'clean',
    distanceToStoreMeters: 4,
    gpsAccuracy: 5,
    aiExplanation: 'In-person POS terminal checkout authenticated by registered cashier #C01. Normal item velocity and standard payment token.',
    cashierId: 'cashier_01',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    items: [
      {
        id: 'item_1001_1',
        storeId: DEMO_STORE_ID,
        transactionId: 'tx_rc_1001',
        productId: 'prod_indomie_01',
        productName: 'Indomie Mi Goreng Special',
        packageType: 'unit',
        quantityOrdered: 10,
        unitsDeducted: 10,
        unitPrice: 8500,
        subtotal: 85000,
      },
      {
        id: 'item_1001_2',
        storeId: DEMO_STORE_ID,
        transactionId: 'tx_rc_1001',
        productId: 'prod_pocari_02',
        productName: 'Pocari Sweat Ion Supply 500ml',
        packageType: 'unit',
        quantityOrdered: 10,
        unitsDeducted: 10,
        unitPrice: 20000,
        subtotal: 201500,
      },
    ],
  },
  {
    id: 'tx_rc_1002',
    storeId: DEMO_STORE_ID,
    channel: 'pwa_client',
    customerName: 'Sarah Jenkins',
    customerPhone: '+6281298837741',
    totalAmount: 930000,
    totalCost: 651000,
    paymentMethod: 'card',
    status: 'completed',
    fraudScore: 22,
    fraudFlags: ['OTP_VERIFIED', 'IN_GEOFENCE_32M'],
    riskLevel: 'clean',
    distanceToStoreMeters: 32,
    gpsAccuracy: 12,
    aiExplanation: 'Client PWA purchase inside trusted neighborhood geofence. Customer successfully authenticated with Firebase Phone OTP.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    items: [
      {
        id: 'item_1002_1',
        storeId: DEMO_STORE_ID,
        transactionId: 'tx_rc_1002',
        productId: 'prod_indomie_01',
        productName: 'Indomie Mi Goreng Special',
        packageType: 'carton',
        quantityOrdered: 3, // 3 cartons = 120 units
        unitsDeducted: 120,
        unitPrice: 310000,
        subtotal: 930000,
      },
    ],
  },
  {
    id: 'tx_rc_1003',
    storeId: DEMO_STORE_ID,
    channel: 'pwa_client',
    customerName: 'Shadow Buyer (Spoofed Device)',
    customerPhone: '+6289998881122',
    totalAmount: 3720000,
    totalCost: 2604000,
    paymentMethod: 'bank_transfer',
    status: 'flagged_fraud',
    fraudScore: 92,
    fraudFlags: ['GEOFENCE_BREACH_14800M', 'MOCK_GPS_DETECTED', 'ABNORMAL_CARTON_DRAIN', 'VELOCITY_BURST'],
    riskLevel: 'critical',
    distanceToStoreMeters: 14850,
    gpsAccuracy: 0, // Mock GPS signature
    isMockGpsSuspected: true,
    aiExplanation: 'CRITICAL ALERT: Device reported 0m precision (characteristic of mock GPS provider). Physical coordinate is 14.8km away from store perimeter. Attempting bulk drain of 12 cartons Indomie within 90 seconds.',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    items: [
      {
        id: 'item_1003_1',
        storeId: DEMO_STORE_ID,
        transactionId: 'tx_rc_1003',
        productId: 'prod_indomie_01',
        productName: 'Indomie Mi Goreng Special',
        packageType: 'carton',
        quantityOrdered: 12,
        unitsDeducted: 480,
        unitPrice: 310000,
        subtotal: 3720000,
      },
    ],
  },
  {
    id: 'tx_rc_1004',
    storeId: DEMO_STORE_ID,
    channel: 'pwa_client',
    customerName: 'Dian Permata',
    customerPhone: '+6285711223344',
    totalAmount: 744000,
    totalCost: 511500,
    paymentMethod: 'qris',
    status: 'pending_approval',
    fraudScore: 68,
    fraudFlags: ['GEOFENCE_BORDERLINE_620M', 'FIRST_TIME_ACCOUNT'],
    riskLevel: 'medium',
    distanceToStoreMeters: 620,
    gpsAccuracy: 25,
    aiExplanation: 'Customer is slightly outside the standard 500m geofence perimeter (620m). GPS accuracy reported moderate signal drift. Flagged for cashier manual review before fulfillment.',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    items: [
      {
        id: 'item_1004_1',
        storeId: DEMO_STORE_ID,
        transactionId: 'tx_rc_1004',
        productId: 'prod_chocolate_06',
        productName: 'SilverQueen Cashew Milk Chocolate 62g',
        packageType: 'carton',
        quantityOrdered: 1,
        unitsDeducted: 30,
        unitPrice: 744000,
        subtotal: 744000,
      },
    ],
  },
];

export async function seedDemoDataIfEmpty(): Promise<boolean> {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (!productsSnapshot.empty) {
      console.log('Database already initialized with data.');
      return false;
    }

    console.log('Seeding initial demo data for RiskCart...');
    // 1. Seed Store Config
    await setDoc(doc(db, 'stores', DEMO_STORE_ID), DEFAULT_STORE_CONFIG);

    // 2. Seed Products
    const batch = writeBatch(db);
    for (const prod of INITIAL_PRODUCTS) {
      const prodRef = doc(db, 'products', prod.id);
      batch.set(prodRef, {
        ...prod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Seed Transactions and subcollection items
    for (const tx of INITIAL_TRANSACTIONS) {
      const txRef = doc(db, 'transactions', tx.id);
      const { items, ...txData } = tx;
      batch.set(txRef, txData);

      if (items && items.length > 0) {
        for (const item of items) {
          const itemRef = doc(db, 'transactions', tx.id, 'items', item.id);
          batch.set(itemRef, item);
        }
      }
    }

    // 4. Seed Fraud Log
    const fraudRef = doc(db, 'fraud_logs', 'log_anomaly_1003');
    const logData: FraudLog = {
      id: 'log_anomaly_1003',
      storeId: DEMO_STORE_ID,
      transactionId: 'tx_rc_1003',
      riskLevel: 'critical',
      anomalyType: 'GEOFENCE_SPOOF_CARTON_DRAIN',
      summary: 'Prevented automated carton inventory drain from spoofed GPS location 14.8km away.',
      aiDetails: 'Preventive AI model detected 0m accuracy GPS mock provider and velocity spike exceeding threshold by 450%. High probability of automated scalper bot.',
      resolved: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    };
    batch.set(fraudRef, logData);

    await batch.commit();
    console.log('Seeding completed successfully.');
    return true;
  } catch (error) {
    console.warn('Notice during initial demo data seed:', error);
    return false;
  }
}

async function deleteCollectionDocs(path: string[], withItems = false): Promise<void> {
  const snap = await getDocs(collection(db, path[0], ...path.slice(1)));
  let batch = writeBatch(db);
  let n = 0;
  for (const d of snap.docs) {
    if (withItems) {
      const items = await getDocs(collection(db, path[0], d.id, 'items'));
      for (const it of items.docs) {
        batch.delete(it.ref);
        if (++n >= 400) { await batch.commit(); batch = writeBatch(db); n = 0; }
      }
    }
    batch.delete(d.ref);
    if (++n >= 400) { await batch.commit(); batch = writeBatch(db); n = 0; }
  }
  if (n > 0) await batch.commit();
}

export async function resetDatabaseWithFreshSeed(): Promise<void> {
  // Hapus semua data operasional (termasuk data hasil uji) sebelum seed ulang.
  await deleteCollectionDocs(['transactions'], true);
  await deleteCollectionDocs(['fraud_logs']);
  await deleteCollectionDocs(['products']);
  const batch = writeBatch(db);
  // Store
  batch.set(doc(db, 'stores', DEMO_STORE_ID), DEFAULT_STORE_CONFIG);

  // Products
  for (const prod of INITIAL_PRODUCTS) {
    batch.set(doc(db, 'products', prod.id), {
      ...prod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Transactions
  for (const tx of INITIAL_TRANSACTIONS) {
    const { items, ...txData } = tx;
    batch.set(doc(db, 'transactions', tx.id), txData);
    if (items) {
      for (const item of items) {
        batch.set(doc(db, 'transactions', tx.id, 'items', item.id), item);
      }
    }
  }

  await batch.commit();
}
