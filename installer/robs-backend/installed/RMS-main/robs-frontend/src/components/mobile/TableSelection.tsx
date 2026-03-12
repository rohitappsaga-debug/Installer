import { useState, useEffect } from 'react';
import { Table, Order } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, Clock, ConciergeBell, RefreshCw, Calendar, CheckCircle, Info, Link, Crown } from 'lucide-react';

interface TableSelectionProps {
  tables: Table[];
  orders: Order[];
  onSelectTable: (table: Table) => void;
  onRefresh?: (silent?: boolean) => void;
}

export function TableSelection({ tables, orders, onSelectTable, onRefresh }: TableSelectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
      case 'reserved':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-background pb-32 transition-colors duration-300">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold">Tables</h2>
            <p className="text-primary-foreground/90 text-sm">Overview of restaurant floor</p>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRefresh(false)}
                className="shadow-sm font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...tables].sort((a, b) => {
            const aHasRes = a.status === 'reserved' || !!a.reservedBy;
            const bHasRes = b.status === 'reserved' || !!b.reservedBy;
            if (aHasRes && !bHasRes) return -1;
            if (!aHasRes && bHasRes) return 1;
            return a.number - b.number;
          }).map((table) => {
            const tableOrder = (table.status !== 'free' && table.currentOrderId) ? orders.find(o => o.id === table.currentOrderId) : null;
            const hasReadyOrder = tableOrder?.status === 'ready' || tableOrder?.items.some(i => i.status === 'ready');
            const isPaid = tableOrder?.isPaid;

            // Determines card styling based on state
            let cardStyle = "bg-card border-border hover:border-primary/50 shadow-sm";
            let badgeStyle = "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";

            const isSecondary = table.groupId && !table.isPrimary;
            const isClickable = !isSecondary;

            if (table.status === 'occupied') {
              cardStyle = "bg-card border-border border-l-4 border-l-red-500 shadow-sm";
              badgeStyle = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
            } else if (table.status === 'reserved') {
              cardStyle = "bg-card border-border border-l-4 border-l-orange-500 shadow-sm";
              badgeStyle = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
            }

            if (isPaid) {
              cardStyle += " ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10";
            }
            if (hasReadyOrder) {
              cardStyle += " ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse";
            }
            if (isSecondary) {
              cardStyle += " opacity-60 grayscale-[0.5]";
            }

            return (
              <Card
                key={table.id}
                onClick={() => {
                  if (isClickable) {
                    onSelectTable(table);
                  } else {
                    // Find primary table of the group
                    const primaryTable = tables.find(t => t.groupId === table.groupId && t.isPrimary);
                    if (primaryTable) {
                      import('sonner').then(({ toast }) => {
                        toast.info(`Table ${table.number} is linked to Table ${primaryTable.number}. Redirecting...`, {
                          description: 'Orders for this group are managed through the primary table.',
                          duration: 3000,
                        });
                      });
                      onSelectTable(primaryTable);
                    }
                  }
                }}
                className={`p-5 transition-all duration-200 relative overflow-hidden ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : 'cursor-pointer'} ${cardStyle}`}
                title={isSecondary ? "Please use the primary table for this group" : (table.status === 'reserved' ? `Reserved for ${table.reservedBy || 'Guest'}` : table.status === 'occupied' ? 'Table is currently occupied' : 'Available')}
              >
                {table.groupId && (
                  <div className="absolute top-0 right-0 p-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[8px] flex items-center gap-0.5 px-1 py-0 h-4">
                      <Link className="w-2 h-2" />
                      GROUP
                    </Badge>
                  </div>
                )}
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Table</div>
                      <div className="text-3xl font-bold text-foreground flex items-center gap-2">
                        {table.number}
                        {table.isPrimary && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                    </div>
                    {isPaid ? (
                      <Badge className="bg-blue-500 text-white border-none shadow-sm">Paid</Badge>
                    ) : (
                      <Badge className={`${badgeStyle} border shadow-none`} variant="outline">
                        {getStatusLabel(table.status)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{table.capacity} Seats</span>
                    </div>

                    {isSecondary && (
                      <div className="mt-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded flex items-start gap-2 border border-blue-100 dark:border-blue-800">
                        <Info className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-tight">
                          Part of a group. Use primary table for orders.
                        </span>
                      </div>
                    )}

                    {table.status === 'reserved' && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400 truncate">
                          Guest: {table.reservedBy || 'Reserved'}
                        </div>
                        {table.reservedTime && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(table.reservedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    )}

                    {table.status === 'free' && table.reservedBy && (
                      <div className="mt-2 text-[10px] text-orange-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next: {table.reservedBy}
                      </div>
                    )}

                    {table.status === 'occupied' && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400">
                          In Use
                        </div>
                      </div>
                    )}

                    {hasReadyOrder && !isSecondary && (
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-bold animate-bounce">
                          <ConciergeBell className="w-4 h-4" />
                          <span>Order Ready!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Improved Legend */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-3 z-20 pb-safe">
        <div className="flex justify-center gap-6 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
