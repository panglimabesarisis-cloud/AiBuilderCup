import React, { useState } from 'react';
import {
  User,
  Clock,
  QrCode,
  Phone,
  MapPin,
  ExternalLink,
  Printer,
  ShieldCheck,
  CheckCircle,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { DEMO_STORE_ID } from '../../services/dataSeeder';

interface GlobalModalsProps {
  activeModal: string | null;
  onClose: () => void;
  currencyMode: 'IDR' | 'USD';
  onNavigateTab: (tab: string) => void;
  onSelectCustomer?: (customerName: string) => void;
  sessionSeconds?: number;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
  activeModal,
  onClose,
  currencyMode,
  onNavigateTab,
  onSelectCustomer,
  sessionSeconds = 0,
}) => {
  // Customer directory state
  const [customerList, setCustomerList] = useState([
    { id: 'c1', name: 'General Counter Walk-in', phone: '-', type: 'Guest', points: 0, address: 'Counter' },
    { id: 'c2', name: 'Risyad Retail Store (PWA Member)', phone: '+6281298837741', type: 'VIP Member', points: 240, address: 'Melati Street No. 14 (32m away)' },
    { id: 'c3', name: 'Budi Santoso', phone: '+6281311223344', type: 'Member', points: 85, address: 'Mawar Street No. 3' },
    { id: 'c4', name: 'Siti Nurhaliza (Local Grocer)', phone: '+6281987654321', type: 'Wholesale Member', points: 310, address: 'Pasar Baru Complex No. 8' },
  ]);
  const [selectedCustName, setSelectedCustName] = useState('General Counter Walk-in');
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });

  // Cashier shift state
  const shiftStartingCash = 250000;
  const currentCashSales = 125000;
  const [shiftClosed, setShiftClosed] = useState(false);

  // Scanner state
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Risyad Retail Store (PWA Client)', time: '14:20', text: 'Hello cashier, is my order for Indomie Carton and Mineral Water ready for delivery?', fromCustomer: true },
    { id: 2, sender: 'RiskCart Cashier', time: '14:21', text: 'Hello! Yes, Indomie Dus and Le Minerale are currently packed. Dispatching rider now.', fromCustomer: false },
  ]);
  const [newChatText, setNewChatText] = useState('');

  // PWA Order state
  const [pwaOrderProcessed, setPwaOrderProcessed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1500);
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScanSample = (code: string, name: string) => {
    setScannedBarcode(code);
    setScanFeedback(`Item Identified: ${name} (${code})`);
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handlePwaAction = (action: 'approve' | 'reject') => {
    setPwaOrderProcessed(true);
    showToast(action === 'approve' ? 'Order #PWA26100977DB Approved & Dispatched!' : 'Order #PWA26100977DB Rejected.');
  };

  if (!activeModal) return null;

  return (
    <>
      {/* 1. Customer Directory Modal */}
      {activeModal === 'customers' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Customer Directory
                </h3>
                <p className="text-xs text-zinc-400">Select customer for cashier orders or register a new customer profile.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {customerList.map((cust) => (
                <div
                  key={cust.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    selectedCustName === cust.name
                      ? 'bg-blue-600/15 border-blue-500/50'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {cust.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-normal">
                        {cust.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Phone: <span className="font-mono text-zinc-300">{cust.phone}</span> &bull; Points: <span className="text-blue-400 font-bold">{cust.points} Pts</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCustName(cust.name);
                      if (onSelectCustomer) onSelectCustomer(cust.name);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedCustName === cust.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {selectedCustName === cust.name ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Customer */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <span className="font-bold text-white block">Register New Customer:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Phone Number (+62...)"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white"
                />
              </div>
              <button
                onClick={() => {
                  if (!newCustomerForm.name) return;
                  const newC = {
                    id: 'c_' + Date.now(),
                    name: newCustomerForm.name,
                    phone: newCustomerForm.phone || '-',
                    type: 'Member',
                    points: 10,
                    address: 'Main Store Register',
                  };
                  setCustomerList([...customerList, newC]);
                  setSelectedCustName(newC.name);
                  if (onSelectCustomer) onSelectCustomer(newC.name);
                  setNewCustomerForm({ name: '', phone: '' });
                  onClose();
                }}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                + Save &amp; Select Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cashier Shift Modal */}
      {activeModal === 'shift' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Cashier Shift Report
                </h3>
                <p className="text-xs text-zinc-400">Active Cashier: Administrator &bull; Session #{formatTimer(sessionSeconds)}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-zinc-400">
                <span>Starting Drawer Cash:</span>
                <span className="font-mono text-white font-bold">
                  {currencyMode === 'IDR' ? `Rp ${shiftStartingCash.toLocaleString('id-ID')}` : `$${(shiftStartingCash / 15000).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Cash Sales Tendered:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {currencyMode === 'IDR' ? `Rp ${currentCashSales.toLocaleString('id-ID')}` : `$${(currentCashSales / 15000).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Digital Payments (QRIS / Card):</span>
                <span className="font-mono text-blue-400 font-bold">
                  {currencyMode === 'IDR' ? 'Rp 145.000' : '$9.60'}
                </span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-zinc-800 text-sm">
                <span>Total Physical Cash in Drawer:</span>
                <span className="font-mono text-emerald-400">
                  {currencyMode === 'IDR'
                    ? `Rp ${(shiftStartingCash + currentCashSales).toLocaleString('id-ID')}`
                    : `$${((shiftStartingCash + currentCashSales) / 15000).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  showToast('Laporan shift kasir berhasil dicetak ke thermal printer!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Shift Report
              </button>
              <button
                onClick={() => {
                  setShiftClosed(true);
                  showToast('Shift kasir berhasil ditutup! Rekonsiliasi laci kasir terkunci.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                End Shift &amp; Lock Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[60] bg-zinc-900 border border-zinc-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Barcode Scanner Modal */}
      {activeModal === 'scanner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  Camera &amp; Barcode Scanner
                </h3>
                <p className="text-xs text-zinc-400">Align barcode with viewfinder or click sample barcodes below.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            {/* Viewfinder simulation */}
            <div className="relative aspect-video rounded-xl bg-black border-2 border-blue-500/50 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
              <div className="w-36 h-28 border-2 border-dashed border-blue-400/60 rounded-lg flex items-center justify-center text-[11px] font-mono text-blue-300 bg-blue-950/20">
                ALIGN BARCODE
              </div>
              <div className="absolute bottom-2 text-[10px] text-zinc-500 font-mono">
                Optical Sensor Active &bull; 60 FPS
              </div>
            </div>

            {scanFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center animate-bounce">
                {scanFeedback}
              </div>
            )}

            {/* Quick Test Barcode Buttons */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-zinc-400 block">Click Sample Product Barcode:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleScanSample('8998866200112', 'Indomie Goreng Carton')}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left"
                >
                  <div className="font-bold text-white truncate">Indomie Dus</div>
                  <div className="text-[10px] font-mono text-zinc-500">8998866200112</div>
                </button>
                <button
                  onClick={() => handleScanSample('899123456004', 'Hydro Coco 250ml')}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left"
                >
                  <div className="font-bold text-white truncate">Hydro Coco</div>
                  <div className="text-[10px] font-mono text-zinc-500">899123456004</div>
                </button>
                <button
                  onClick={() => handleScanSample('899123456001', 'Nipis Madu Bottle')}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left"
                >
                  <div className="font-bold text-white truncate">Nipis Madu Botol</div>
                  <div className="text-[10px] font-mono text-zinc-500">899123456001</div>
                </button>
                <button
                  onClick={() => handleScanSample('899123456007', 'LPG Gas Cylinder 3kg')}
                  className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left"
                >
                  <div className="font-bold text-white truncate">Gas LPG 3 Kg</div>
                  <div className="text-[10px] font-mono text-zinc-500">899123456007</div>
                </button>
              </div>
            </div>

            {/* Manual input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Or type Barcode / SKU..."
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && scannedBarcode) {
                    handleScanSample(scannedBarcode, 'Custom SKU');
                  }
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
              <button
                onClick={() => {
                  if (scannedBarcode) handleScanSample(scannedBarcode, 'Custom SKU');
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Customer Chat Modal */}
      {activeModal === 'chat' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  R
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Chat: Risyad Retail Store</h3>
                  <p className="text-[10px] text-emerald-400">Online &bull; Verified Client PWA</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            <div className="h-56 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.fromCustomer ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-xl ${
                      msg.fromCustomer
                        ? 'bg-zinc-800 text-zinc-200'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <div className="text-[10px] opacity-75 font-semibold mb-0.5">{msg.sender}</div>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Type reply to customer..."
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newChatText.trim()) {
                    setChatMessages([
                      ...chatMessages,
                      { id: Date.now(), sender: 'RiskCart Cashier', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: newChatText, fromCustomer: false },
                    ]);
                    setNewChatText('');
                  }
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (!newChatText.trim()) return;
                  setChatMessages([
                    ...chatMessages,
                    { id: Date.now(), sender: 'RiskCart Cashier', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: newChatText, fromCustomer: false },
                  ]);
                  setNewChatText('');
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Orders Queue Modal */}
      {activeModal === 'orders' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Incoming Orders Queue (Live)
                </h3>
                <p className="text-xs text-zinc-400">Monitor and verify online orders dispatched from Client PWA.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-white">#PWA26100977DB</span>
                  <div className="text-[11px] text-zinc-400">Risyad Store &bull; 1x Gas LPG 3 Kg, 1x Aspen Liter</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pwaOrderProcessed ? 'Completed' : 'Awaiting Confirmation'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 text-xs text-zinc-300 flex items-center justify-between">
                <span>Total Order: <strong className="text-emerald-400 font-mono">Rp 37.500</strong></span>
                <span className="text-zinc-400">GPS: 32 meters from store</span>
              </div>

              {!pwaOrderProcessed && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handlePwaAction('approve')}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    ✓ Fulfill &amp; Send Receipt
                  </button>
                  <button
                    onClick={() => handlePwaAction('reject')}
                    className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onNavigateTab('transactions');
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
            >
              Open All Transaction History &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 6. Order Radar & GPS Modal */}
      {activeModal === 'delivery' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Order Delivery Monitoring &amp; GPS Radar
                </h3>
                <p className="text-xs text-zinc-400">Verify geofence boundary and dispatch couriers.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Store Geofence Radius:</span>
                <span className="font-mono text-emerald-400 font-bold">500 Meters</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Store Coordinates:</span>
                <span className="font-mono text-white">-6.208800, 106.845600</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Active Courier:</span>
                <span className="text-white font-bold">RiskCart Express Rider #01 (Bike Dispatch)</span>
              </div>
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-[11px] mt-2">
                Delivery Status: Verified within 500m geofence. En route to customer (~3 min ETA).
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              Done Monitoring
            </button>
          </div>
        </div>
      )}

      {/* 7. Cashier Account Modal */}
      {activeModal === 'account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Cashier Account Profile
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-zinc-400">
                <span>Username:</span>
                <span className="font-bold text-white">Administrator (Store Owner)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tenant Store ID:</span>
                <span className="font-mono text-blue-400 font-bold">{DEMO_STORE_ID}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Platform:</span>
                <span className="text-emerald-400 font-bold">RiskCart Point Of Sale</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>AI Engine:</span>
                <span className="text-purple-400 font-bold">Gemini 3.8 Flash</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 8. Help & Keyboard Shortcuts Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                Cashier Help &amp; Keyboard Shortcuts
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">&quot;Exact Cash&quot; Button</span>
                <span className="text-blue-400 font-bold">Autofill exact amount</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">&quot;Process Payment&quot;</span>
                <span className="text-emerald-400 font-bold">Charge &amp; Print Receipt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Clear Order</span>
                <span className="text-rose-400 font-bold">Clear active cart</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Carton / Unit Switch</span>
                <span className="text-amber-400 font-bold">Auto carton conversion</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
