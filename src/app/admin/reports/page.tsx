"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoading } from "@/hooks/use-loading";
import { useToast } from "@/hooks/use-toast";
import { Database, Audit } from "@/lib/database";
import { reportGenerator } from "@/lib/report-generator";
import { csvExporter } from "@/lib/csv-exporter";
import AdminLayout from "@/components/admin/admin-layout";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Send,
  FileCheck,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { CardSkeleton } from "@/components/ui/loader";

interface Report {
  id: string;
  auditId: string;
  auditTitle: string;
  title: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  preparedBy: string;
  preparedByName: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  findings: number;
  summary: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const { toast } = useToast();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);

  const [newReport, setNewReport] = useState({
    auditId: "",
    title: "",
    summary: "",
    findings: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"];
    if (!adminRoles.includes(session.user.role)) {
      router.push("/client");
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    startLoading("Loading reports...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const allAudits = Database.getAudits();
      setAudits(allAudits);

      // Fetch reports from API
      const response = await fetch("/api/reports");
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      stopLoading();
    }
  };

  const handleCreateReport = async () => {
    if (!newReport.auditId || !newReport.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    startLoading("Creating report...");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newReport.title,
          auditId: newReport.auditId,
          reportType: "audit",
          content: newReport.summary,
          findings: newReport.findings
            ? newReport.findings.split(",").map((f) => f.trim())
            : [],
          recommendations: [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Report created successfully",
        });
        setIsCreateDialogOpen(false);
        setNewReport({
          auditId: "",
          title: "",
          summary: "",
          findings: "",
        });
        // Reload reports to show the new one
        await loadData();
      } else {
        toast({
          title: "Error",
          description: `Failed to create report: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating report:", error);
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      });
    } finally {
      stopLoading();
    }
  };

  const handleExportReportPDF = (report: Report) => {
    try {
      const pdf = reportGenerator.generateAuditReport({
        title: report.title,
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        includeCharts: true,
        includeDetails: true,
      });
      pdf.save(
        `${report.title.replace(/\s+/g, "-").toLowerCase()}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      toast({
        title: "Success",
        description: "Report exported as PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportReportCSV = (report: Report) => {
    try {
      const csvContent = [
        ["Report Title", report.title],
        ["Audit", report.auditTitle],
        ["Status", report.status],
        ["Prepared By", report.preparedByName],
        ["Created At", new Date(report.createdAt).toLocaleString()],
        ["Findings", report.findings.toString()],
        ["Summary", report.summary],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${report.title.replace(/\s+/g, "-").toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();

      toast({
        title: "Success",
        description: "Report exported as CSV",
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "submitted":
        return <Send className="h-4 w-4" />;
      case "draft":
        return <Edit className="h-4 w-4" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100 hover:bg-green-200";
      case "submitted":
        return "text-blue-600 bg-blue-100 hover:bg-blue-200";
      case "draft":
        return "text-gray-600 bg-gray-100 hover:bg-gray-200";
      case "rejected":
        return "text-red-600 bg-red-100 hover:bg-red-200";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.auditTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === "all" || report.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  if (status === "loading" || isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!session) return null;

  const canSubmitReports = session.user.permissions.includes("submit_reports");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Audit Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, submit, and review audit reports
            </p>
          </div>
          {canSubmitReports && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    Create New Report
                  </DialogTitle>
                  <DialogDescription>
                    Document your audit findings and recommendations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="audit">Select Audit *</Label>
                    <select
                      id="audit"
                      aria-label="Select audit for report"
                      value={newReport.auditId}
                      onChange={(e) =>
                        setNewReport({ ...newReport, auditId: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select an audit...</option>
                      {audits.map((audit) => (
                        <option key={audit.id} value={audit.id}>
                          {audit.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportTitle">Report Title *</Label>
                    <Input
                      id="reportTitle"
                      placeholder="e.g., Security Assessment Report - Q1 2024"
                      value={newReport.title}
                      onChange={(e) =>
                        setNewReport({ ...newReport, title: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Executive Summary *</Label>
                    <Textarea
                      id="summary"
                      placeholder="Provide a high-level summary of the audit findings..."
                      value={newReport.summary}
                      onChange={(e) =>
                        setNewReport({ ...newReport, summary: e.target.value })
                      }
                      rows={5}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="findings">Key Findings</Label>
                    <Textarea
                      id="findings"
                      placeholder="List the main findings and observations..."
                      value={newReport.findings}
                      onChange={(e) =>
                        setNewReport({ ...newReport, findings: e.target.value })
                      }
                      rows={4}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={handleCreateReport}>
                    Save as Draft
                  </Button>
                  <Button
                    onClick={handleCreateReport}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Create & Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {reports.length}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {reports.filter((r) => r.status === "draft").length}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {reports.filter((r) => r.status === "submitted").length}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {reports.filter((r) => r.status === "approved").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search reports"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="data-[state=active]:bg-gray-500 data-[state=active]:text-white"
            >
              Drafts
            </TabsTrigger>
            <TabsTrigger
              value="submitted"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Submitted
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Approved
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredReports.map((report, index) => (
                <Card
                  key={report.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => router.push(`/admin/reports/${report.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={getStatusColor(report.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(report.status)}
                          <span className="capitalize">{report.status}</span>
                        </div>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-orange-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportReportPDF(report);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportReportCSV(report);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export as CSV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-orange-600 transition-colors line-clamp-1">
                        {report.title}
                      </CardTitle>
                      <p className="text-sm text-orange-600 font-medium mt-1">
                        {report.auditTitle}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.summary}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <FileCheck className="h-4 w-4 mr-1" />
                        <span>{report.findings} findings</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{report.preparedByName}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created:{" "}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      {report.submittedAt && (
                        <div className="flex items-center">
                          <Send className="h-3 w-3 mr-1" />
                          Submitted:{" "}
                          {new Date(report.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                      {report.approvedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved:{" "}
                          {new Date(report.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-orange-600"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {report.status === "draft" && canSubmitReports && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {report.status === "submitted" &&
                        session.user.role === "management" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Create your first report to get started"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
