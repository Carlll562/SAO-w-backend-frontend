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

  const handleRestore = (student: Student) => {
    if (window.confirm(`Are you sure you want to restore ${student.fullName}?`)) {
      const timestamp = new Date().toISOString();
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

  const handlePermanentDelete = (student: Student) => {
    if (window.confirm(`WARNING: This action cannot be undone.\n\nAre you sure you want to PERMANENTLY delete ${student.fullName}?`)) {
      const updatedStudents = students.filter((s) => s.id !== student.id);
      saveStudents(updatedStudents);
      toast.error("Student permanently deleted");

      addAuditLog({
        action: "Permanent Delete Student",
        user: user?.email || "Unknown",
        status: "Success",
        details: `Permanently deleted student: ${student.fullName} (${student.idNumber})`,
        category: "CRUD",
      });
    }
  };

  const handleEmptyRecycleBin = () => {
    if (deletedStudents.length === 0) return;

    if (window.confirm(`WARNING: This will permanently delete ALL ${deletedStudents.length} items in the Recycle Bin.\n\nThis action cannot be undone. Continue?`)) {
      const updatedStudents = students.filter((s) => !s.isDeleted);
      saveStudents(updatedStudents);
      toast.error("Recycle Bin emptied");

      addAuditLog({
        action: "Empty Recycle Bin",
        user: user?.email || "Unknown",
        status: "Success",
        details: `Permanently deleted ${deletedStudents.length} students from Recycle Bin`,
        category: "CRUD",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Recycle Bin</h1>
          <p className="text-gray-600 mt-1">Manage deleted student records</p>
        </div>
        {deletedStudents.length > 0 && hasPermission("canManageStudents") && (
          <Button 
            variant="destructive" 
            onClick={handleEmptyRecycleBin}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Empty Recycle Bin
          </Button>
        )}
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
              <TableHead className="text-right">Actions</TableHead>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handlePermanentDelete(student)}
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
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
      
      {deletedStudents.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Items in the Recycle Bin can be restored at any time. "Empty Recycle Bin" will permanently remove all items listed here.
          </p>
        </div>
      )}
    </div>
  );
}