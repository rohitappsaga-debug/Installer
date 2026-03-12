import { Notification } from '../../types';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bell, ShoppingCart, CreditCard, AlertTriangle, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '../ui/button';

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onBack: () => void;
}

export function NotificationsPanel({ notifications, onMarkAsRead, onDelete, onClearAll, onBack }: NotificationsPanelProps) {
  const getIcon = (type: string) => {
    // ... same logic ...
    switch (type) {
      case 'order': return <ShoppingCart className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    // ... same logic ...
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';
      case 'payment': return 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300';
      case 'alert': return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (timestamp: string) => {
    // ... same logic ...
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="text-primary-foreground/90 flex items-center gap-1">← Back</button>
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 px-2 py-1 rounded text-primary-foreground transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-primary-foreground text-primary border-none">{unreadCount} new</Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 pb-20">
        {notifications.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-muted-foreground text-sm mt-1">No notifications to display.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="relative group">
              <Card
                className={`p-4 transition-all bg-card border-border hover:border-primary/50 shadow-sm ${!notification.read ? 'bg-primary/5 border-primary/20 dark:bg-primary/10' : ''
                  }`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => !notification.read && onMarkAsRead(notification.id)}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1 items-end justify-center pl-2 border-l border-border/50 ml-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
