
import React, { useEffect } from 'react';
import { Order } from '../types';

interface PosReceiptProps {
    order: Order;
    currency: string;
    taxRate: number;
    taxEnabled: boolean;
    restaurantName: string;
    restaurantAddress?: string;
    gstNo?: string;
    footerMessage?: string;
    autoPrint?: boolean;
}

export function PosReceipt({
    order,
    currency,
    taxRate,
    taxEnabled,
    restaurantName,
    restaurantAddress,
    gstNo,
    footerMessage,
    autoPrint = true
}: PosReceiptProps) {

    // Consolidate items and payments exactly like PrintableBill
    const sessionItems = [
        ...(order.items || []),
        ...(order.previousOrders?.flatMap(o => (o.items || []).map(oi => ({
            ...oi,
            orderId: o.id
        }))) || [])
    ];

    const subtotal = sessionItems.reduce((sum, item) => sum + (Number(item.menuItem?.price || 0) * (item.quantity || 0)), 0);

    const discountAmount = order.discount
        ? order.discount.type === 'percentage'
            ? (subtotal * order.discount.value) / 100
            : order.discount.value
        : 0;

    const afterDiscount = subtotal - discountAmount;
    const totalTaxAmount = taxEnabled ? (afterDiscount * taxRate) / 100 : 0;
    const sessionGrandTotal = afterDiscount + totalTaxAmount;

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return dateStr; }
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return ''; }
    };

    useEffect(() => {
        if (autoPrint) {
            // Small delay to ensure render
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoPrint]);

    return (
        <div className="print-receipt-container bg-gray-200">
            {/* Style injection for font and specific print overrides */}
            <style>{`
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

.font-receipt {
  font-family: 'Courier Prime', monospace;
}

/* Screen only */
@media screen {
  .print-receipt-container {
    background-color: #e5e7eb;
  }
}

/* ===== ROBUST CROSS-BROWSER PRINT CSS ===== */
@page {
  size: 80mm auto;
  margin: 0;
}

@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  /* Hide everything safely */
  body * {
    visibility: hidden;
    height: 0;
  }

  .print-receipt-container,
  .print-receipt-container * {
    visibility: visible;
    height: auto;
  }

  .print-receipt-container {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    display: block !important;
  }

  .print-receipt {
    width: 100% !important;        
    max-width: 80mm !important;
    margin: 0 !important;     
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
  }

  .no-print-button {
    display: none !important;
  }
}


            `}</style>


            {/* Receipt Wrapper */}
            <div className="receipt-wrapper">
                {/* Manual Print Button */}

                <div className="no-print-button mb-4 text-center">
                    <button
                        onClick={() => window.print()}
                        className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800 font-sans text-sm font-bold uppercase tracking-wider"
                    >
                        Print Receipt
                    </button>
                </div>

                {/* Actual Receipt - 80mm */}
                <div className="print-receipt bg-white text-black font-receipt text-[12px] uppercase leading-[1.2] shadow-lg mx-auto">

                    {/* Header */}
                    <div className="text-center space-y-1 mb-4">
                        <div className="font-bold text-[14px] tracking-widest py-1">*** {order.id.slice(-4)} ***</div>
                        <div className="text-[18px] font-bold py-1 whitespace-pre-wrap leading-tight">{restaurantName}</div>
                        {restaurantAddress && (
                            <div className="text-[10px] whitespace-pre-wrap">{restaurantAddress}</div>
                        )}
                        {gstNo && <div className="text-[10px]">GSTIN: {gstNo}</div>}
                        <div className="font-bold pt-4 text-[13px] underline">TAX INVOICE</div>
                    </div>

                    {/* Bill Info */}
                    <div className="flex justify-between mt-4">
                        <span>BILL NO. : {order.orderNumber || order.id.slice(0, 8)}</span>
                        <span>DATE:</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{order.id.slice(0, 8)}</span>
                        <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span>T. NO. : {order.tableNumber}</span>
                        <span>W. NO. : {order.createdBy ? order.createdBy.slice(0, 4) : '--'}</span>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-dashed border-black w-full my-2"></div>

                    {/* Items Header */}
                    <div className="flex font-bold pb-1 text-[11px]">
                        <div className="w-[45%]">DESCRIPTION</div>
                        <div className="w-[15%] text-right">QTY</div>
                        <div className="w-[20%] text-right">RATE</div>
                        <div className="w-[20%] text-right">AMT</div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-dashed border-black w-full mb-1"></div>

                    {/* Items List */}
                    <div className="space-y-2 py-1">
                        {sessionItems.map((item, index) => {
                            const price = Number(item.menuItem?.price || 0);
                            const qty = Number(item.quantity || 0);
                            const total = price * qty;
                            return (
                                <div key={index} className="flex items-start">
                                    <div className="w-[45%] break-words pr-1 leading-tight">{item.menuItem?.name || 'Item'}</div>
                                    <div className="w-[15%] text-right">{qty}</div>
                                    <div className="w-[20%] text-right">{price.toFixed(2)}</div>
                                    <div className="w-[20%] text-right">{total.toFixed(2)}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Simplified Separator/Padding */}
                    <div className="border-t border-dashed border-black w-full my-2"></div>

                    {/* Totals */}
                    <div className="space-y-1 py-1">
                        <div className="flex justify-between font-bold">
                            <span>SUB TOTAL :</span>
                            <span>{subtotal.toFixed(2)}</span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span>DISCOUNT :</span>
                                <span>-{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        {taxEnabled && (
                            <>
                                <div className="flex justify-between">
                                    <span>CGST @ {(taxRate / 2).toFixed(1)}% :</span>
                                    <span>{(totalTaxAmount / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>SGST @ {(taxRate / 2).toFixed(1)}% :</span>
                                    <span>{(totalTaxAmount / 2).toFixed(2)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Net Total Separator */}
                    <div className="border-t border-dashed border-black w-full my-1"></div>

                    {/* Net Total */}
                    <div className="flex justify-between py-2 text-[14px] font-bold">
                        <span>NET TOTAL:</span>
                        <span>{currency} {sessionGrandTotal.toFixed(2)}</span>
                    </div>

                    {/* Final Separator */}
                    <div className="border-t border-dashed border-black w-full"></div>

                    {/* Footer */}
                    <div className="text-center mt-6 space-y-2">
                        <div className="text-[10px]">(TIME: {formatTime(order.createdAt)})</div>
                        <div className="font-bold text-[13px] tracking-wide relative z-10 bg-white">
                            {footerMessage || 'THANK YOU! VISIT AGAIN'}
                        </div>
                        <div className="text-[8px] pt-4 opacity-70">*** POWERED BY RECEIPTPRO POS ***</div>
                    </div>

                </div>
            </div>
        </div >
    );
}
