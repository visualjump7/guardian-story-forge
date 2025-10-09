import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCog, Ban, CheckCircle, KeyRound, Trash2, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  suspended_at: string | null;
  last_login: string | null;
  role?: 'admin' | 'moderator' | 'user';
  email?: string;
  story_count?: number;
  author_name?: string;
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    
    // Get all auth users to access emails
    const { data: authData } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Failed to load users');
      setLoading(false);
      return;
    }

    // Load roles and story counts for each user
    const profilesWithRoles = await Promise.all(
      (profilesData || []).map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .single();

        // Get story count
        const { count: storyCount } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', profile.id);

        // Get email from auth users
        const authUser = users.find(u => u.id === profile.id);

        return {
          ...profile,
          role: roleData?.role || 'user',
          story_count: storyCount || 0,
          email: authUser?.email || '',
        };
      })
    );

    setProfiles(profilesWithRoles);
    setLoading(false);
  };

  const handleSuspendUser = async (userId: string, suspended: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ suspended_at: suspended ? new Date().toISOString() : null })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update user status');
    } else {
      toast.success(suspended ? 'User suspended' : 'User activated');
      loadProfiles();
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    // Delete existing role
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Insert new role if not 'user'
    if (newRole !== 'user') {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) {
        toast.error('Failed to update user role');
        return;
      }
    }

    toast.success('User role updated');
    loadProfiles();
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { 
          userId: selectedUser.id,
          email: selectedUser.email 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Password reset email sent to user');
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: selectedUser.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleBulkSuspend = async (suspend: boolean) => {
    if (selectedUsers.length === 0) return;
    
    const promises = selectedUsers.map(userId =>
      supabase.from('profiles').update({ suspended_at: suspend ? new Date().toISOString() : null }).eq('id', userId)
    );
    
    await Promise.all(promises);
    toast.success(`${selectedUsers.length} users ${suspend ? 'suspended' : 'activated'}`);
    setSelectedUsers([]);
    loadProfiles();
  };

  const handleBulkRoleChange = async (newRole: 'admin' | 'moderator' | 'user') => {
    if (selectedUsers.length === 0) return;
    
    for (const userId of selectedUsers) {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      if (newRole !== 'user') {
        await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      }
    }
    
    toast.success(`${selectedUsers.length} users updated to ${newRole}`);
    setSelectedUsers([]);
    loadProfiles();
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredProfiles.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredProfiles.map(p => p.id));
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !profile.suspended_at) ||
                         (statusFilter === 'suspended' && profile.suspended_at);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span>All Users ({filteredProfiles.length})</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Role:</label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Status:</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(roleFilter !== 'all' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRoleFilter('all');
                        setStatusFilter('all');
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm font-medium">{selectedUsers.length} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkSuspend(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkSuspend(false)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate Selected
                  </Button>
                  <Select onValueChange={(value) => handleBulkRoleChange(value as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Set as User</SelectItem>
                      <SelectItem value="moderator">Set as Moderator</SelectItem>
                      <SelectItem value="admin">Set as Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUsers([])}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Selection
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading users...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredProfiles.length && filteredProfiles.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Stories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow 
                      key={profile.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button, input, [role="combobox"]')) return;
                        setSelectedUser(profile);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUsers.includes(profile.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, profile.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== profile.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{profile.display_name}</TableCell>
                      <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                      <TableCell>
                        <Select
                          value={profile.role}
                          onValueChange={(value) =>
                            handleUpdateRole(profile.id, value as 'admin' | 'moderator' | 'user')
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{profile.story_count}</Badge>
                      </TableCell>
                      <TableCell>
                        {profile.suspended_at ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSuspendUser(profile.id, !profile.suspended_at)
                            }
                          >
                            {profile.suspended_at ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            ) : (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(profile);
                              setResetPasswordDialogOpen(true);
                            }}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(profile);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{selectedUser.display_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge variant="outline" className="mt-1">{selectedUser.role}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {selectedUser.suspended_at ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stories Created</label>
                  <p className="text-lg font-semibold">{selectedUser.story_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                {selectedUser.last_login && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-lg">{new Date(selectedUser.last_login).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedUser.author_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Author Name</label>
                    <p className="text-lg">{selectedUser.author_name}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    setResetPasswordDialogOpen(true);
                  }}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSuspendUser(selectedUser.id, !selectedUser.suspended_at)}
                >
                  {selectedUser.suspended_at ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate User
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend User
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to <strong>{selectedUser?.email}</strong>. 
              The user will receive a link to set a new password. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>Send Reset Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{selectedUser?.display_name}</strong>? 
              This action cannot be undone and will remove all their data including stories and library items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
