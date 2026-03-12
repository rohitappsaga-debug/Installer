import { Order } from '../types';

interface PrintableBillProps {
  order: Order;
  currency: string;
  taxRate: number;
  taxEnabled: boolean;
  restaurantName: string;
  restaurantAddress?: string;
  gstNo?: string;
  footerMessage?: string;
}

export function PrintableBill({ order, currency, taxRate, taxEnabled, restaurantName, restaurantAddress, gstNo, footerMessage }: PrintableBillProps) {
  // Consolidate all items and payments from the sitting
  const sessionItems = [
    ...(order.items || []),
    ...(order.previousOrders?.flatMap(o => (o.items || []).map(oi => ({
      ...oi,
      orderId: o.id
    }))) || [])
  ];

  const sessionPayments = [
    ...(order.paymentTransactions || []),
    ...(order.previousOrders?.flatMap(o => (o as any).paymentTransactions || []) || [])
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const subtotal = sessionItems.reduce((sum, item) => sum + (Number(item.menuItem?.price || 0) * (item.quantity || 0)), 0);

  const discountAmount = order.discount
    ? order.discount.type === 'percentage'
      ? (subtotal * order.discount.value) / 100
      : order.discount.value
    : 0;

  const afterDiscount = subtotal - discountAmount;
  const totalTaxAmount = taxEnabled ? (afterDiscount * taxRate) / 100 : 0;
  const sessionGrandTotal = afterDiscount + totalTaxAmount;
  const totalPaid = sessionPayments.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const remainingDue = Math.max(0, sessionGrandTotal - totalPaid);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const paymentMode = sessionPayments.length > 0
    ? sessionPayments[sessionPayments.length - 1].method.toUpperCase()
    : 'CASH';

  return (
    <>
      <div className="print-receipt bg-white text-black p-8 font-mono text-[13px] uppercase leading-tight relative overflow-hidden max-w-[80mm] mx-auto shadow-lg min-h-[120mm]">
        <div className="text-center space-y-1 mb-6">
          <div className="text-sm font-bold tracking-[0.2em] border-y border-black/10 py-1 mb-2">*** TAX INVOICE ***</div>
          <div className="text-xl font-bold font-display">{restaurantName}</div>
          {restaurantAddress && (
            <>
              <div className="text-[11px] whitespace-pre-wrap">{restaurantAddress}</div>
            </>
          )}
          {gstNo && <div className="text-[11px]">GSTIN: {gstNo}</div>}
          <div className="font-bold py-2 underline decoration-double">TAX INVOICE</div>
        </div>

        <div className="flex justify-between mt-2">
          <div>BILL NO. : {order.orderNumber || order.id.slice(0, 6).toUpperCase()}</div>
          <div>DATE: {formatDate(order.createdAt)}</div>
        </div>
        <div className="flex justify-between">
          <div>Table No. : {order.tableNumber}</div>
          <div>Waiter No. : --</div>
        </div>

        <div className="border-t border-dashed border-black w-full my-1"></div>

        <div className="flex justify-between font-bold py-1">
          <div className="w-1/2">DESCRIPTION</div>
          <div className="w-1/6 text-right">QTY</div>
          <div className="w-1/6 text-right">RATE</div>
          <div className="w-1/6 text-right">AMT</div>
        </div>

        <div className="border-t border-dashed border-black w-full mb-2"></div>

        <div className="space-y-1.5">
          {sessionItems.map((item, index) => {
            const price = Number(item.menuItem?.price || 0);
            const qty = Number(item.quantity || 0);
            const total = price * qty;
            return (
              <div key={index} className="flex justify-between">
                <div className="w-1/2 truncate pr-1">{item.menuItem?.name || 'Unknown Item'}</div>
                <div className="w-1/6 text-right">{qty}</div>
                <div className="w-1/6 text-right">{price.toFixed(2)}</div>
                <div className="w-1/6 text-right">{total.toFixed(2)}</div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-dashed border-black w-full mt-4"></div>

        <div className="space-y-1.5 py-3">
          <div className="flex justify-between">
            <div className="font-bold">SUB TOTAL :</div>
            <div className="font-bold">{subtotal.toFixed(2)}</div>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between">
              <div>DISCOUNT :</div>
              <div>-{discountAmount.toFixed(2)}</div>
            </div>
          )}

          {taxEnabled && (
            <>
              <div className="flex justify-between">
                <div>CGST @ {(taxRate / 2).toFixed(1)}% :</div>
                <div>{(totalTaxAmount / 2).toFixed(2)}</div>
              </div>
              <div className="flex justify-between">
                <div>SGST @ {(taxRate / 2).toFixed(1)}% :</div>
                <div>{(totalTaxAmount / 2).toFixed(2)}</div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-dashed border-black w-full"></div>

        <div className="flex justify-between py-3 text-lg font-bold">
          <div>NET TOTAL:</div>
          <div>{currency} {sessionGrandTotal.toFixed(2)}</div>
        </div>

        <div className="border-t border-dashed border-black w-full"></div>

        <div className="text-center mt-8 space-y-2">
          <div>(TIME: {formatTime(order.createdAt)})</div>
          <div className="font-bold text-sm tracking-wider mt-2">THANK YOU! VISIT AGAIN</div>
          <div className="text-[10px] text-slate-500 pt-6">*** POWERED BY RECEIPTPRO POS ***</div>
        </div>
      </div>
    </>
  );
}
