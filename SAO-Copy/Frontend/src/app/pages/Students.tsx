import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
import { addAuditLog, useAuth } from "../context/AuthContext";

// ERD: student
interface Student {
  id: number;
  idNumber: string; // VARCHAR(8)
  lastName: string; // VARCHAR(30)
  firstName: string; // VARCHAR(30)
  fullName: string; // VARCHAR(60)
  section: string; // VARCHAR(45)
  dateEnrolled: string; 
  currentYear: number; 
  currentSemester: number; 
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isDeleted?: boolean;
  archived?: boolean; // Mirrors Is_Archived from DB
}

// ERD: enrollment (Updated to match exact columns)
interface Enrollment {
  id: number; // ID INT
  grade: string; // Grade VARCHAR(9)
  status: string; // Status ENUM('Passed','Failed','Active') in DB
  createdAt: string; // Created_At DATETIME
  updatedAt: string; // Updated_At DATETIME
  createdBy: string; // Created_By VARCHAR(45)
  updatedBy: string; // Updated_By VARCHAR(45)
  studentId: string; // STUDENT_ID VARCHAR (FK to student)
  curriculumId: number; // CURRICULUM_ID INT (FK to curriculum)
  courseCode?: string; // Derived: Course associated with this enrollment
  programName?: string; // Derived: Program the course is under
  yearId?: number; // YEAR_ID used by StudentEnroll
  semesterId?: number; // SEMESTER_ID used by StudentEnroll
}

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Student Dialog State
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    idNumber: "",
    firstName: "",
    lastName: "",
    section: "",
    currentYear: 1,
    currentSemester: 1,
  });

  // Enrollment Dialog State
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState<string | null>(null);
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    curriculumId: 1,
    grade: "",
    status: "Active",
    courseCode: "",
    programName: "",
    yearId: 1,
    semesterId: 1,
  });
  
  const { user, hasPermission } = useAuth();

  if (!hasPermission("canViewStudents")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You do not have permission to view student records.</p>
      </div>
    );
  }

  // Grade input must respect DB GradeUpdate() constraints:
  // (Ongoing), R, F, or integer 1–100
  const GRADE_INPUT_REGEX = /^(\(Ongoing\)|R|F|([1-9][0-9]?|100))$/;

  const deriveStatusFromGrade = (rawGrade: string): string => {
    const g = (rawGrade || "").trim();
    if (!g || g === "(Ongoing)") {
      return "Active";
    }
    if (g === "F" || g === "R") {
      return "Failed";
    }
    const numericMatch = g.match(/^([1-9][0-9]?|100)$/);
    if (numericMatch) {
      const value = parseInt(g, 10);
      return value >= 70 ? "Passed" : "Failed";
    }
    return "Active";
  };

  const normalizeEnrollmentFromStorage = (e: Enrollment): Enrollment => {
    const normalizedGrade = (e.grade || "").trim();
    return {
      ...e,
      grade: normalizedGrade || "(Ongoing)",
      status: deriveStatusFromGrade(normalizedGrade || "(Ongoing)"),
    };
  };

  useEffect(() => {
    const storedStudents = localStorage.getItem("students");
    if (storedStudents) setStudents(JSON.parse(storedStudents));

    const storedEnrollments = localStorage.getItem("enrollments");
    if (storedEnrollments) {
      try {
        const parsed: Enrollment[] = JSON.parse(storedEnrollments);
        const normalized = parsed.map(normalizeEnrollmentFromStorage);
        setEnrollments(normalized);
        localStorage.setItem("enrollments", JSON.stringify(normalized));
      } catch {
        setEnrollments([]);
      }
    }

    // Simulate API data-fetch logging
    addAuditLog({
      action: "GET /students",
      user: "System",
      status: "Success",
      details: "Fetched student records from local data store",
      category: "API",
    });
    addAuditLog({
      action: "GET /enrollments",
      user: "System",
      status: "Success",
      details: "Fetched enrollment records from local data store",
      category: "API",
    });
  }, []);

  const saveStudents = (updated: Student[]) => {
    setStudents(updated);
    localStorage.setItem("students", JSON.stringify(updated));
  };

  const saveEnrollments = (updated: Enrollment[]) => {
    setEnrollments(updated);
    localStorage.setItem("enrollments", JSON.stringify(updated));
  };

  const toggleRowExpansion = (studentId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(studentId)) {
      newExpandedRows.delete(studentId);
    } else {
      newExpandedRows.add(studentId);
    }
    setExpandedRows(newExpandedRows);
  };

  const filteredStudents = students.filter(
    (student) =>
      !student.isDeleted &&
      (student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.idNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- STUDENT HANDLERS ---
  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentFormData({ idNumber: "", firstName: "", lastName: "", section: "", currentYear: 1, currentSemester: 1 });
    setStudentDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentFormData({
      idNumber: student.idNumber,
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      section: student.section || "",
      currentYear: student.currentYear || 1,
      currentSemester: student.currentSemester || 1,
    });
    setStudentDialogOpen(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to move ${student.fullName} to the Recycle Bin?`)) {
      const timestamp = new Date().toISOString();
      const currentUserEmail = user?.email || "Unknown";

      // Call backend to set archived = true
      if (!user || !user.backendToken) {
        toast.error("Backend token missing. Please log in again to archive students in the database.");
        addAuditLog({
          action: "API Auth Error",
          user: currentUserEmail,
          status: "Error",
          details: "Attempted to archive a student but no backend JWT was available.",
          category: "Error",
        });
        return;
      }

      try {
        const resp = await fetch(`/api/v1/students/${encodeURIComponent(student.idNumber)}/archive`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false) {
          const message = data.message || "Failed to archive student on the server.";
          toast.error(message);
          addAuditLog({
            action: "API Error: PATCH /students/:id/archive",
            user: currentUserEmail,
            status: "Error",
            details: message,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        const message = error?.message || "Network error while archiving student.";
        toast.error(message);
        addAuditLog({
          action: "API Network Error: PATCH /students/:id/archive",
          user: currentUserEmail,
          status: "Error",
          details: message,
          category: "API",
        });
        return;
      }

      const updatedStudents = students.map((s) => 
        s.id === student.id 
          ? { ...s, isDeleted: true, deletedAt: timestamp, updatedBy: user?.email || "Unknown" } 
          : s
      );
      saveStudents(updatedStudents);
      
      toast.success("Student moved to Recycle Bin");
      addAuditLog({
        action: "Move to Recycle Bin",
        user: user?.email || "Unknown",
        status: "Success",
        details: `Moved student to Recycle Bin: ${student.fullName} (ID: ${student.idNumber})`,
        category: "CRUD",
      });
    }
  };

  const handleStudentSubmit = async () => {
    if (!studentFormData.idNumber.trim() || !studentFormData.firstName.trim() || !studentFormData.lastName.trim()) {
      toast.error("ID Number, First Name, and Last Name are required.");
      addAuditLog({
        action: "Validation Error",
        user: user?.email || "Unknown",
        status: "Error",
        details: "Student form submission failed: ID Number, First Name, and Last Name are required fields",
        category: "Error",
      });
      return;
    }

    const trimmedId = studentFormData.idNumber.trim();
    if (trimmedId.length !== 8) {
      toast.error("ID Number must be exactly 8 characters long.");
      addAuditLog({
        action: "Validation Error",
        user: user?.email || "Unknown",
        status: "Error",
        details: `Student form submission failed: ID Number "${studentFormData.idNumber}" does not meet the 8-character VARCHAR(8) requirement`,
        category: "Error",
      });
      return;
    }

    const timestamp = new Date().toISOString();
    const currentUser = user?.email || "Unknown";
    const generatedFullName = `${studentFormData.firstName.trim()} ${studentFormData.lastName.trim()}`;

    // --- Sync with backend MySQL via API ---
    if (!user || !user.backendToken) {
      toast.error("Backend token missing. Please log in again to use the database-backed API.");
      addAuditLog({
        action: "API Auth Error",
        user: currentUser,
        status: "Error",
        details: "Attempted to create a student but no backend JWT was available.",
        category: "Error",
      });
      return;
    }

    if (editingStudent) {
      // Update existing student in the database
      try {
        const response = await fetch(`/api/v1/students/${encodeURIComponent(editingStudent.idNumber)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
          body: JSON.stringify({
            firstName: studentFormData.firstName.trim(),
            lastName: studentFormData.lastName.trim(),
            section: studentFormData.section.trim(),
            currentYear: Number(studentFormData.currentYear),
            currentSemester: Number(studentFormData.currentSemester),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          const message = data.message || "Failed to update student on the server.";
          toast.error(message);
          addAuditLog({
            action: "API Error: PUT /students/:id",
            user: currentUser,
            status: "Error",
            details: message,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        const message = error?.message || "Network error while updating student on the backend.";
        toast.error(message);
        addAuditLog({
          action: "API Network Error: PUT /students/:id",
          user: currentUser,
          status: "Error",
          details: message,
          category: "API",
        });
        return;
      }

      // --- Local UI state update (kept for immediate UX) ---
      const updatedStudents = students.map((s) =>
        s.id === editingStudent.id
          ? { 
              ...s, ...studentFormData, fullName: generatedFullName,
              currentYear: Number(studentFormData.currentYear),
              currentSemester: Number(studentFormData.currentSemester),
              updatedAt: timestamp, updatedBy: currentUser
            }
          : s
      );
      saveStudents(updatedStudents);
      toast.success("Student updated successfully");
      addAuditLog({
        action: "UPDATE Student",
        user: currentUser,
        status: "Success",
        details: `Updated student record: ${generatedFullName} (ID: ${studentFormData.idNumber}, Section: ${studentFormData.section})`,
        category: "CRUD",
      });
    } else {
      // Create new student in the database
      try {
        const response = await fetch("/api/v1/students", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
          body: JSON.stringify({
            idNumber: trimmedId,
            firstName: studentFormData.firstName.trim(),
            lastName: studentFormData.lastName.trim(),
            section: studentFormData.section.trim(),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          const message = data.message || "Failed to add student on the server.";
          toast.error(message);
          addAuditLog({
            action: "API Error: POST /students",
            user: currentUser,
            status: "Error",
            details: message,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        const message = error?.message || "Network error while talking to the backend.";
        toast.error(message);
        addAuditLog({
          action: "API Network Error: POST /students",
          user: currentUser,
          status: "Error",
          details: message,
          category: "API",
        });
        return;
      }

      // --- Local UI state update (kept for immediate UX) ---
      if (students.some(s => s.idNumber === trimmedId)) {
        toast.error("A student with this ID Number already exists locally!");
        addAuditLog({
          action: "Duplicate ID Error",
          user: currentUser,
          status: "Error",
          details: `Student creation failed locally: ID Number "${studentFormData.idNumber}" already exists in the data store`,
          category: "Error",
        });
        return;
      }

      const newStudent: Student = {
        id: Date.now(),
        idNumber: trimmedId,
        firstName: studentFormData.firstName.trim(),
        lastName: studentFormData.lastName.trim(),
        fullName: generatedFullName,
        section: studentFormData.section.trim(),
        currentYear: Number(studentFormData.currentYear),
        currentSemester: Number(studentFormData.currentSemester),
        dateEnrolled: timestamp,
        createdAt: timestamp, updatedAt: timestamp,
        createdBy: currentUser, updatedBy: currentUser,
      };
      saveStudents([...students, newStudent]);
      toast.success("Student added successfully (saved to MySQL and local view)");
      addAuditLog({
        action: "CREATE Student",
        user: currentUser,
        status: "Success",
        details: `Created new student record and synced to MySQL: ${generatedFullName} (ID: ${studentFormData.idNumber}, Section: ${studentFormData.section})`,
        category: "CRUD",
      });
    }
    setStudentDialogOpen(false);
  };

  // --- ENROLLMENT HANDLERS ---
  const handleOpenAddEnrollment = (studentIdNumber: string) => {
    const targetStudent = students.find((s) => s.idNumber === studentIdNumber);
    setEditingEnrollment(null);
    setSelectedStudentForEnrollment(studentIdNumber);
    setEnrollmentFormData({
      curriculumId: 1,
      grade: "",
      status: "Active",
      courseCode: "",
      programName: "",
      yearId: targetStudent?.currentYear || 1,
      semesterId: targetStudent?.currentSemester || 1,
    });
    setEnrollmentDialogOpen(true);
  };

  const handleOpenEditEnrollment = (enrollment: Enrollment, studentIdNumber: string) => {
    setEditingEnrollment(enrollment);
    setSelectedStudentForEnrollment(studentIdNumber);
    setEnrollmentFormData({
      curriculumId: enrollment.curriculumId,
      grade: enrollment.grade || "",
      status: deriveStatusFromGrade(enrollment.grade || ""),
      courseCode: enrollment.courseCode || "",
      programName: enrollment.programName || "",
       yearId: enrollment.yearId || 1,
       semesterId: enrollment.semesterId || 1,
    });
    setEnrollmentDialogOpen(true);
  };

  const handleEnrollmentSubmit = async () => {
    if (!selectedStudentForEnrollment) return;
    
    const trimmedGrade = (enrollmentFormData.grade || "").trim();
    const normalizedGrade = trimmedGrade === "" ? "(Ongoing)" : trimmedGrade;

    if (normalizedGrade.length > 9) {
      toast.error("Grade cannot exceed 9 characters.");
      addAuditLog({
        action: "Validation Error",
        user: user?.email || "Unknown",
        status: "Error",
        details: `Enrollment form failed: Grade "${normalizedGrade}" exceeds VARCHAR(9) limit`,
        category: "Error",
      });
      return;
    }

    if (!GRADE_INPUT_REGEX.test(normalizedGrade)) {
      toast.error("Invalid Grade. Allowed: (Ongoing), R, F, or 1–100.");
      addAuditLog({
        action: "Validation Error",
        user: user?.email || "Unknown",
        status: "Error",
        details: `Enrollment form failed: Grade "${normalizedGrade}" does not satisfy the GradeUpdate() regex or VARCHAR(9) constraint`,
        category: "Error",
      });
      return;
    }

    const timestamp = new Date().toISOString();
    const currentUser = user?.email || "Unknown";
    const derivedStatus = deriveStatusFromGrade(normalizedGrade);

    // Resolve the selected student to derive program/year/semester and fullName for backend calls
    const selectedStudent = students.find((s) => s.idNumber === selectedStudentForEnrollment);
    if (!selectedStudent) {
      toast.error("Selected student not found. Please reload the page.");
      return;
    }

    if (!user || !user.backendToken) {
      toast.error("Backend token missing. Please log in again to save enrollments to the database.");
      addAuditLog({
        action: "API Auth Error",
        user: currentUser,
        status: "Error",
        details: "Attempted to create or update an enrollment but no backend JWT was available.",
        category: "Error",
      });
      return;
    }

    if (editingEnrollment) {
      // 1) Sync grade change to backend via GradeUpdate stored procedure
      try {
        const resp = await fetch("/api/v1/grades", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
          body: JSON.stringify({
            fullname: selectedStudent.fullName,
            courseCode: (enrollmentFormData as any).courseCode || "",
            rawGrade: normalizedGrade,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false) {
          const message = data.message || "Failed to update grade in the backend.";
          toast.error(message);
          addAuditLog({
            action: "API Error: POST /grades",
            user: currentUser,
            status: "Error",
            details: message,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        const message = error?.message || "Network error while updating grade in the backend.";
        toast.error(message);
        addAuditLog({
          action: "API Network Error: POST /grades",
          user: currentUser,
          status: "Error",
          details: message,
          category: "API",
        });
        return;
      }

      // 2) Update local enrollment cache for UI
      const updatedEnrollments = enrollments.map((e) =>
        e.id === editingEnrollment.id
          ? {
              ...e,
              grade: normalizedGrade,
              status: derivedStatus,
              curriculumId: Number(enrollmentFormData.curriculumId),
              updatedAt: timestamp,
              updatedBy: currentUser,
              courseCode: (enrollmentFormData as any).courseCode?.trim() || "",
              programName: (enrollmentFormData as any).programName?.trim() || "",
            }
          : e
      );

      saveEnrollments(updatedEnrollments);
      toast.success("Enrollment record updated successfully");
      addAuditLog({
        action: "UPDATE Enrollment",
        user: currentUser,
        status: "Success",
        details: `Updated enrollment for student ID ${selectedStudentForEnrollment} — Curriculum: ${enrollmentFormData.curriculumId}, Grade: ${normalizedGrade}, Status: ${derivedStatus}, Course: ${(enrollmentFormData as any).courseCode || "N/A"}, Program: ${(enrollmentFormData as any).programName || "N/A"}`,
        category: "CRUD",
      });
    } else {
      // 1) Create enrollment in backend using StudentEnroll stored procedure
      try {
        const resp = await fetch("/api/v1/students/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.backendToken}`,
          },
          body: JSON.stringify({
            fullName: selectedStudent.fullName,
            courseCode: (enrollmentFormData as any).courseCode || "",
            programName: (enrollmentFormData as any).programName || "",
            yearId: (enrollmentFormData as any).yearId || selectedStudent.currentYear,
            semesterId: (enrollmentFormData as any).semesterId || selectedStudent.currentSemester,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.success === false) {
          const message = data.message || "Failed to create enrollment in the backend.";
          toast.error(message);
          addAuditLog({
            action: "API Error: POST /students/enroll",
            user: currentUser,
            status: "Error",
            details: message,
            category: "API",
          });
          return;
        }
      } catch (error: any) {
        const message = error?.message || "Network error while creating enrollment in the backend.";
        toast.error(message);
        addAuditLog({
          action: "API Network Error: POST /students/enroll",
          user: currentUser,
          status: "Error",
          details: message,
          category: "API",
        });
        return;
      }

      // 2) Add local enrollment record for UI
      const newEnrollment: Enrollment = {
        id: Date.now(),
        grade: normalizedGrade,
        status: derivedStatus,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: currentUser,
        updatedBy: currentUser,
        studentId: selectedStudentForEnrollment,
        curriculumId: Number(enrollmentFormData.curriculumId),
        courseCode: (enrollmentFormData as any).courseCode?.trim() || "",
        programName: (enrollmentFormData as any).programName?.trim() || "",
        yearId: (enrollmentFormData as any).yearId || selectedStudent.currentYear,
        semesterId: (enrollmentFormData as any).semesterId || selectedStudent.currentSemester,
      };

      saveEnrollments([...enrollments, newEnrollment]);
      toast.success("Enrollment record added successfully");
      addAuditLog({
        action: "CREATE Enrollment",
        user: currentUser,
        status: "Success",
        details: `Created enrollment for student ID ${selectedStudentForEnrollment} — Curriculum: ${enrollmentFormData.curriculumId}, Grade: ${normalizedGrade}, Status: ${derivedStatus}, Course: ${(enrollmentFormData as any).courseCode || "N/A"}, Program: ${(enrollmentFormData as any).programName || "N/A"}`,
        category: "CRUD",
      });
    }
    setEnrollmentDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage student and enrollment records (ERD Aligned)</p>
        </div>
        {hasPermission("canManageStudents") && (
        <Button onClick={handleAddStudent} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by name or student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Date Enrolled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => {
              const isExpanded = expandedRows.has(student.id);
              const studentEnrollments = enrollments.filter(e => e.studentId === student.idNumber);

              return (
                <React.Fragment key={student.id}>
                  <TableRow className={isExpanded ? "bg-indigo-50/50 border-b-0" : ""}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleRowExpansion(student.id)} className="h-8 w-8">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{student.idNumber}</TableCell>
                    <TableCell>{student.firstName}</TableCell>
                    <TableCell>{student.lastName}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>{student.currentYear}</TableCell>
                    <TableCell>{student.currentSemester}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(student.dateEnrolled).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasPermission("canManageStudents") && (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditStudent(student)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteStudent(student)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Enrollment Sub-Table */}
                  {isExpanded && (
                    <TableRow className="bg-gray-50/50">
                      <TableCell colSpan={9} className="p-0 border-b">
                        <div className="px-14 py-4">
                          <div className="rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
                            {/* Sub-table Header with Add Button */}
                            <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                              <span className="font-semibold text-sm text-gray-700">Enrollment Records</span>
                              {hasPermission("canManageStudents") && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs bg-white"
                                onClick={() => handleOpenAddEnrollment(student.idNumber)}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Enrollment
                              </Button>
                              )}
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                  <TableHead className="text-xs">Enrollment ID</TableHead>
                                  <TableHead className="text-xs">Course</TableHead>
                                  <TableHead className="text-xs">Program</TableHead>
                                  <TableHead className="text-xs">Grade</TableHead>
                                  <TableHead className="text-xs">Status</TableHead>
                                  <TableHead className="text-xs">Updated At</TableHead>
                                  <TableHead className="text-xs text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {studentEnrollments.length > 0 ? (
                                  studentEnrollments.map(enr => (
                                    <TableRow key={enr.id}>
                                      <TableCell className="font-mono text-xs text-gray-500">{enr.id}</TableCell>
                                      <TableCell className="text-xs font-medium text-indigo-600">
                                        {enr.courseCode || `Curriculum ${enr.curriculumId}`}
                                      </TableCell>
                                      <TableCell className="text-xs">{enr.programName || "N/A"}</TableCell>
                                      <TableCell className="text-xs font-semibold">{enr.grade || "(Ongoing)"}</TableCell>
                                      <TableCell className="text-xs">
                                        <span
                                          className={`px-2 py-1 rounded-full border text-xs ${
                                            enr.status === "Passed"
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : enr.status === "Failed"
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : "bg-blue-50 text-blue-700 border-blue-200"
                                          }`}
                                        >
                                          {enr.status}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-xs text-gray-500">{new Date(enr.updatedAt).toLocaleDateString()}</TableCell>
                                      <TableCell className="text-right">
                                        {hasPermission("canManageStudents") && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => handleOpenEditEnrollment(enr, student.idNumber)}
                                            title="Edit Enrollment"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center text-xs py-6 text-gray-500">
                                      No enrollment records found for this student.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- STUDENT DIALOG --- */}
      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            <DialogDescription>
              {editingStudent ? "Update student ERD information" : "Add a new student matching the database schema"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>ID Number <span className="text-red-500">*</span></Label>
              <Input
                value={studentFormData.idNumber}
                onChange={(e) => setStudentFormData({ ...studentFormData, idNumber: e.target.value })}
                placeholder="12345678"
                maxLength={8}
                disabled={!!editingStudent}
              />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input
                value={studentFormData.section}
                onChange={(e) => setStudentFormData({ ...studentFormData, section: e.target.value })}
                placeholder="CS-1A"
                maxLength={45}
              />
            </div>
            <div className="space-y-2">
              <Label>First Name <span className="text-red-500">*</span></Label>
              <Input
                value={studentFormData.firstName}
                onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                placeholder="John"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name <span className="text-red-500">*</span></Label>
              <Input
                value={studentFormData.lastName}
                onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                placeholder="Doe"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Year (INT)</Label>
              <select
                value={studentFormData.currentYear}
                onChange={(e) => setStudentFormData({ ...studentFormData, currentYear: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Current Semester (INT)</Label>
              <select
                value={studentFormData.currentSemester}
                onChange={(e) => setStudentFormData({ ...studentFormData, currentSemester: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStudentSubmit} className="bg-indigo-600 hover:bg-indigo-700">
              {editingStudent ? "Update" : "Add"} Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ADD / EDIT ENROLLMENT DIALOG --- */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEnrollment ? "Edit Enrollment Record" : "Add Enrollment Record"}</DialogTitle>
            <DialogDescription>
              {editingEnrollment ? "Editing" : "Adding"} curriculum enrollment for Student ID: <span className="font-mono font-bold text-indigo-600">{selectedStudentForEnrollment}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Year (INT)</Label>
              <select
                value={(enrollmentFormData as any).yearId}
                onChange={(e) =>
                  setEnrollmentFormData({
                    ...enrollmentFormData,
                    yearId: Number(e.target.value),
                  } as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Semester (INT)</Label>
              <select
                value={(enrollmentFormData as any).semesterId}
                onChange={(e) =>
                  setEnrollmentFormData({
                    ...enrollmentFormData,
                    semesterId: Number(e.target.value),
                  } as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Input
                value={(enrollmentFormData as any).courseCode || ""}
                onChange={(e) =>
                  setEnrollmentFormData({
                    ...enrollmentFormData,
                    courseCode: e.target.value,
                  } as any)
                }
                placeholder="e.g. PROG1"
                maxLength={7}
              />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Input
                value={(enrollmentFormData as any).programName || ""}
                onChange={(e) =>
                  setEnrollmentFormData({
                    ...enrollmentFormData,
                    programName: e.target.value,
                  } as any)
                }
                placeholder="e.g. BSCS"
                maxLength={45}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Grade{" "}
                <span className="text-gray-400 text-xs font-normal">
                  (Optional — (Ongoing), R, F, or 1–100)
                </span>
              </Label>
              <Input
                value={enrollmentFormData.grade}
                onChange={(e) =>
                  setEnrollmentFormData({
                    ...enrollmentFormData,
                    grade: e.target.value,
                    status: deriveStatusFromGrade(e.target.value),
                  })
                }
                placeholder="e.g. 85"
                maxLength={9} /* EXACT ERD LIMIT: VARCHAR(9) */
              />
            </div>
            <div className="space-y-2">
              <Label>Status (ENUM)</Label>
              <select
                value={enrollmentFormData.status}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </select>
              <p className="text-xs text-gray-500">
                Status is derived from Grade based on database rules and cannot be edited directly.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEnrollmentSubmit} className="bg-indigo-600 hover:bg-indigo-700">
              {editingEnrollment ? "Update Record" : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}