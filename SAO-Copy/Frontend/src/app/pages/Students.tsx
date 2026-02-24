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
}

// ERD: enrollment (Updated to match exact columns)
interface Enrollment {
  id: number; // ID INT
  grade: string; // Grade VARCHAR(9)
  status: string; // Status ENUM
  createdAt: string; // Created_At DATETIME
  updatedAt: string; // Updated_At DATETIME
  createdBy: string; // Created_By VARCHAR(45)
  updatedBy: string; // Updated_By VARCHAR(45)
  studentId: string; // STUDENT_ID VARCHAR (FK to student)
  curriculumId: number; // CURRICULUM_ID INT (FK to curriculum)
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
    status: "Enrolled", // Default ENUM value
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

  useEffect(() => {
    const storedStudents = localStorage.getItem("students");
    if (storedStudents) setStudents(JSON.parse(storedStudents));

    const storedEnrollments = localStorage.getItem("enrollments");
    if (storedEnrollments) {
      setEnrollments(JSON.parse(storedEnrollments));
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

  const handleDeleteStudent = (student: Student) => {
    if (window.confirm(`Are you sure you want to move ${student.fullName} to the Recycle Bin?`)) {
      const timestamp = new Date().toISOString();
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

  const handleStudentSubmit = () => {
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

    if (studentFormData.idNumber.length > 8) {
      toast.error("ID Number cannot exceed 8 characters.");
      addAuditLog({
        action: "Validation Error",
        user: user?.email || "Unknown",
        status: "Error",
        details: `Student form submission failed: ID Number "${studentFormData.idNumber}" exceeds 8-character limit`,
        category: "Error",
      });
      return;
    }

    const timestamp = new Date().toISOString();
    const currentUser = user?.email || "Unknown";
    const generatedFullName = `${studentFormData.firstName.trim()} ${studentFormData.lastName.trim()}`;

    if (editingStudent) {
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
      if (students.some(s => s.idNumber === studentFormData.idNumber)) {
        toast.error("A student with this ID Number already exists!");
        addAuditLog({
          action: "Duplicate ID Error",
          user: currentUser,
          status: "Error",
          details: `Student creation failed: ID Number "${studentFormData.idNumber}" already exists in the data store`,
          category: "Error",
        });
        return;
      }

      const newStudent: Student = {
        id: Date.now(),
        idNumber: studentFormData.idNumber.trim(),
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
      toast.success("Student added successfully");
      addAuditLog({
        action: "CREATE Student",
        user: currentUser,
        status: "Success",
        details: `Created new student record: ${generatedFullName} (ID: ${studentFormData.idNumber}, Section: ${studentFormData.section})`,
        category: "CRUD",
      });
    }
    setStudentDialogOpen(false);
  };

  // --- ENROLLMENT HANDLERS ---
  const handleOpenAddEnrollment = (studentIdNumber: string) => {
    setEditingEnrollment(null);
    setSelectedStudentForEnrollment(studentIdNumber);
    setEnrollmentFormData({ curriculumId: 1, grade: "", status: "Enrolled" });
    setEnrollmentDialogOpen(true);
  };

  const handleOpenEditEnrollment = (enrollment: Enrollment, studentIdNumber: string) => {
    setEditingEnrollment(enrollment);
    setSelectedStudentForEnrollment(studentIdNumber);
    setEnrollmentFormData({
      curriculumId: enrollment.curriculumId,
      grade: enrollment.grade || "",
      status: enrollment.status,
    });
    setEnrollmentDialogOpen(true);
  };

  const handleEnrollmentSubmit = () => {
    if (!selectedStudentForEnrollment) return;
    
    if (enrollmentFormData.grade.length > 9) {
      toast.error("Grade cannot exceed 9 characters.");
      addAuditLog({
        action: "Validation Error",
        user: user?.email || "Unknown",
        status: "Error",
        details: `Enrollment form failed: Grade "${enrollmentFormData.grade}" exceeds VARCHAR(9) limit`,
        category: "Error",
      });
      return;
    }

    const timestamp = new Date().toISOString();
    const currentUser = user?.email || "Unknown";

    if (editingEnrollment) {
      const updatedEnrollments = enrollments.map((e) =>
        e.id === editingEnrollment.id
          ? {
              ...e,
              grade: enrollmentFormData.grade.trim(),
              status: enrollmentFormData.status,
              curriculumId: Number(enrollmentFormData.curriculumId),
              updatedAt: timestamp,
              updatedBy: currentUser,
            }
          : e
      );

      saveEnrollments(updatedEnrollments);
      toast.success("Enrollment record updated successfully");
      addAuditLog({
        action: "UPDATE Enrollment",
        user: currentUser,
        status: "Success",
        details: `Updated enrollment for student ID ${selectedStudentForEnrollment} — Curriculum: ${enrollmentFormData.curriculumId}, Grade: ${enrollmentFormData.grade}, Status: ${enrollmentFormData.status}`,
        category: "CRUD",
      });
    } else {
      const newEnrollment: Enrollment = {
        id: Date.now(),
        grade: enrollmentFormData.grade.trim(),
        status: enrollmentFormData.status,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: currentUser,
        updatedBy: currentUser,
        studentId: selectedStudentForEnrollment,
        curriculumId: Number(enrollmentFormData.curriculumId)
      };

      saveEnrollments([...enrollments, newEnrollment]);
      toast.success("Enrollment record added successfully");
      addAuditLog({
        action: "CREATE Enrollment",
        user: currentUser,
        status: "Success",
        details: `Created enrollment for student ID ${selectedStudentForEnrollment} — Curriculum: ${enrollmentFormData.curriculumId}, Status: ${enrollmentFormData.status}`,
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
                                  <TableHead className="text-xs">Curriculum ID</TableHead>
                                  <TableHead className="text-xs">Grade</TableHead>
                                  <TableHead className="text-xs">Status</TableHead>
                                  <TableHead className="text-xs">Updated At</TableHead>
                                  <TableHead className="text-xs">Updated By</TableHead>
                                  <TableHead className="text-xs text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {studentEnrollments.length > 0 ? (
                                  studentEnrollments.map(enr => (
                                    <TableRow key={enr.id}>
                                      <TableCell className="font-mono text-xs text-gray-500">{enr.id}</TableCell>
                                      <TableCell className="text-xs font-medium text-indigo-600">{enr.curriculumId}</TableCell>
                                      <TableCell className="text-xs font-semibold">{enr.grade || "N/A"}</TableCell>
                                      <TableCell className="text-xs">
                                        <span className={`px-2 py-1 rounded-full border ${enr.status === 'Enrolled' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                          {enr.status}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-xs text-gray-500">{new Date(enr.updatedAt).toLocaleDateString()}</TableCell>
                                      <TableCell className="text-xs text-gray-500">{enr.updatedBy}</TableCell>
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
              <Label>Curriculum ID (INT)</Label>
              <Input
                type="number"
                min="1"
                value={enrollmentFormData.curriculumId}
                onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, curriculumId: Number(e.target.value) })}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Grade <span className="text-gray-400 text-xs font-normal">(Optional)</span></Label>
              <Input
                value={enrollmentFormData.grade}
                onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, grade: e.target.value })}
                placeholder="1.25"
                maxLength={9} /* EXACT ERD LIMIT: VARCHAR(9) */
              />
            </div>
            <div className="space-y-2">
              <Label>Status (ENUM)</Label>
              <select
                value={enrollmentFormData.status}
                onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Enrolled">Enrolled</option>
                <option value="Completed">Completed</option>
                <option value="Dropped">Dropped</option>
                <option value="Failed">Failed</option>
              </select>
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