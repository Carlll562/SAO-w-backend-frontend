import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Shield, Save, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth, UserPermissions, ADMIN_PERMISSIONS, USER_PERMISSIONS, addAuditLog } from "../context/AuthContext";

// --- Types ---
interface PermissionTemplate {
  id: string;
  name: string;
  permissions: UserPermissions;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  password?: string; // Only used during creation/update
  role: "Admin" | "User";
  permissions: UserPermissions;
}

const DEFAULT_TEMPLATE: PermissionTemplate = {
  id: "default-admin",
  name: "Full Admin",
  permissions: ADMIN_PERMISSIONS,
};

const READ_ONLY_TEMPLATE: PermissionTemplate = {
  id: "read-only",
  name: "Read Only",
  permissions: {
    canCreateAccounts: false,
    canManageStudents: false,
    canViewDashboard: true,
    canViewStudents: true,
    canViewAuditLogs: true,
    canViewRecycleBin: false,
  },
};

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canCreateAccounts: "Create & Manage Accounts",
  canManageStudents: "Manage Students (Create/Edit/Delete)",
  canViewDashboard: "View Dashboard",
  canViewStudents: "View Students List",
  canViewAuditLogs: "View Audit Logs",
  canViewRecycleBin: "View & Restore Recycle Bin",
};

