import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private currentToken: string | null = null;
  private socketUrl = import.meta.env.VITE_SOCKET_URL || '/';

  connect(token: string) {
    if (!token) {
      console.warn('No auth token provided for socket connection');
      return null;
    }

    // If already connected with the same token, don't reconnect
    if (this.socket?.connected && this.currentToken === token) {
      return this.socket;
    }

    // If token changed or socket disconnected, create new connection
    if (this.socket) {

      this.socket.disconnect();
    }

    this.currentToken = token;
    this.socket = io(this.socketUrl, {
      auth: (cb) => {
        cb({
          token: localStorage.getItem('authToken') || this.currentToken
        });
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {

      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {

    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      if (error.message === 'Authentication error: Token expired' || error.message === 'Authentication error: Invalid token') {
        console.warn('Socket authentication failed. Disconnecting...');
        this.disconnect();
        // Optionally redirect to login or trigger a token refresh here
        // For now, we stop retrying to prevent log spam
        return;
      }
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {

    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {

        this.socket?.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join role-based rooms
  joinRole(role: string) {
    if (this.socket) {
      this.socket.emit('join-role', role);
    }
  }

  // Join table-specific room
  joinTable(tableNumber: number) {
    if (this.socket) {
      this.socket.emit('join-table', tableNumber);
    }
  }

  // Join user-specific room
  joinUser(userId: string) {
    if (this.socket) {
      this.socket.emit('join-user', userId);
    }
  }

  // Order events
  onOrderCreated(callback: (order: any) => void) {
    if (this.socket) {
      this.socket.on('order:created', callback);
    }
  }

  onOrderUpdated(callback: (order: any) => void) {
    if (this.socket) {
      this.socket.on('order:updated', callback);
    }
  }

  onOrderStatusChanged(callback: (data: { orderId: string; status: string }) => void) {
    if (this.socket) {
      this.socket.on('order:status-changed', callback);
    }
  }

  // Table events
  onTableStatusChanged(callback: (data: { tableNumber: number; status: string }) => void) {
    if (this.socket) {
      this.socket.on('table:status-changed', callback);
    }
  }

  // Notification events
  onNewNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('notification:new', callback);
    }
  }

  // Kitchen events
  onItemReady(callback: (data: { orderId: string; itemId: string }) => void) {
    if (this.socket) {
      this.socket.on('kitchen:item-ready', callback);
    }
  }

  // Emit events
  emitOrderStatusUpdate(orderId: string, status: string) {
    if (this.socket) {
      this.socket.emit('order-status-update', { orderId, status });
    }
  }

  emitTableStatusUpdate(tableNumber: number, status: string) {
    if (this.socket) {
      this.socket.emit('table-status-update', { tableNumber, status });
    }
  }

  // Remove event listeners
  removeListener(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;
