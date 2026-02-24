import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Permissions Definition ---
export interface UserPermissions {
  canCreateAccounts: boolean;
  canManageStudents: boolean; // Create, Update, Delete (Soft/Hard), Restore
  canViewDashboard: boolean;
  canViewStudents: boolean;
  canViewAuditLogs: boolean;
  canViewRecycleBin: boolean;
}

export const ADMIN_PERMISSIONS: UserPermissions = {
  canCreateAccounts: true,
  canManageStudents: true,
  canViewDashboard: true,
  canViewStudents: true,
  canViewAuditLogs: true,
  canViewRecycleBin: true,
};

export const USER_PERMISSIONS: UserPermissions = {
  canCreateAccounts: false,
  canManageStudents: false,
  canViewDashboard: true, // Assuming basic users can see dashboard stats
  canViewStudents: true,  // Can view list but maybe not edit? We'll use canManageStudents for actions
  canViewAuditLogs: false,
  canViewRecycleBin: false,
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "User"; // Kept for backward compat / simple display
  permissions?: UserPermissions; // Optional to handle legacy data gracefully
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin account
const DEFAULT_ADMIN = {
  id: 1,
  name: "Admin User",
  email: "admin@example.com",
  password: "admin123",
  role: "Admin" as const,
  permissions: ADMIN_PERMISSIONS,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure permissions exist for session user
      if (!parsedUser.permissions) {
        parsedUser.permissions = parsedUser.role === "Admin" ? ADMIN_PERMISSIONS : USER_PERMISSIONS;
      }
      setUser(parsedUser);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // Get all users from localStorage
    const usersData = localStorage.getItem("users");
    const users = usersData ? JSON.parse(usersData) : [DEFAULT_ADMIN];

    // Find matching user
    const foundUser = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Ensure permissions are attached
      if (!userWithoutPassword.permissions) {
        userWithoutPassword.permissions = userWithoutPassword.role === "Admin" ? ADMIN_PERMISSIONS : USER_PERMISSIONS;
      }

      setUser(userWithoutPassword);
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
      
      // Log the login action
      addAuditLog({
        action: "Login",
        user: foundUser.email,
        status: "Success",
        details: "User logged in successfully",
        category: "Auth",
      });

      // Track session start
      const sessionStart = new Date().toISOString();
      localStorage.setItem("sessionStartTime", sessionStart);
      localStorage.setItem("sessionStartUser", foundUser.email);
      addAuditLog({
        action: "Session Start",
        user: foundUser.email,
        status: "Success",
        details: `New session opened for ${foundUser.name} (${foundUser.role})`,
        category: "Session",
      });
      
      return true;
    }

    // Log failed login attempt
    addAuditLog({
      action: "Login Failed",
      user: email,
      status: "Failed",
      details: `Failed login attempt — invalid credentials for "${email}"`,
      category: "Error",
    });

    return false;
  };

  const logout = () => {
    if (user) {
      // Calculate session duration
      const sessionStart = localStorage.getItem("sessionStartTime");
      if (sessionStart) {
        const durationMs = new Date().getTime() - new Date(sessionStart).getTime();
        const durationMins = Math.floor(durationMs / 60000);
        const durationSecs = Math.floor((durationMs % 60000) / 1000);
        addAuditLog({
          action: "Session End",
          user: user.email,
          status: "Success",
          details: `Session closed. Duration: ${durationMins}m ${durationSecs}s`,
          category: "Session",
        });
        localStorage.removeItem("sessionStartTime");
        localStorage.removeItem("sessionStartUser");
      }

      addAuditLog({
        action: "Logout",
        user: user.email,
        status: "Success",
        details: `${user.name} logged out of the system`,
        category: "Auth",
      });
    }
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const isAdmin = user?.role === "Admin";

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!user || !user.permissions) return false;
    return !!user.permissions[permission];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Audit log helper function
export type LogCategory = "API" | "CRUD" | "Auth" | "Session" | "Error" | "Click";

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  status: "Success" | "Failed" | "Error";
  details: string;
  category: LogCategory;
}

export function addAuditLog(log: Omit<AuditLog, "id" | "timestamp"> & { category?: LogCategory }) {
  try {
    const logs = getAuditLogs();
    const newLog: AuditLog = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      category: "CRUD",
      ...log,
    };
    
    // Add new log to the beginning
    logs.unshift(newLog);
    
    // Limit to the last 1000 logs to prevent LocalStorage quota issues
    const trimmedLogs = logs.slice(0, 1000);
    
    localStorage.setItem("auditLogs", JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error("Failed to add audit log:", error);
    // Optionally handle quota exceeded specifically
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Attempt to clear older logs aggressively if we hit the limit
      try {
        const logs = getAuditLogs();
        const aggressiveTrim = logs.slice(0, 500);
        localStorage.setItem("auditLogs", JSON.stringify(aggressiveTrim));
      } catch (retryError) {
        console.error("Critical: Unable to save audit logs even after trimming.", retryError);
      }
    }
  }
}

export function getAuditLogs(): AuditLog[] {
  try {
    const logs = localStorage.getItem("auditLogs");
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Failed to parse audit logs from localStorage:", error);
    return [];
  }
}