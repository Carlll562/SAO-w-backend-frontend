import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Globe,
  Database,
  LogIn,
  Clock,
  AlertCircle,
  MousePointer,
  Layers,
  RefreshCw,
} from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getAuditLogs, AuditLog, LogCategory, useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

// ── Tab definition ─────────────────────────────────────────────────────────────
type TabKey = "All" | LogCategory;

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  accent: string;         // Tailwind text colour for icon / active state
  activeBg: string;       // Tailwind background for active tab pill
  badgeBg: string;        // Tailwind background for the count badge
  badgeText: string;
  emptyMsg: string;
}

const TABS: TabDef[] = [
  {
    key: "All",
    label: "All Logs",
    icon: Layers,
    accent: "text-gray-700",
    activeBg: "bg-white border border-gray-200 shadow-sm",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
    emptyMsg: "No log entries found.",
  },
  {
    key: "API",
    label: "API Requests",
    icon: Globe,
    accent: "text-blue-600",
    activeBg: "bg-blue-50 border border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    emptyMsg: "No API request logs yet.",
  },
  {
    key: "CRUD",
    label: "CRUD Operations",
    icon: Database,
    accent: "text-indigo-600",
    activeBg: "bg-indigo-50 border border-indigo-200",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    emptyMsg: "No CRUD operation logs yet.",
  },
  {
    key: "Auth",
    label: "Log Ins / Outs",
    icon: LogIn,
    accent: "text-green-600",
    activeBg: "bg-green-50 border border-green-200",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    emptyMsg: "No authentication logs yet.",
  },
  {
    key: "Session",
    label: "Session Periods",
    icon: Clock,
    accent: "text-purple-600",
    activeBg: "bg-purple-50 border border-purple-200",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    emptyMsg: "No session records yet.",
  },
  {
    key: "Error",
    label: "Errors",
    icon: AlertCircle,
    accent: "text-red-600",
    activeBg: "bg-red-50 border border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    emptyMsg: "No error logs recorded. Great!",
  },
  {
    key: "Click",
    label: "Clicks",
    icon: MousePointer,
    accent: "text-orange-500",
    activeBg: "bg-orange-50 border border-orange-200",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    emptyMsg: "No click events recorded yet.",
  },
];

// ── Category badge styles ───────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<LogCategory, string> = {
  API:     "bg-blue-50 text-blue-700 border border-blue-200",
  CRUD:    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Auth:    "bg-green-50 text-green-700 border border-green-200",
  Session: "bg-purple-50 text-purple-700 border border-purple-200",
  Error:   "bg-red-50 text-red-700 border border-red-200",
  Click:   "bg-orange-50 text-orange-700 border border-orange-200",
};

const STATUS_STYLES: Record<string, string> = {
  Success: "bg-green-100 text-green-800",
  Failed:  "bg-red-100 text-red-800",
  Error:   "bg-yellow-100 text-yellow-800",
};

// ── Component ──────────────────────────────────────────────────────────────────
export function AuditLogs() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const fetchLogs = () => setLogs(getAuditLogs());

  if (!hasPermission("canViewAuditLogs")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You do not have permission to view audit logs.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Logs for the active tab (before search / status filter)
  const tabLogs = activeTab === "All"
    ? logs
    : logs.filter((l) => (l.category ?? "CRUD") === activeTab);

  // Apply search + status filters
  const filteredLogs = tabLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || log.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatTimestamp = (ts: string) => new Date(ts).toLocaleString();

  const currentTabDef = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-semibold text-gray-900">Audit Logs</h1>
          </div>
          <p className="text-gray-600 mt-1">
            View all system activities and user actions, organized by category
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          className="shrink-0 gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* ── Info Banner ── */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          <strong>System Audit Trail:</strong> All actions — API requests, CRUD
          operations, logins/logouts, session periods, errors, and UI clicks — are
          logged here for transparency and security.
        </p>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TABS.filter((t) => t.key !== "All").map((tab) => {
          const Icon = tab.icon;
          const count = logs.filter((l) => (l.category ?? "CRUD") === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
                activeTab === tab.key
                  ? tab.activeBg + " ring-2 ring-offset-1 ring-current"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${tab.accent}`} />
              <p className={`text-xs text-gray-500 truncate w-full`}>{tab.label}</p>
              <p className={`text-xl font-semibold ${tab.accent}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-xl scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.key === "All"
              ? logs.length
              : logs.filter((l) => (l.category ?? "CRUD") === tab.key).length;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? tab.activeBg + " " + tab.accent
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
                  isActive ? tab.badgeBg + " " + tab.badgeText : "bg-gray-200 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={`Search ${currentTabDef.label.toLowerCase()}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
        >
          <option value="All">All Status</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Error">Error</option>
        </select>
      </div>

      {/* ── Tab-level counters ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">
            {activeTab === "All" ? "Total Logs" : `${currentTabDef.label} Logs`}
          </p>
          <p className="text-2xl font-semibold text-gray-900">{tabLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Success</p>
          <p className="text-2xl font-semibold text-green-600">
            {tabLogs.filter((l) => l.status === "Success").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Failed / Error</p>
          <p className="text-2xl font-semibold text-red-600">
            {tabLogs.filter((l) => l.status === "Failed" || l.status === "Error").length}
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Table header accent */}
        <div className={`px-5 py-3 border-b flex items-center gap-2 ${
          activeTab === "All" ? "bg-gray-50" : currentTabDef.activeBg
        }`}>
          {(() => {
            const Icon = currentTabDef.icon;
            return <Icon className={`w-4 h-4 ${currentTabDef.accent}`} />;
          })()}
          <span className={`text-sm font-medium ${currentTabDef.accent}`}>
            {currentTabDef.label}
          </span>
          <span className="ml-auto text-xs text-gray-400">
            Showing {filteredLogs.length} of {tabLogs.length} entries
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[175px]">Date &amp; Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              {activeTab === "All" && <TableHead className="w-[120px]">Category</TableHead>}
              <TableHead className="w-[95px]">Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={activeTab === "All" ? 6 : 5}
                  className="text-center py-12 text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    {(() => {
                      const Icon = currentTabDef.icon;
                      return <Icon className="w-8 h-8 text-gray-300" />;
                    })()}
                    <p>{currentTabDef.emptyMsg}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const cat = (log.category ?? "CRUD") as LogCategory;
                return (
                  <TableRow key={log.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.user}</TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    {activeTab === "All" && (
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[cat]}`}
                        >
                          {cat}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[log.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-sm text-sm text-gray-600 truncate">
                      {log.details}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}