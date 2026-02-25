import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Trash2, Users, BookOpen } from "lucide-react";
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

// ERD: student
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
  archived?: boolean; 
}

// ERD: enrollment (Added so RecycleBin knows what an enrollment looks like)
interface Enrollment {
  id: number; 
  grade: string; 
  status: string; 
  createdAt: string; 
  updatedAt: string; 
  createdBy: string; 
  updatedBy: string; 
  studentId: string; 
  curriculumId: number; 
  courseCode?: string; 
  programName?: string; 
  yearId?: number; 
  semesterId?: number; 
  isArchived?: boolean; 
}

export function RecycleBin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // NEW: Toggle state between viewing Students or Courses
  const [viewMode, setViewMode] = useState<"students" | "enrollments">("students");

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
    // Load Students
    const storedStudents = localStorage.getItem("students");
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }

    // Load Enrollments
    const storedEnrollments = localStorage.getItem("enrollments");
    if (storedEnrollments) {
      setEnrollments(JSON.parse(storedEnrollments));
    }
  }, []);

  const saveStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
  };

  const saveEnrollments = (updatedEnrollments: Enrollment[]) => {
    setEnrollments(updatedEnrollments);
    localStorage.setItem("enrollments", JSON.stringify(updatedEnrollments));
  };

  // --- FILTERED LISTS ---
  const deletedStudents = students.filter(
    (student) =>
      student.isDeleted &&
      (student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.idNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const deletedEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.isArchived &&
      (enrollment.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.studentId?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- RESTORE HANDLERS ---
  const handleRestoreStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to restore ${student.fullName}?`)) {
      const timestamp = new Date().toISOString();
      const currentUserEmail = user?.email || "Unknown";

      if (!user || !user.backendToken) {
        toast.error("Backend token missing. Please log in again to restore students.");
        addAuditLog({
          action: "API Auth Error: Restore Student",
          user: currentUserEmail,
          status: "Error",
          details: `Attempted to restore student ${student.fullName} (${student.idNumber}) but no backend JWT was available.`,
          category: "API",
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
          toast.error(data.message || "Failed to restore student on the server.");
          addAuditLog({
            action: "API Error: PATCH /students/:id/restore",
            user: currentUserEmail,
            status: "Failed",
            details: data.message || `Failed to restore student ${student.fullName} (${student.idNumber}) on the server.`,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        toast.error("Network error while restoring student.");
        addAuditLog({
          action: "API Network Error: PATCH /students/:id/restore",
          user: currentUserEmail,
          status: "Error",
          details: error?.message || `Network error while restoring student ${student.fullName} (${student.idNumber}).`,
          category: "API",
        });
        return;
      }

      const updatedStudents = students.map((s) =>
        s.id === student.id
          ? { ...s, isDeleted: false, deletedAt: null, updatedAt: timestamp, updatedBy: user?.email || "Unknown" }
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

  const handleRestoreEnrollment = async (enrollment: Enrollment) => {
    if (window.confirm(`Are you sure you want to restore the course ${enrollment.courseCode} for Student ${enrollment.studentId}?`)) {
      const timestamp = new Date().toISOString();
      const currentUserEmail = user?.email || "Unknown";

      if (!user || !user.backendToken) {
        toast.error("Backend token missing. Please log in again to restore courses.");
        addAuditLog({
          action: "API Auth Error: Restore Enrollment",
          user: currentUserEmail,
          status: "Error",
          details: `Attempted to restore enrollment ID ${enrollment.id} for student ${enrollment.studentId} but no backend JWT was available.`,
          category: "API",
        });
        return;
      }

      try {
        const resp = await fetch(`/api/v1/students/enrollment/${enrollment.id}/restore`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false) {
          toast.error(data.message || "Failed to restore course on the server.");
          addAuditLog({
            action: "API Error: PATCH /students/enrollment/:id/restore",
            user: currentUserEmail,
            status: "Failed",
            details: data.message || `Failed to restore course ${enrollment.courseCode || 'Curriculum ' + enrollment.curriculumId} for student ${enrollment.studentId} on the server.`,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        toast.error("Network error while restoring course.");
        addAuditLog({
          action: "API Network Error: PATCH /students/enrollment/:id/restore",
          user: currentUserEmail,
          status: "Error",
          details: error?.message || `Network error while restoring course ${enrollment.courseCode || 'Curriculum ' + enrollment.curriculumId} for student ${enrollment.studentId}.`,
          category: "API",
        });
        return;
      }

      const updatedEnrollments = enrollments.map((e) =>
        e.id === enrollment.id
          ? { ...e, isArchived: false, updatedAt: timestamp, updatedBy: user?.email || "Unknown" }
          : e
      );
      saveEnrollments(updatedEnrollments);
      toast.success("Course restored successfully");

      addAuditLog({
        action: "Restore Enrollment",
        user: user?.email || "Unknown",
        status: "Success",
        details: `Restored course ${enrollment.courseCode} for Student ID ${enrollment.studentId}`,
        category: "CRUD",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Recycle Bin</h1>
          <p className="text-gray-600 mt-1">Restore previously deleted records</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Button 
            variant={viewMode === "students" ? "default" : "ghost"}
            className={`text-sm h-9 ${viewMode === "students" ? "bg-white text-gray-900 shadow-sm hover:bg-white" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewMode("students")}
          >
            <Users className="w-4 h-4 mr-2" />
            Students
          </Button>
          <Button 
            variant={viewMode === "enrollments" ? "default" : "ghost"}
            className={`text-sm h-9 ${viewMode === "enrollments" ? "bg-white text-gray-900 shadow-sm hover:bg-white" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewMode("enrollments")}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Dropped Courses
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder={viewMode === "students" ? "Search deleted students..." : "Search dropped courses or student IDs..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        
        {/* STUDENTS TABLE */}
        {viewMode === "students" && (
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => handleRestoreStudent(student)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" /> Restore
                    </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {deletedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trash2 className="w-8 h-8 text-gray-300" />
                      <p>No deleted students found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* ENROLLMENTS TABLE */}
        {viewMode === "enrollments" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Course Code</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Grade / Status</TableHead>
                <TableHead>Dropped At</TableHead>
                <TableHead className="text-right">Restore</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deletedEnrollments.map((enr) => (
                <TableRow key={enr.id}>
                  <TableCell className="font-mono font-medium text-gray-500">{enr.studentId}</TableCell>
                  <TableCell className="font-medium text-gray-500">{enr.courseCode || `Curriculum ${enr.curriculumId}`}</TableCell>
                  <TableCell className="text-gray-500">{enr.programName || "N/A"}</TableCell>
                  <TableCell className="text-gray-500">{enr.grade} ({enr.status})</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {enr.updatedAt ? new Date(enr.updatedAt).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasPermission("canManageStudents") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => handleRestoreEnrollment(enr)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" /> Restore
                    </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {deletedEnrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trash2 className="w-8 h-8 text-gray-300" />
                      <p>No dropped courses found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}