export function UserManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "templates">("users");
  
  // Data
  const [users, setUsers] = useState<UserData[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);

  // Dialog States
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  
  // Form States
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    selectedTemplateId: "custom",
    permissions: USER_PERMISSIONS,
  });

  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    permissions: USER_PERMISSIONS,
  });

  // --- Load Data ---
  useEffect(() => {
    loadUsers();
    loadTemplates();
  }, []);

  const loadUsers = () => {
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      const parsed = JSON.parse(storedUsers);
      // Ensure permissions are populated for display
      const standardized = parsed.map((u: any) => ({
        ...u,
        permissions: u.permissions || (u.role === "Admin" ? ADMIN_PERMISSIONS : USER_PERMISSIONS),
      }));
      setUsers(standardized);
    } else {
      const defaultUser = [{
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123", // Needs to match AuthContext DEFAULT_ADMIN
        role: "Admin" as const,
        permissions: ADMIN_PERMISSIONS,
      }];
      setUsers(defaultUser);
      localStorage.setItem("users", JSON.stringify(defaultUser));
    }
  };

  const loadTemplates = () => {
    const storedTemplates = localStorage.getItem("permissionTemplates");
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
      // Initialize with defaults if empty
      const defaults = [DEFAULT_TEMPLATE, READ_ONLY_TEMPLATE];
      setTemplates(defaults);
      localStorage.setItem("permissionTemplates", JSON.stringify(defaults));
    }
  };

  // --- User Actions ---
  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email || (!editingUser && !userForm.password)) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newUser: UserData = {
      id: editingUser ? editingUser.id : Date.now(),
      name: userForm.name,
      email: userForm.email,
      role: userForm.permissions.canCreateAccounts ? "Admin" : "User", // Auto-derive role for display
      permissions: userForm.permissions,
      ...(userForm.password ? { password: userForm.password } : (editingUser ? { password: (editingUser as any).password } : {})),
    };

    let updatedUsers;
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...newUser } : u);
      toast.success("User updated successfully");
      addAuditLog({
        action: "Update User",
        user: user?.email || "System",
        status: "Success",
        details: `Updated account for ${newUser.name} (${newUser.email})`,
        category: "Auth"
      });
    } else {
      if (users.some(u => u.email === newUser.email)) {
        toast.error("Email already exists");
        return;
      }
      updatedUsers = [...users, newUser];
      toast.success("User created successfully");
      addAuditLog({
        action: "Create User",
        user: user?.email || "System",
        status: "Success",
        details: `Created new account for ${newUser.name} (${newUser.email})`,
        category: "Auth"
      });
    }

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setIsUserDialogOpen(false);
  };

  const handleDeleteUser = (id: number) => {
    if (id === 1) { // Prevent deleting default admin
      toast.error("Cannot delete the default admin account");
      return;
    }
    const userToDelete = users.find(u => u.id === id);
    if (confirm("Are you sure you want to delete this user?")) {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      toast.success("User deleted");
      addAuditLog({
        action: "Delete User",
        user: user?.email || "System",
        status: "Success",
        details: `Deleted user account: ${userToDelete?.name || id}`,
        category: "Auth"
      });
    }
  };

  // --- Template Actions ---
  const handleSaveTemplate = () => {
    if (!templateForm.name) {
      toast.error("Template name is required");
      return;
    }

    const newTemplate: PermissionTemplate = {
      id: editingTemplate ? editingTemplate.id : Date.now().toString(),
      name: templateForm.name,
      permissions: templateForm.permissions,
    };

    let updatedTemplates;
    if (editingTemplate) {
      updatedTemplates = templates.map(t => t.id === editingTemplate.id ? newTemplate : t);
      toast.success("Template updated");
      addAuditLog({
        action: "Update Template",
        user: user?.email || "System",
        status: "Success",
        details: `Updated permission template: ${newTemplate.name}`,
        category: "CRUD"
      });
    } else {
      updatedTemplates = [...templates, newTemplate];
      toast.success("Template created");
      addAuditLog({
        action: "Create Template",
        user: user?.email || "System",
        status: "Success",
        details: `Created new permission template: ${newTemplate.name}`,
        category: "CRUD"
      });
    }

    setTemplates(updatedTemplates);
    localStorage.setItem("permissionTemplates", JSON.stringify(updatedTemplates));
    setIsTemplateDialogOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const templateToDelete = templates.find(t => t.id === id);
    if (confirm("Delete this template?")) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      setTemplates(updatedTemplates);
      localStorage.setItem("permissionTemplates", JSON.stringify(updatedTemplates));
      toast.success("Template deleted");
      addAuditLog({
        action: "Delete Template",
        user: user?.email || "System",
        status: "Success",
        details: `Deleted permission template: ${templateToDelete?.name || id}`,
        category: "CRUD"
      });
    }
  };

  // --- Form Helpers ---
  const toggleUserPermission = (key: keyof UserPermissions) => {
    setUserForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      },
      selectedTemplateId: "custom" // Switch to custom if manually toggled
    }));
  };

  const applyTemplateToUser = (templateId: string) => {
    if (templateId === "custom") {
      setUserForm(prev => ({ ...prev, selectedTemplateId: "custom" }));
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setUserForm(prev => ({
        ...prev,
        selectedTemplateId: templateId,
        permissions: { ...template.permissions }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Configure accounts, roles, and access permissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Users Accounts
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "templates"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Permission Templates
          </button>
        </nav>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingUser(null);
              setUserForm({ name: "", email: "", password: "", selectedTemplateId: "custom", permissions: USER_PERMISSIONS });
              setIsUserDialogOpen(true);
            }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Permissions Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.permissions.canCreateAccounts ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {u.permissions.canCreateAccounts ? "Admin Access" : "Standard User"}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {Object.values(u.permissions).filter(Boolean).length} / {Object.keys(u.permissions).length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingUser(u);
                          setUserForm({
                            name: u.name,
                            email: u.email,
                            password: "", // Don't show existing password
                            selectedTemplateId: "custom",
                            permissions: { ...u.permissions }
                          });
                          setIsUserDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} disabled={u.id === 1}>
                          <Trash2 className={`w-4 h-4 ${u.id === 1 ? "text-gray-300" : "text-red-500"}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* --- TEMPLATES TAB --- */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({ name: "", permissions: USER_PERMISSIONS });
              setIsTemplateDialogOpen(true);
            }} variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setEditingTemplate(t);
                      setTemplateForm({ name: t.name, permissions: { ...t.permissions } });
                      setIsTemplateDialogOpen(true);
                    }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-50">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(t.permissions).map(([key, val]) => (
                    val && (
                      <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{PERMISSION_LABELS[key as keyof UserPermissions]}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- USER DIALOG --- */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
            <DialogDescription>Configure account details and access level</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Password {editingUser && "(Leave blank to keep current)"}</Label>
                <Input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Apply Template</Label>
                <select 
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={userForm.selectedTemplateId}
                  onChange={(e) => applyTemplateToUser(e.target.value)}
                >
                  <option value="custom">Custom Configuration</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Permissions</Label>
              {Object.keys(USER_PERMISSIONS).map((key) => {
                const pKey = key as keyof UserPermissions;
                return (
                  <div key={pKey} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`p-${pKey}`}
                      checked={userForm.permissions[pKey]}
                      onChange={() => toggleUserPermission(pKey)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`p-${pKey}`} className="text-sm text-gray-700 cursor-pointer select-none">
                      {PERMISSION_LABELS[pKey]}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} className="bg-indigo-600 hover:bg-indigo-700">Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- TEMPLATE DIALOG --- */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Permission Template"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} placeholder="e.g. Junior Registrar" />
            </div>
            <div className="space-y-3">
              <Label>Enabled Permissions</Label>
              {Object.keys(USER_PERMISSIONS).map((key) => {
                const pKey = key as keyof UserPermissions;
                return (
                  <div key={pKey} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`t-${pKey}`}
                      checked={templateForm.permissions[pKey]}
                      onChange={() => setTemplateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, [pKey]: !prev.permissions[pKey] }
                      }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`t-${pKey}`} className="text-sm text-gray-700 cursor-pointer">
                      {PERMISSION_LABELS[pKey]}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} className="bg-indigo-600 hover:bg-indigo-700">Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}