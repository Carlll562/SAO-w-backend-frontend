import React, { useState, useEffect } from "react";
import { StatCard } from "../components/StatCard";
import { Users, BookOpen, CheckCircle, TrendingUp, History, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { getAuditLogs, AuditLog, useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

// Sample data mirrored from AuditLogs for the Recent Activities section
// const recentActivities = [
//   {
//     id: "1",
//     action: "Grade Updated",
//     user: "John Smith",
//     target: "CS101 - Final Exam",
//     timestamp: "2024-03-20 14:30:22",
//     status: "success",
//   },
//   ...
// ];

export function Dashboard() {
  const { hasPermission } = useAuth();
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeEnrollments: 0,
    gradesSubmitted: 0,
    completionRate: 0,
  });
  
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [gradeSubmissionData, setGradeSubmissionData] = useState<any[]>([]);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load data from the new ERD-aligned localStorage keys
    const allStudents = JSON.parse(localStorage.getItem("students") || "[]");
    // Filter out soft-deleted students for active stats
    const students = allStudents.filter((s: any) => !s.isDeleted);

    const allEnrollments = JSON.parse(localStorage.getItem("enrollments") || "[]");
    // Filter enrollments to only include those from active students
    const activeStudentIds = new Set(students.map((s: any) => s.idNumber));
    const enrollments = allEnrollments.filter((e: any) => activeStudentIds.has(e.studentId));
    
    // Load recent audit logs
    const logs = getAuditLogs().slice(0, 5);
    setRecentActivities(logs);
    
    // 2. Calculate Stats using the new data model
    // Status now mirrors DB enum: 'Active' | 'Passed' | 'Failed'
    // Keep backward compatibility for any legacy values ('Enrolled', 'Completed')
    const activeEnrolledCount = enrollments.filter(
      (e: any) => e.status === "Active" || e.status === "Enrolled"
    ).length;
    
    // Check if grade exists and isn't just an empty string
    const gradesSubmittedCount = enrollments.filter((e: any) => e.grade && e.grade.trim() !== "").length;
    
    // Calculate completion rate: any non-active enrollment is considered completed
    const completedCount = enrollments.filter(
      (e: any) =>
        e.status === "Passed" ||
        e.status === "Failed" ||
        e.status === "Completed"
    ).length;
    const completionRateCalc = enrollments.length > 0 
      ? Math.round((completedCount / enrollments.length) * 100) 
      : 0;
    
    setStats({
      totalStudents: students.length,
      activeEnrollments: activeEnrolledCount,
      gradesSubmitted: gradesSubmittedCount,
      completionRate: completionRateCalc,
    });

    // 3. Calculate Enrollment Trend (Last 6 months) using the new `createdAt` property
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(currentMonth - 5 + i);
      return { month: months[d.getMonth()], year: d.getFullYear(), index: d.getMonth() };
    });

    const enrollmentsByMonth = last6Months.map(m => {
      // Count how many enrollments were created in this specific month
      const count = enrollments.filter((e: any) => {
        const date = new Date(e.createdAt);
        return date.getMonth() === m.index && date.getFullYear() === m.year;
      }).length;
      return { month: m.month, enrolled: count };
    });
    setEnrollmentData(enrollmentsByMonth);

    // 4. Calculate Grade Submission by Curriculum ID (since courseCode was removed)
    const curriculumCounts: Record<string, number> = {};
    
    enrollments.forEach((e: any) => {
      // Only count it if a grade has been submitted
      if (e.grade && e.grade.trim() !== "") {
        const currName = `Curriculum ${e.curriculumId}`;
        curriculumCounts[currName] = (curriculumCounts[currName] || 0) + 1;
      }
    });

    const currData = Object.keys(curriculumCounts).map(curr => ({
      category: curr,
      submitted: curriculumCounts[curr]
    }));
    
    // If no data, show empty placeholders
    if (currData.length === 0) {
      setGradeSubmissionData([
        { category: "No Data", submitted: 0 }
      ]);
    } else {
      setGradeSubmissionData(currData);
    }
  }, []);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setBackendStatus(`OK (last check: ${new Date(data.timestamp).toLocaleTimeString()})`);
        setBackendError(null);
      })
      .catch((err) => {
        setBackendStatus(null);
        setBackendError(`Error: ${err.message}`);
      });
  }, []);

  if (!hasPermission("canViewDashboard")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You do not have permission to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Registrar Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's an overview of the academic system.
        </p>
        <p className="text-sm mt-1">
          <span className="font-medium">Backend status:</span>{" "}
          {backendStatus
            ? <span className="text-green-700">{backendStatus}</span>
            : backendError
              ? <span className="text-red-600">{backendError}</span>
              : <span className="text-gray-500">Checking...</span>}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          change="Registered students"
          icon={Users}
          trend={stats.totalStudents > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Active Enrollments"
          value={stats.activeEnrollments}
          change="Status: 'Enrolled'"
          icon={BookOpen}
          trend={stats.activeEnrollments > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Grades Submitted"
          value={stats.gradesSubmitted}
          change="Across all records"
          icon={CheckCircle}
          trend={stats.gradesSubmitted > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          change="Status: 'Completed'"
          icon={TrendingUp}
          trend={stats.completionRate > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 min-w-0 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend (Last 6 Months)</h2>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enrolled" stroke="#6366f1" strokeWidth={2} name="Total Enrollments" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Submission by Curriculum */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 min-w-0 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Submissions by Curriculum</h2>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeSubmissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="submitted" fill="#6366f1" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}