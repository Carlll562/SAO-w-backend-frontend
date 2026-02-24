import { useState, useEffect } from "react";
import { Search, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
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
import { toast } from "sonner";
import { addAuditLog, useAuth } from "../context/AuthContext";

interface Student {
  id: number;
  idNumber: string;
  lastName: string;
  firstName: string;
  fullName: string;
  section: string;
  dateEnrolled: string;
  currentYear: number;
  currentSemester: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  archived?: boolean; // Mirrors DB Is_Archived
}

export function RecycleBin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, hasPermission } = useAuth();

  if (!hasPermission("canViewRecycleBin")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You do not have permission to view the recycle bin.</p>
      </div>
    );
  }

  useEffect(() => {
    const stored = localStorage.getItem("students");
    if (stored) {
      setStudents(JSON.parse(stored));
    }
  }, []);

  const saveStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
  };

  const deletedStudents = students.filter(
    (student) =>
      student.isDeleted &&
      (student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.idNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRestore = async (student: Student) => {
    if (window.confirm(`Are you sure you want to restore ${student.fullName}?`)) {
      const timestamp = new Date().toISOString();
      const currentUserEmail = user?.email || "Unknown";

      // Call backend to set archived = false
      if (!user || !user.backendToken) {
        toast.error("Backend token missing. Please log in again to restore students in the database.");
        addAuditLog({
          action: "API Auth Error",
          user: currentUserEmail,
          status: "Error",
          details: "Attempted to restore a student but no backend JWT was available.",
          category: "Error",
        });
        return;
      }

      try {
        const resp = await fetch(`/api/v1/students/${encodeURIComponent(student.idNumber)}/restore`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false) {
          const message = data.message || "Failed to restore student on the server.";
          toast.error(message);
          addAuditLog({
            action: "API Error: PATCH /students/:id/restore",
            user: currentUserEmail,
            status: "Error",
            details: message,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        const message = error?.message || "Network error while restoring student.";
        toast.error(message);
        addAuditLog({
          action: "API Network Error: PATCH /students/:id/restore",
          user: currentUserEmail,
          status: "Error",
          details: message,
          category: "API",
        });
        return;
      }

      const updatedStudents = students.map((s) =>
        s.id === student.id
          ? { 
              ...s, 
              isDeleted: false, 
              deletedAt: null, 
              updatedAt: timestamp, 
              updatedBy: user?.email || "Unknown" 
            }
          : s
      );
      saveStudents(updatedStudents);
      toast.success("Student restored successfully");

      addAuditLog({
        action: "Restore Student",
        user: user?.email || "Unknown",
        status: "Success",
        details: `Restored student from Recycle Bin: ${student.fullName} (${student.idNumber})`,
        category: "CRUD",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Recycle Bin</h1>
          <p className="text-gray-600 mt-1">Restore previously deleted student records</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search deleted students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Number</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead>Deleted By</TableHead>
              <TableHead className="text-right">Restore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deletedStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono font-medium text-gray-500">{student.idNumber}</TableCell>
                <TableCell className="text-gray-500">{student.fullName}</TableCell>
                <TableCell className="text-gray-500">{student.section}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {student.deletedAt ? new Date(student.deletedAt).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-sm text-gray-500">{student.updatedBy}</TableCell>
                <TableCell className="text-right">
                  {hasPermission("canManageStudents") && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => handleRestore(student)}
                      title="Restore"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {deletedStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Trash2 className="w-8 h-8 text-gray-300" />
                    <p>Recycle Bin is empty.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}