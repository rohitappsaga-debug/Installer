import { useState } from 'react';
import { Table } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Users, Plus, Edit, Trash2, Calendar, Clock, User, CheckCircle, Link, Unlink, Crown } from 'lucide-react';
import api from '../../utils/api';
import { Reservation } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useConfirm } from '../ui/confirm-dialog-provider';
import { toast } from 'sonner';

interface TableManagementProps {
  tables: Table[];
  onAddTable: (table: Omit<Table, 'id'>) => void;
  onBulkAddTables?: (tables: Array<Omit<Table, 'id'>>) => void;
  onUpdateTable: (id: string, table: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
}

export function TableManagement({ tables, onAddTable, onBulkAddTables, onUpdateTable, onDeleteTable }: TableManagementProps) {
  const { confirm } = useConfirm();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [newTable, setNewTable] = useState({ number: 0, capacity: 2, status: 'free' as const });
  const [bulkData, setBulkData] = useState({ startNumber: 1, quantity: 1, capacity: 2 });
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [selectedTableForRes, setSelectedTableForRes] = useState<Table | null>(null);
  const [newReservation, setNewReservation] = useState({
    customerName: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '13:00'
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedForGroup, setSelectedForGroup] = useState<number[]>([]);
  const [primaryTableForGroup, setPrimaryTableForGroup] = useState<number | null>(null);
  const [showGroupConfirm, setShowGroupConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'reserved':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleAddTable = () => {
    onAddTable(newTable);
    setNewTable({ number: 0, capacity: 2, status: 'free' });
    setShowAddDialog(false);
  };

  const handleBulkAdd = () => {
    if (onBulkAddTables) {
      const tablesToAdd: Array<Omit<Table, 'id'>> = [];
      for (let i = 0; i < bulkData.quantity; i++) {
        tablesToAdd.push({
          number: bulkData.startNumber + i,
          capacity: bulkData.capacity,
          status: 'free'
        });
      }
      onBulkAddTables(tablesToAdd);
      setShowBulkDialog(false);
      setBulkData({ startNumber: 1, quantity: 1, capacity: 2 });
    }
  };

  const handleUpdateTable = () => {
    if (editingTable) {
      // Create a sanitized payload with only allowed fields to avoid validation errors
      const payload = {
        number: editingTable.number,
        capacity: editingTable.capacity,
        status: editingTable.status,
        reservedBy: editingTable.reservedBy,
        reservedTime: editingTable.reservedTime
      };

      onUpdateTable(editingTable.id, payload);
      setEditingTable(null);
    }
  };

  const handleStatusChange = (tableId: string, newStatus: string) => {
    onUpdateTable(tableId, { status: newStatus as any });
  };

  const handleCreateReservation = async () => {
    if (!selectedTableForRes) return;
    try {
      setLoadingRes(true);
      await api.post('/reservations', {
        tableNumber: selectedTableForRes.number,
        ...newReservation
      });
      toast.success('Reservation created successfully');
      setShowReservationDialog(false);
      setNewReservation({
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '12:00',
        endTime: '13:00'
      });
      // Optionally refresh tables/reservations here
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoadingRes(false);
    }
  };

  const handleCheckIn = async (e: React.MouseEvent, tableNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsActionLoading(true);
      // Find the pending reservation for this table
      const res = await api.get(`/reservations?tableNumber=${tableNumber}&status=pending`);
      const reservation = res.data.data[0];
      if (reservation) {
        await api.patch(`/reservations/${reservation.id}/check-in`);
        toast.success('Checked in successfully');
      } else {
        toast.error('No pending reservation found');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelBooking = async (tableNumber: number) => {
    if (!await confirm({ title: "Cancel Booking", description: `Are you sure you want to cancel the booking for Table ${tableNumber}?` })) return;

    try {
      setIsActionLoading(true);
      // Find the pending reservation for this table
      const res = await api.get(`/reservations?tableNumber=${tableNumber}&status=pending`);
      const reservation = res.data.data[0];
      if (reservation) {
        await api.delete(`/reservations/${reservation.id}`);
        toast.success('Reservation cancelled successfully');
      } else {
        toast.error('No pending reservation found to cancel');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!await confirm({ title: "Delete Table", description: "Are you sure you want to delete this table? This action cannot be undone." })) return;
    try {
      setIsActionLoading(true);
      await onDeleteTable(tableId);
      toast.success('Table deleted successfully');
    } catch (error) {
      console.error("Delete failed", error);
      toast.error('Failed to delete table');
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleGroupSelection = (tableNumber: number) => {
    if (selectedForGroup.includes(tableNumber)) {
      setSelectedForGroup(selectedForGroup.filter(n => n !== tableNumber));
      if (primaryTableForGroup === tableNumber) setPrimaryTableForGroup(null);
    } else {
      const table = tables.find(t => t.number === tableNumber);
      if (table?.status === 'free' && !table.groupId) {
        setSelectedForGroup([...selectedForGroup, tableNumber]);
      }
    }
  };

  const handleCreateGroup = async () => {
    if (selectedForGroup.length < 2 || !primaryTableForGroup) return;
    try {
      setIsActionLoading(true);
      await api.post('/tables/group', {
        tableNumbers: selectedForGroup,
        primaryTableNumber: primaryTableForGroup
      });
      setIsGroupMode(false);
      setSelectedForGroup([]);
      setPrimaryTableForGroup(null);
      setShowGroupConfirm(false);
      toast.success('Tables grouped successfully');
      // Wait for table refresh (managed by parent)
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to group tables');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUngroup = async (groupId: string) => {
    try {
      setIsActionLoading(true);
      await api.post(`/tables/ungroup/${groupId}`);
      toast.success('Tables ungrouped successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to ungroup tables');
    } finally {
      setIsActionLoading(false);
    }
  };

  const groupedTablesMap = tables.reduce((acc, t) => {
    if (t.groupId) {
      if (!acc[t.groupId]) acc[t.groupId] = [];
      acc[t.groupId].push(t.number);
    }
    return acc;
  }, {} as Record<string, number[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2 font-bold text-2xl">Table Management</h1>
          <p className="text-muted-foreground">Manage restaurant tables and their status</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Plus className="w-4 h-4 mr-2" />
                Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Bulk Add Tables</DialogTitle>
                <DialogDescription className="text-muted-foreground">Create multiple tables in sequence</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Starting Number</Label>
                    <Input
                      type="number"
                      value={bulkData.startNumber}
                      onChange={(e) => setBulkData({ ...bulkData, startNumber: Number(e.target.value) })}
                      className="mt-2 bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Quantity</Label>
                    <Input
                      type="number"
                      value={bulkData.quantity}
                      onChange={(e) => setBulkData({ ...bulkData, quantity: Number(e.target.value) })}
                      className="mt-2 bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">Capacity (Seats per Table)</Label>
                  <Input
                    type="number"
                    value={bulkData.capacity}
                    onChange={(e) => setBulkData({ ...bulkData, capacity: Number(e.target.value) })}
                    className="mt-2 bg-background border-border text-foreground"
                  />
                </div>
                <Button onClick={handleBulkAdd} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Create {bulkData.quantity} Tables
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant={isGroupMode ? "destructive" : "outline"}
            onClick={() => {
              setIsGroupMode(!isGroupMode);
              setSelectedForGroup([]);
              setPrimaryTableForGroup(null);
            }}
            className={!isGroupMode ? "border-primary text-primary hover:bg-primary/10" : ""}
          >
            {isGroupMode ? "Cancel Grouping" : "Group Tables"}
          </Button>

          {isGroupMode && selectedForGroup.length >= 2 && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setShowGroupConfirm(true)}
            >
              <Link className="w-4 h-4 mr-2" />
              Confirm Group ({selectedForGroup.length})
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Tables</div>
          <div className="text-foreground font-bold text-2xl">{tables.length}</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Free</div>
          <div className="text-green-600 dark:text-green-400 font-bold text-2xl">{tables.filter(t => t.status === 'free').length}</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Occupied</div>
          <div className="text-red-600 dark:text-red-400 font-bold text-2xl">{tables.filter(t => t.status === 'occupied').length}</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Reserved</div>
          <div className="text-orange-600 dark:text-orange-400 font-bold text-2xl">{tables.filter(t => t.status === 'reserved').length}</div>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...tables].sort((a, b) => {
          const aHasRes = a.status === 'reserved' || !!a.reservedBy;
          const bHasRes = b.status === 'reserved' || !!b.reservedBy;
          if (aHasRes && !bHasRes) return -1;
          if (!aHasRes && bHasRes) return 1;
          return a.number - b.number;
        }).map((table) => {
          let statusColorClass = '';
          switch (table.status) {
            case 'free': statusColorClass = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'; break;
            case 'occupied': statusColorClass = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'; break;
            case 'reserved': statusColorClass = 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'; break;
            default: statusColorClass = 'bg-muted text-muted-foreground border-border';
          }

          return (
            <Card
              key={table.id}
              className={`p-2 bg-card border-border hover:shadow-md transition-shadow relative overflow-hidden ${isGroupMode && table.status === 'free' && !table.groupId ? 'cursor-pointer ring-2 ring-primary/20' : ''
                } ${selectedForGroup.includes(table.number) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
              onClick={() => isGroupMode && toggleGroupSelection(table.number)}
            >
              {table.groupId && (
                <div className="absolute top-0 right-0 p-1">
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] px-1 h-4 flex items-center gap-0.5">
                    <Link className="w-2 h-2" />
                    GRP
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-foreground font-bold text-sm flex items-center gap-1">
                    Table {table.number}
                    {table.isPrimary && <Crown className="w-3 h-3 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity}</span>
                  </div>
                </div>
                <div className="flex gap-0 scale-90 origin-right">
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditingTable(table); }}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit className="w-3 h-3 pointer-events-none" />
                  </button>
                  {table.groupId && (
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleUngroup(table.groupId!); }}
                      className="p-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      disabled={isActionLoading}
                      title="Ungroup Tables"
                    >
                      <Unlink className="w-3 h-3 pointer-events-none" />
                    </button>
                  )}
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(table.id); }}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    disabled={isActionLoading}
                  >
                    <Trash2 className="w-3 h-3 pointer-events-none" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Select value={table.status} onValueChange={(value: string) => handleStatusChange(table.id, value)}>
                  <SelectTrigger className="bg-background border-border text-foreground h-6 text-[10px] min-h-0 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="free" className="text-foreground focus:bg-muted focus:text-foreground text-[10px]">Free</SelectItem>
                    <SelectItem value="occupied" className="text-foreground focus:bg-muted focus:text-foreground text-[10px]">Occupied</SelectItem>
                    <SelectItem value="reserved" className="text-foreground focus:bg-muted focus:text-foreground text-[10px]">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={`mt-1 px-1 py-0.5 rounded text-[9px] uppercase font-bold border text-center ${statusColorClass} h-5 flex items-center justify-center`}>
                {table.status}
              </div>

              {
                table.status === 'reserved' && (
                  <div className="mt-1 pt-1 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="text-[9px] text-muted-foreground leading-none">Rsrv:</div>
                        <div className="text-[10px] text-foreground font-medium truncate max-w-[60px] leading-tight">{table.reservedBy || 'Guest'}</div>
                      </div>
                      <div className="flex gap-1 scale-90 origin-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 text-[9px] px-1 border-green-500/20 text-green-600 hover:bg-green-500/10 min-h-0"
                          onClick={(e: React.MouseEvent) => handleCheckIn(e, table.number)}
                          disabled={isActionLoading}
                        >
                          <CheckCircle className="w-2.5 h-2.5 mr-0.5 pointer-events-none" />
                          In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 text-[9px] px-1 border-red-500/20 text-red-600 hover:bg-red-500/10 min-h-0"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCancelBooking(table.number); }}
                          disabled={isActionLoading}
                        >
                          <Trash2 className="w-2.5 h-2.5 mr-0.5 pointer-events-none" />
                          X
                        </Button>
                      </div>
                    </div>
                    {table.reservedTime && (
                      <div className="text-[9px] text-muted-foreground/80 mt-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(table.reservedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )
              }

              {
                table.status === 'free' && table.reservedBy && (
                  <div className="mt-1 p-1 bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-100 dark:border-orange-500/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-[8px] uppercase font-bold text-orange-600 dark:text-orange-400 leading-none">Next</div>
                        <div className="text-[10px] font-medium text-foreground truncate max-w-[80px] leading-tight">{table.reservedBy}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-0"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCancelBooking(table.number); }}
                        disabled={isActionLoading}
                        title="Cancel Booking"
                      >
                        <Trash2 className="w-2.5 h-2.5 pointer-events-none" />
                      </Button>
                    </div>
                  </div>
                )
              }

              {
                table.status === 'free' && !table.reservedBy && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1.5 border-primary/20 text-primary hover:bg-primary/5 h-6 text-[10px] font-semibold min-h-0"
                    onClick={() => {
                      setSelectedTableForRes(table);
                      setShowReservationDialog(true);
                    }}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Reserve
                  </Button>
                )
              }

              {
                table.status === 'free' && table.reservedBy && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1 border-primary/20 text-primary hover:bg-primary/5 h-5 text-[9px] min-h-0"
                    onClick={() => {
                      setSelectedTableForRes(table);
                      setShowReservationDialog(true);
                    }}
                  >
                    Change
                  </Button>
                )
              }

              {
                table.groupId && (
                  <div className="mt-1 text-[9px] text-blue-600 font-medium truncate">
                    Linked: {groupedTablesMap[table.groupId]?.filter(n => n !== table.number).join(', ')}
                  </div>
                )
              }
            </Card>
          );
        })}
      </div >

      {/* Edit Dialog */}
      < Dialog open={!!editingTable} onOpenChange={(open: boolean) => !open && setEditingTable(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Table</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update table details</DialogDescription>
          </DialogHeader>
          {editingTable && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Table Number</Label>
                <Input
                  type="number"
                  value={editingTable.number}
                  onChange={(e) => setEditingTable({ ...editingTable, number: Number(e.target.value) })}
                  className="mt-2 bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground">Capacity (Seats)</Label>
                <Input
                  type="number"
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: Number(e.target.value) })}
                  className="mt-2 bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground">Status</Label>
                <Select
                  value={editingTable.status}
                  onValueChange={(value: string) => setEditingTable({ ...editingTable, status: value as any })}
                >
                  <SelectTrigger className="mt-2 bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="free" className="text-foreground focus:bg-muted focus:text-foreground">Free</SelectItem>
                    <SelectItem value="occupied" className="text-foreground focus:bg-muted focus:text-foreground">Occupied</SelectItem>
                    <SelectItem value="reserved" className="text-foreground focus:bg-muted focus:text-foreground">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateTable} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Update Table
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog >
      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold">New Reservation</DialogTitle>
            <DialogDescription className="text-muted-foreground">Create a booking for Table {selectedTableForRes?.number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-foreground">Customer Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newReservation.customerName}
                  onChange={(e) => setNewReservation({ ...newReservation, customerName: e.target.value })}
                  placeholder="Guest Name"
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Phone Number (Optional)</Label>
              <Input
                value={newReservation.customerPhone}
                onChange={(e) => setNewReservation({ ...newReservation, customerPhone: e.target.value })}
                placeholder="Guest Phone"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={newReservation.date}
                    onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={newReservation.startTime}
                    onChange={(e) => setNewReservation({ ...newReservation, startTime: e.target.value })}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={newReservation.endTime}
                    onChange={(e) => setNewReservation({ ...newReservation, endTime: e.target.value })}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleCreateReservation}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              disabled={loadingRes || !newReservation.customerName}
            >
              {loadingRes ? 'Creating...' : 'Confirm Reservation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Tables Confirmation Dialog */}
      <Dialog open={showGroupConfirm} onOpenChange={setShowGroupConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold">Group Tables</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select which table should be the **Primary Table**. Orders will only be allowed from this table.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {selectedForGroup.sort((a, b) => a - b).map(num => (
                <Button
                  key={num}
                  variant={primaryTableForGroup === num ? "default" : "outline"}
                  onClick={() => setPrimaryTableForGroup(num)}
                  className="h-12 text-lg font-bold"
                >
                  {num}
                </Button>
              ))}
            </div>
            {primaryTableForGroup && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-sm text-blue-600 dark:text-blue-400">
                Table **{primaryTableForGroup}** will be the primary table for this group.
              </div>
            )}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!primaryTableForGroup || isActionLoading}
              onClick={handleCreateGroup}
            >
              {isActionLoading ? "Grouping..." : "Confirm Grouping"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
