"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { UploadCloud, Download, Loader2, SquareDashedMousePointer, Flame, CornerDownRight } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"


export default function FinancialStatementAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [availableReports, setAvailableReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("Latest Quarter");
  const [selectedExtraction, setSelectedExtraction] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [csvData, setCsvData] = useState<string[][]>([]);
  const [analysisText, setAnalysisText] = useState("");
  const [analysisSource, setAnalysisSource] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");

  const [isEvaluateDialogOpen, setIsEvaluateDialogOpen] = useState(false);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<object | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";

  const fetchAvailableReports = async () => {
    try {
      const response = await axios.get(`${backendBaseUrl}/api/v1/sources/names`);
      setAvailableReports(response.data?.sources || []);
    } catch (error) {
      console.debug(error);
      toast.error("Failed to retrieve available reports. Please upload a new report to get started!");
    }
  };

  useEffect(() => {
    fetchAvailableReports();
  });

  const clearFileInput = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      toast.warning("No file selected");
      return;
    }

    if (file.type !== "application/pdf") {
      clearFileInput();
      toast.warning("Only PDF files are allowed");
      return;
    }

    setSelectedFile(file);
    toast.info("File selected: " + file.name);
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.warning("No file selected");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("attachments", selectedFile);

    try {
      const uploadResponse = await axios.post(`${backendBaseUrl}/api/v1/sources`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload successful:", uploadResponse.data);
      toast.success("File uploaded successfully!");

    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "An error occurred while uploading the file.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      await fetchAvailableReports();
      clearFileInput();
      setIsUploading(false);
    }
  }

  const handleAnalyzeReport = async () => {
    if (!selectedReport) {
      toast.error("A report must be selected first!");
      return;
    }

    if (!selectedQuarter) {
      toast.error("A quarter must be selected first!");
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisResponse = await axios.post(`${backendBaseUrl}/api/v1/sources/analyze`, JSON.stringify({ report: selectedReport, quarter: selectedQuarter, selected_extraction: selectedExtraction }), {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Analysis successful:", analysisResponse.data);
      toast.success("Analysis completed!");

      setCsvData(analysisResponse.data?.analysis.content || []);
      setAnalysisText(analysisResponse.data?.analysis.analysis || "");
      setAnalysisSource(analysisResponse.data?.analysis.file_name || "");
      setAnalysisDate(analysisResponse.data?.analysis.timestamp || "");
      setIsEvaluateDialogOpen(false);
      setReferenceFile(null);
      setIsEvaluating(false);
      setEvaluationResult(null);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "An error occurred while analyzing the report.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  const escapeValue = (value: string | number) => {
    const stringValue = typeof value !== "string" ? String(value) : value;

    if (/[,"\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleDownloadCSV = () => {
    if (!csvData || csvData.length === 0) {
      toast.error("No CSV data to download.");
      return;
    }

    const csvContent = csvData
      .map((row) => row.map(escapeValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let prefix = "";
    if (analysisSource) {
      prefix = `${analysisSource.split('.')[0]}_`;
    }

    link.download = `${prefix}profit_and_loss.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearReferenceFileInput = () => {
    setReferenceFile(null);

    if (referenceFileInputRef.current) {
      referenceFileInputRef.current.value = "";
    }
  }

  const handleReferenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      toast.warning("No reference CSV file selected");
      return;
    }

    if (file.type !== "text/csv") {
      clearReferenceFileInput();
      toast.warning("Only CSV files are allowed");
      return;
    }

    setReferenceFile(file);
    toast.info("Reference file selected: " + file.name);
  };

  const handleProcessEvaluation = async () => {
    if (!referenceFile) {
      toast.warning("No reference CSV data to process.");
      return;
    }

    setIsEvaluating(true);

    const formData = new FormData();
    formData.append("attachments", referenceFile);
    formData.append("extracted_data", JSON.stringify(csvData));
    formData.append("source", analysisSource);

    try {
      const evalResponse = await axios.post(`${backendBaseUrl}/api/v1/results/evaluate`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setEvaluationResult(evalResponse.data);

      console.log("Evaluation completed:", evalResponse.data);
      toast.success("Evaluation completed!");

    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "An error occurred during evaluation.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setReferenceFile(null);
      clearReferenceFileInput();
      setIsEvaluating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Financial Statement Analyzer</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload Financial Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="flex-grow" />
            <Button onClick={handleFileUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analyze Financial Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-select">Select Report</Label>
              <Select onValueChange={setSelectedReport} disabled={availableReports.length < 1}>
                <SelectTrigger id="report-select">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {availableReports.map((report) => (
                    <SelectItem key={report} value={report}>
                      {report}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter-select">Select Quarter</Label>
              <Select onValueChange={setSelectedQuarter} defaultValue={selectedQuarter}>
                <SelectTrigger id="quarter-select">
                  <SelectValue placeholder="Select a quarter" />
                </SelectTrigger>
                <SelectContent>
                  {["Latest Quarter"].map((quarter) => (
                    <SelectItem key={quarter} value={quarter}>
                      {quarter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="selectedExtraction" checked={selectedExtraction} onCheckedChange={(checked) => setSelectedExtraction(checked === true)} />
            <Label htmlFor="selectedExtraction">
              Enable Selected Item Extraction
              <span className="ml-1 text-sm text-muted-foreground">
                (When enabled, only Gross Profit, Profit Before Tax and Profit for the Period will be extracted)
              </span>
            </Label>
          </div>
          <Button onClick={handleAnalyzeReport} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generate Profit and Loss Statement...
              </>
            ) : (
              <>
                <SquareDashedMousePointer className="mr-2 h-4 w-4" /> Generate Profit and Loss Statement
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Profit and Loss Statement
              <div className="flex justify-end items-center space-x-4">
                <Button onClick={handleDownloadCSV} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Download CSV
                </Button>
                <Button onClick={() => setIsEvaluateDialogOpen(true)} variant="default" size="sm">
                  <Flame className="mr-2 h-4 w-4" /> Evaluate
                </Button>
              </div>
            </CardTitle>
            {analysisSource && (
              <div className="flex items-center">
                <Label>Source Name: </Label>
                <span className="ml-1 text-sm text-muted-foreground">{analysisSource}</span>
              </div>
            )}
            {analysisDate && (
              <div className="flex items-center">
                <Label>Generated on: </Label>
                <span className="ml-1 text-sm text-muted-foreground">{analysisDate}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData[0].map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {analysisText && (
              <div className="flex flex-col items-start mt-5 space-y-2">
                <Label>Analysis: </Label>
                <span className="text-sm text-muted-foreground">{analysisText}</span>
                <ReactMarkdown className="text-sm text-muted-foreground">{analysisText}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isEvaluateDialogOpen} onOpenChange={setIsEvaluateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluate Results</DialogTitle>
            <DialogDescription>
              Upload a reference CSV with column names matching the extracted profit and loss statement data. Line items can vary, but common items must have identical names.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                Reference CSV
              </Label>
              <Input ref={referenceFileInputRef} id="file" type="file" accept=".csv" onChange={handleReferenceFileChange} className="col-span-3" />
            </div>
            {evaluationResult && (
              <div className="overflow-auto max-h-96">
                <h3 className="font-semibold mb-2">Evaluation Results</h3>
                <pre className="p-4 bg-gray-100 rounded-md text-sm">
                  {JSON.stringify(evaluationResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleProcessEvaluation} disabled={!referenceFile || isEvaluating}>
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CornerDownRight className="mr-2 h-4 w-4" /> Process
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

