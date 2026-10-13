import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Product,
  StoreConfig,
  Transaction,
  TransactionItem,
  PackageType,
  RiskSeverity,
  TransactionChannel,
  PaymentMethod,
  TransactionStatus,
  FraudLog,
} from '../types';

export const DEMO_STORE_ID = 'store_demo_01';

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: DEMO_STORE_ID,
  name: 'RiskCart Flagship Mart (AI Cup 2026)',
  ownerEmail: 'panglimabesarisis@gmail.com',
  latitude: -6.2088, // Central Jakarta benchmark
  longitude: 106.8456,
  geofenceRadiusMeters: 500, // 500m boundary for verified high-trust checkout
  fraudThresholdScore: 65,
  currency: 'USD',
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
    costPerUnit: 2.50,
    pricePerUnit: 3.50,
    pricePerCarton: 78.00,
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
    costPerUnit: 1.10,
    pricePerUnit: 1.60,
    pricePerCarton: 35.00,
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
    costPerUnit: 1.20,
    pricePerUnit: 1.80,
    pricePerCarton: 38.00,
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
    costPerUnit: 0.85,
    pricePerUnit: 1.25,
    pricePerCarton: 27.00,
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
    costPerUnit: 0.40,
    pricePerUnit: 0.65,
    pricePerCarton: 14.50,
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
    costPerUnit: 0.50,
    pricePerUnit: 0.80,
    pricePerCarton: 17.50,
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
    costPerUnit: 1.50,
    pricePerUnit: 2.20,
    pricePerCarton: 2.20,
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
    costPerUnit: 1.20,
    pricePerUnit: 1.90,
    pricePerCarton: 1.90,
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
    costPerUnit: 0.35,
    pricePerUnit: 0.55,
    pricePerCarton: 20.00,
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
    costPerUnit: 0.80,
    pricePerUnit: 1.30,
    pricePerCarton: 28.00,
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
    costPerUnit: 0.55,
    pricePerUnit: 0.90,
    pricePerCarton: 19.50,
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
    costPerUnit: 1.20,
    pricePerUnit: 1.75,
    pricePerCarton: 19.80,
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
    totalAmount: 18.50,
    totalCost: 11.20,
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
        unitPrice: 0.55,
        subtotal: 5.50,
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
        unitPrice: 1.30,
        subtotal: 13.00,
      },
    ],
  },
  {
    id: 'tx_rc_1002',
    storeId: DEMO_STORE_ID,
    channel: 'pwa_client',
    customerName: 'Sarah Jenkins',
    customerPhone: '+6281298837741',
    totalAmount: 60.00,
    totalCost: 42.00,
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
        unitPrice: 20.00,
        subtotal: 60.00,
      },
    ],
  },
  {
    id: 'tx_rc_1003',
    storeId: DEMO_STORE_ID,
    channel: 'pwa_client',
    customerName: 'Shadow Buyer (Spoofed Device)',
    customerPhone: '+6289998881122',
    totalAmount: 240.00,
    totalCost: 168.00,
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
        unitPrice: 20.00,
        subtotal: 240.00,
      },
    ],
  },
  {
    id: 'tx_rc_1004',
    storeId: DEMO_STORE_ID,
    channel: 'pwa_client',
    customerName: 'Dian Permata',
    customerPhone: '+6285711223344',
    totalAmount: 48.00,
    totalCost: 33.00,
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
        unitPrice: 48.00,
        subtotal: 48.00,
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

export async function resetDatabaseWithFreshSeed(): Promise<void> {
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

function mulberry32(seed: number) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class BatchRunner {
  private batch = writeBatch(db);
  private count = 0;

  async set(ref: any, data: any) {
    this.batch.set(ref, data);
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async update(ref: any, data: any) {
    this.batch.update(ref, data);
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count > 0) {
      await this.batch.commit();
      this.batch = writeBatch(db);
      this.count = 0;
    }
  }
}

export async function seedReportDemoIfNeeded(): Promise<void> {
  try {
    const reportSeedRef = doc(db, 'seed', 'report_demo');
    const reportSeedSnap = await getDoc(reportSeedRef);
    if (reportSeedSnap.exists()) {
      return;
    }

    const batchRunner = new BatchRunner();
    const rand = mulberry32(7);

    // 1. Update storageLocation for existing products with empty storageLocation
    const prodSnap = await getDocs(collection(db, 'products'));
    const outletCycle = ['out_1', 'out_2', 'out_3'];
    let cycleIdx = 0;

    for (const pDoc of prodSnap.docs) {
      const pData = pDoc.data() as Partial<Product>;
      if (!pData.storageLocation || pData.storageLocation.trim() === '') {
        let loc = '';
        if (pData.category === 'Mineral Dus' || pData.category === 'Mineral Galon') {
          loc = 'wh_1';
        } else if (pData.category === 'Gas') {
          loc = 'wh_2';
        } else {
          loc = outletCycle[cycleIdx % 3];
          cycleIdx++;
        }
        await batchRunner.update(pDoc.ref, { storageLocation: loc });
      }
    }

    // 2. 90 transactions
    const CUSTOMER_NAMES = [
      'Budi Santoso', 'Siti Rahmawati', 'Ahmad Fauzi', 'Dewi Lestari',
      'Eko Prasetyo', 'Rina Marlina', 'Hendra Gunawan', 'Nurul Hidayati',
      'Agus Setiawan', 'Maya Indah', 'Rizky Pratama', 'Indah Permata Sari',
      'Doni Wahyudi', 'Fitri Handayani', 'Joko Susilo', 'Tari Anggraini',
    ];

    const now = new Date();

    for (let i = 0; i < 90; i++) {
      const txId = 'demo_tx_' + String(i + 1).padStart(3, '0');

      // CreatedAt spread over last 30 days, hours 08:00 - 20:00
      const daysAgo = 29 - Math.floor((i / 90) * 30);
      const hour = 8 + Math.floor(rand() * 12);
      const minute = Math.floor(rand() * 60);
      const second = Math.floor(rand() * 60);
      const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      txDate.setHours(hour, minute, second, 0);
      const createdAt = txDate.toISOString();

      // outletId: out_1 55% / out_2 25% / out_3 20%
      const rOut = rand();
      const outletId = rOut < 0.55 ? 'out_1' : rOut < 0.80 ? 'out_2' : 'out_3';

      // channel: pos 70% / pwa_client 30%
      const rChan = rand();
      const channel: TransactionChannel = rChan < 0.70 ? 'pos' : 'pwa_client';

      // paymentMethod: cash 45% / qris 40% / card 15%
      const rPay = rand();
      const paymentMethod: PaymentMethod = rPay < 0.45 ? 'cash' : rPay < 0.85 ? 'qris' : 'card';

      // status: completed 90% / flagged_fraud 5% / pending_approval 5%
      const rStat = rand();
      const status: TransactionStatus = rStat < 0.90 ? 'completed' : rStat < 0.95 ? 'flagged_fraud' : 'pending_approval';

      // 1-3 items from INITIAL_PRODUCTS (qty 1-6; packageType carton bila category 'Mineral Dus')
      const itemCount = 1 + Math.floor(rand() * 3);
      const pickedIndices: number[] = [];
      while (pickedIndices.length < itemCount) {
        const pIdx = Math.floor(rand() * INITIAL_PRODUCTS.length);
        if (!pickedIndices.includes(pIdx)) {
          pickedIndices.push(pIdx);
        }
      }

      const txItems: TransactionItem[] = [];
      let totalSubtotal = 0;

      for (let j = 0; j < pickedIndices.length; j++) {
        const prod = INITIAL_PRODUCTS[pickedIndices[j]];
        const qty = 1 + Math.floor(rand() * 6);
        const isCarton = prod.category === 'Mineral Dus';
        const packageType: PackageType = isCarton ? 'carton' : 'unit';
        const unitPrice = isCarton ? prod.pricePerCarton : prod.pricePerUnit;
        const unitsDeducted = isCarton ? qty * prod.piecesPerCarton : qty;
        const subtotal = Number((qty * unitPrice).toFixed(2));
        totalSubtotal += subtotal;

        const item: TransactionItem = {
          id: `item_${txId}_${j + 1}`,
          storeId: DEMO_STORE_ID,
          transactionId: txId,
          productId: prod.id,
          productName: prod.name,
          packageType,
          quantityOrdered: qty,
          unitsDeducted,
          unitPrice,
          subtotal,
        };
        txItems.push(item);
      }

      const totalAmount = Number(totalSubtotal.toFixed(2));
      const costMultiplier = 0.60 + rand() * 0.12;
      const totalCost = Number((totalAmount * costMultiplier).toFixed(2));

      let fraudScore: number;
      let riskLevel: RiskSeverity;
      let fraudFlags: string[];

      if (status === 'flagged_fraud') {
        fraudScore = Math.floor(70 + rand() * 21); // 70-90
        riskLevel = 'critical';
        fraudFlags = ['SUSPECTED_BOT_BURST', 'GEOFENCE_ANOMALY'];
      } else if (status === 'pending_approval') {
        fraudScore = Math.floor(25 + rand() * 20); // 25-44
        riskLevel = 'medium';
        fraudFlags = ['MANUAL_REVIEW_REQUIRED'];
      } else {
        fraudScore = Math.floor(5 + rand() * 21); // 5-25
        riskLevel = 'clean';
        fraudFlags = channel === 'pos' ? ['VERIFIED_POS_CHECKOUT'] : ['PWA_VERIFIED_MEMBER'];
      }

      const customerName = CUSTOMER_NAMES[Math.floor(rand() * CUSTOMER_NAMES.length)];
      const cashierId = channel === 'pos'
        ? (outletId === 'out_1' ? 'cashier_01' : outletId === 'out_2' ? 'cashier_02' : 'cashier_03')
        : null;

      const aiExplanation = status === 'flagged_fraud'
        ? 'Transaksi ditandai mencurigakan oleh sistem deteksi anomali.'
        : 'Transaksi berhasil divalidasi dan terverifikasi aman.';

      const txDoc: any = {
        id: txId,
        storeId: DEMO_STORE_ID,
        outletId,
        channel,
        customerName,
        totalAmount,
        totalCost,
        paymentMethod,
        status,
        fraudScore,
        fraudFlags,
        riskLevel,
        aiExplanation,
        createdAt,
        items: txItems,
      };

      if (cashierId) {
        txDoc.cashierId = cashierId;
      }

      await batchRunner.set(doc(db, 'transactions', txId), txDoc);
      for (const it of txItems) {
        await batchRunner.set(doc(db, 'transactions', txId, 'items', it.id), it);
      }
    }

    // 3. Mark seed/report_demo
    await batchRunner.set(doc(db, 'seed', 'report_demo'), {
      createdAt: new Date().toISOString(),
    });

    await batchRunner.commit();
    console.log('Multi-outlet report demo seed completed successfully.');
  } catch (error) {
    console.warn('Notice during seedReportDemoIfNeeded:', error);
  }
}
