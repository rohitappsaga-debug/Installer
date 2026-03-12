import { useState, useEffect } from 'react';
import { Settings } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Save, Printer, Percent, DollarSign, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPanelProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
}

import { settingsAPI } from '../../services/api';
import { Moon } from 'lucide-react';

export function SettingsPanel({ settings: initialSettings, onSaveSettings }: SettingsPanelProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const isDark = darkMode;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [darkMode]);

  // Sync state with props when backend data arrives
  useEffect(() => {
    setSettings({
      ...initialSettings,
      discountPresets: Array.isArray(initialSettings.discountPresets)
        ? initialSettings.discountPresets
        : []
    });
  }, [initialSettings]);

  // System Info State
  const [systemInfo, setSystemInfo] = useState<{
    version: string;
    lastBackup: string;
    databaseStatus: string;
  } | null>(null);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const response = await settingsAPI.getSystemInfo();
      if (response.success) {
        setSystemInfo(response.data);
      }
    } catch (e) {
      console.error('Failed to load system info', e);
    }
  };

  const handleSave = () => {
    // Sanitize settings to remove id, createdAt, updatedAt etc.
    const payload: Partial<Settings> = {
      taxRate: Number(settings.taxRate),
      taxEnabled: Boolean(settings.taxEnabled),
      currency: settings.currency,
      restaurantName: settings.restaurantName,
      discountPresets: Array.isArray(settings.discountPresets)
        ? settings.discountPresets.map(Number)
        : [],
      printerConfig: {
        enabled: Boolean(settings.printerConfig?.enabled),
        printerName: settings.printerConfig?.printerName || '',
      },
      businessHours: settings.businessHours || { open: '09:00', close: '22:00' },
      enabledPaymentMethods: settings.enabledPaymentMethods || ['cash', 'card', 'upi'],
      receiptFooter: settings.receiptFooter || 'Thank you for your business!',
      restaurantAddress: settings.restaurantAddress || '',
      gstNo: settings.gstNo || '',
      notificationPreferences: settings.notificationPreferences || {
        orderNotifications: false,
        paymentNotifications: false,
        lowStockAlerts: false
      }
    };


    onSaveSettings(payload as Settings);
  };


  const addDiscountPreset = () => {
    const currentPresets = Array.isArray(settings.discountPresets) ? settings.discountPresets : [];

    if (newDiscount <= 0) {
      toast.error('Please enter a valid discount percentage');
      return;
    }

    if (newDiscount > 100) {
      toast.error('Discount cannot exceed 100%');
      return;
    }

    if (currentPresets.includes(newDiscount)) {
      toast.error('This discount preset already exists');
      return;
    }

    setSettings({
      ...settings,
      discountPresets: [...currentPresets, newDiscount].sort((a, b) => a - b),
    });
    setNewDiscount(0);
    toast.info(`Added ${newDiscount}% discount preset. Don't forget to save!`);
  };

  const removeDiscountPreset = (discount: number) => {
    const updated = (settings.discountPresets || []).filter(d => d !== discount);
    setSettings({
      ...settings,
      discountPresets: updated,
    });
    toast.info(`Removed ${discount}% preset. Remember to save settings.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 mb-2 dark:text-zinc-50">Settings</h1>
        <p className="text-gray-600 dark:text-zinc-400">Configure system preferences and defaults</p>
      </div>

      {/* Display Settings - New Card */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2 dark:text-zinc-50">
          <Moon className="w-5 h-5 text-orange-500" />
          Display Settings
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <Label className="dark:text-zinc-200">
              Dark Mode <span className={darkMode ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
                ({darkMode ? 'On' : 'Off'})
              </span>
            </Label>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Toggle application-wide dark theme
            </p>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>
      </Card>

      {/* Restaurant Information */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 dark:text-zinc-50">Restaurant Information</h3>
        <div className="space-y-4">
          <div>
            <Label className="dark:text-zinc-200">Restaurant Name</Label>
            <Input
              value={settings.restaurantName}
              onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Restaurant Address</Label>
            <Input
              value={settings.restaurantAddress || ''}
              onChange={(e) => setSettings({ ...settings, restaurantAddress: e.target.value })}
              className="mt-2"
              placeholder="Full address for bill header"
            />
          </div>
          <div>
            <Label>GST Number</Label>
            <Input
              value={settings.gstNo || ''}
              onChange={(e) => setSettings({ ...settings, gstNo: e.target.value })}
              className="mt-2"
              placeholder="e.g. 29ABCDE1234F1Z5"
            />
          </div>
          <div>
            <Label>Currency Symbol</Label>
            <Input
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Tax Configuration */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2 dark:text-zinc-50">
          <Percent className="w-5 h-5 text-orange-500" />
          Tax Configuration
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="dark:text-zinc-200">Enable Tax Calculation</Label>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                Toggle whether tax (GST) should be applied to orders
              </p>
            </div>
            <Switch
              checked={settings.taxEnabled}
              onCheckedChange={(checked: boolean) =>
                setSettings({ ...settings, taxEnabled: checked })
              }
            />
          </div>
          {settings.taxEnabled && (
            <div>
              <Label className="dark:text-zinc-200">Tax Rate (%)</Label>
              <Input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className="mt-2"
                step="0.1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Applied to all orders. Current rate: {settings.taxRate}%
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Discount Presets */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2 dark:text-zinc-50">
          <DollarSign className="w-5 h-5 text-orange-500" />
          Discount Presets
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="dark:text-zinc-200">Quick Discount Options</Label>
            <p className="text-sm text-gray-500 mb-3 dark:text-zinc-500">
              Add percentage discounts that staff can quickly apply to orders
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {(settings.discountPresets || []).map((discount) => (
                <Badge
                  key={discount}
                  className="bg-orange-100 text-orange-700 border-orange-200 pr-1 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
                >
                  {discount}%
                  <button
                    onClick={() => removeDiscountPreset(discount)}
                    className="ml-2 hover:bg-orange-200 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={newDiscount || ''}
                onChange={(e) => setNewDiscount(Number(e.target.value))}
                placeholder="Enter discount %"
                className="flex-1 dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-100"
              />
              <Button
                type="button"
                onClick={addDiscountPreset}
                variant="outline"
                className="whitespace-nowrap dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Preset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Printer Configuration */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2 dark:text-zinc-50">
          <Printer className="w-5 h-5 text-orange-500" />
          Printer Configuration
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="dark:text-zinc-200">Enable Printing</Label>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                Allow printing bills and kitchen orders
              </p>
            </div>
            <Switch
              checked={settings.printerConfig.enabled}
              onCheckedChange={(checked: boolean) =>
                setSettings({
                  ...settings,
                  printerConfig: { ...settings.printerConfig, enabled: checked },
                })
              }
            />
          </div>
          {settings.printerConfig.enabled && (
            <div>
              <Label className="dark:text-zinc-200">Printer Name</Label>
              <Input
                value={settings.printerConfig.printerName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    printerConfig: { ...settings.printerConfig, printerName: e.target.value },
                  })
                }
                className="mt-2"
                placeholder="e.g., Kitchen Printer 1"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Business Hours */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 dark:text-zinc-50">Business Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="dark:text-zinc-200">Opening Time</Label>
            <Input
              type="time"
              value={settings.businessHours?.open || '09:00'}
              onChange={(e) => setSettings({
                ...settings,
                businessHours: { ...settings.businessHours || { open: '09:00', close: '22:00' }, open: e.target.value }
              })}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="dark:text-zinc-200">Closing Time</Label>
            <Input
              type="time"
              value={settings.businessHours?.close || '22:00'}
              onChange={(e) => setSettings({
                ...settings,
                businessHours: { ...settings.businessHours || { open: '09:00', close: '22:00' }, close: e.target.value }
              })}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 dark:text-zinc-50">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="dark:text-zinc-200">Order Notifications</Label>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Notify when new orders are placed</p>
            </div>
            <Switch
              checked={settings.notificationPreferences?.orderNotifications || false}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                notificationPreferences: {
                  ...settings.notificationPreferences || { orderNotifications: false, paymentNotifications: false, lowStockAlerts: false },
                  orderNotifications: checked
                }
              })}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="dark:text-zinc-200">Payment Notifications</Label>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Notify when payments are received</p>
            </div>
            <Switch
              checked={settings.notificationPreferences?.paymentNotifications || false}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                notificationPreferences: {
                  ...settings.notificationPreferences || { orderNotifications: false, paymentNotifications: false, lowStockAlerts: false },
                  paymentNotifications: checked
                }
              })}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="dark:text-zinc-200">Low Stock Alerts</Label>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Alert when items are running low</p>
            </div>
            <Switch
              checked={settings.notificationPreferences?.lowStockAlerts || false}
              onCheckedChange={(checked: boolean) => setSettings({
                ...settings,
                notificationPreferences: {
                  ...settings.notificationPreferences || { orderNotifications: false, paymentNotifications: false, lowStockAlerts: false },
                  lowStockAlerts: checked
                }
              })}
            />
          </div>
        </div>
      </Card>

      {/* Payment & Receipt Configuration */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4 dark:text-zinc-50">Payment & Receipt</h3>
        <div className="space-y-6">
          <div>
            <Label className="mb-2 block dark:text-zinc-200">Enabled Payment Methods</Label>
            <div className="flex gap-4">
              {['cash', 'card', 'upi'].map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <Switch
                    checked={settings.enabledPaymentMethods?.includes(method)}
                    onCheckedChange={(checked: boolean) => {
                      const current = settings.enabledPaymentMethods || [];
                      const updated = checked
                        ? [...current, method]
                        : current.filter((m) => m !== method);
                      setSettings({ ...settings, enabledPaymentMethods: updated });
                    }}
                  />
                  <span className="capitalize dark:text-zinc-200">{method.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="dark:text-zinc-200">Receipt Footer Message</Label>
            <Input
              value={settings.receiptFooter || ''}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              className="mt-2 dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-100"
              placeholder="e.g. Thank you! No Refunds."
            />
          </div>
        </div>
      </Card>

      {/* System Information */}
      <Card className="p-6 bg-gray-50 dark:bg-zinc-900 dark:border-zinc-800">
        <h3 className="text-gray-900 mb-4 dark:text-zinc-50">System Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-zinc-400">System Version</span>
            <span className="text-gray-900 dark:text-zinc-100">{systemInfo?.version || 'Loading...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-zinc-400">Last Backup</span>
            <span className="text-gray-900 dark:text-zinc-100">{systemInfo?.lastBackup || 'Checking...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-zinc-400">Database Status</span>
            <Badge className={`border ${systemInfo?.databaseStatus === 'Healthy' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'}`}>
              {systemInfo?.databaseStatus || 'Checking...'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
