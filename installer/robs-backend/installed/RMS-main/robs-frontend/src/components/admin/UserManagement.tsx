import { useState } from 'react';
import { User, UserRole } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../ui/confirm-dialog-provider';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { usersAPI } from '../../services/api';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'> & { password: string }) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User | null;
  fetchUsers: () => void;
}

export function UserManagement({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser, fetchUsers }: UserManagementProps) {
  const { confirm } = useConfirm();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter' as UserRole,
    active: true,
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true :
        statusFilter === 'active' ? user.active :
          !user.active;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100/10 text-purple-700 dark:text-purple-400 border-purple-200/20';
      case 'waiter':
        return 'bg-blue-100/10 text-blue-700 dark:text-blue-400 border-blue-200/20';
      case 'kitchen':
        return 'bg-green-100/10 text-green-700 dark:text-green-400 border-green-200/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleAddUser = () => {
    onAddUser(newUser);
    setNewUser({ name: '', email: '', password: '', role: 'waiter', active: true });
    setShowAddDialog(false);
  };

  const handleUpdateUser = async () => {
    if (editingUser) {
      const { name, email, role, active } = editingUser;

      // Prevent admin from deactivating themselves
      if (currentUser && editingUser.id === currentUser.id) {
        if (active === false) {
          toast.error('You cannot deactivate your own account. Please ask another admin to manage your account status.');
          return;
        }
        if (role !== 'admin') {
          toast.error('You cannot change your own role to non-admin. Please ask another admin to manage your role if necessary.');
          return;
        }
      }

      // Admin safety check for role change or deactivation
      const originalUser = users.find((u: User) => u.id === editingUser.id);
      if (originalUser && originalUser.role === 'admin' && originalUser.active) {
        const willNoLongerBeAdmin = role !== 'admin' || !active;
        if (willNoLongerBeAdmin) {
          const adminCount = users.filter((u: User) => u.role === 'admin' && u.active).length;
          // If this user is one of the admins (checked by id), and count is 1, they are the last one.
          // Or simpler: count active admins. If this user IS an admin and we change them to non-admin, we reduce count by 1.
          if (adminCount <= 1) {
            toast.error('You cannot change this account to non-admin or deactivate it because it is the last active admin. Please assign another admin first.');
            return;
          }
        }
      }

      onUpdateUser(editingUser.id, { name, email, role, active });
      setEditingUser(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      toast.error('You cannot delete your own account while logged in. Please ask another admin to delete your account if necessary.');
      return;
    }

    // Check if this is the last admin
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.active).length;
      if (adminCount <= 1) {
        toast.error('You cannot delete this account because it is the last active admin. Please assign another admin first.');
        return;
      }
    }

    if (!await confirm({ title: "Delete User", description: `Are you sure you want to delete user ${user.name}? This action cannot be undone.` })) return;

    onDeleteUser(user.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage staff accounts and permissions</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new staff account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@restaurant.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value as UserRole })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={newUser.active}
                  onCheckedChange={(checked: boolean) => setNewUser({ ...newUser, active: checked })}
                />
              </div>
              <Button onClick={handleAddUser} className="w-full bg-orange-500 hover:bg-orange-600">
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-input"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="inactive">Inactive Users</SelectItem>
                <SelectItem value="all">All Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Users</div>
          <div className="text-foreground">{users.length}</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-green-600 dark:text-green-400">{users.filter((u: User) => u.active).length}</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Waiters</div>
          <div className="text-blue-600 dark:text-blue-400">{users.filter((u: User) => u.role === 'waiter').length}</div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground mb-1">Admins</div>
          <div className="text-purple-600 dark:text-purple-400">{users.filter((u: User) => u.role === 'admin').length}</div>
        </Card>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-foreground">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="p-1.5 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              <Badge className={user.active ? 'bg-green-100/10 text-green-700 dark:text-green-400 border-green-200/20' : 'bg-muted text-muted-foreground border-border'}>
                {user.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and permissions</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editingUser.role} onValueChange={(value: string) => setEditingUser(prev => prev ? { ...prev, role: value as UserRole } : null)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editingUser.active}
                  onCheckedChange={(checked: boolean) => setEditingUser(prev => prev ? { ...prev, active: checked } : null)}
                />
              </div>
              <Button onClick={handleUpdateUser} className="w-full bg-orange-500 hover:bg-orange-600">
                Update User
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
