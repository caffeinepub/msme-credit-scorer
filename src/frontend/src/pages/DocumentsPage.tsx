import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { File, FileText, FileType, Image, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "../components/PageLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAppContext } from "../hooks/useAppContext";
import { useT } from "../hooks/useT";
import { addDocument, deleteDocument, getDocuments } from "../lib/store";
import type { Document } from "../lib/types";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileType;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function DocumentsPage() {
  const { user } = useAppContext();
  const t = useT();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setDocs(getDocuments(user.id));
  }, [user]);

  function processFiles(files: FileList | File[]) {
    if (!user) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024;

    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: Only PDF, JPG, and PNG allowed`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large (max 5MB)`);
        continue;
      }

      const doc: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.id,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
      addDocument(doc);
    }

    setDocs(getDocuments(user.id));
    toast.success(`${Array.from(files).length} file(s) added`);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleDelete(id: string) {
    deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document removed");
  }

  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="space-y-6 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {t("documents")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload KYC documents, financial statements, and business
              certificates
            </p>
          </div>

          {/* Upload zone */}
          <Card>
            <CardContent className="pt-6 pb-6">
              <div
                data-ocid="documents.dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/40 hover:bg-muted/30",
                )}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      isDragging ? "bg-primary/20" : "bg-muted",
                    )}
                  >
                    <Upload
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {t("dragDropText")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG — max 5MB each
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid="documents.upload_button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Browse Files
                  </Button>
                </div>
                <label className="sr-only" htmlFor="doc-file-input">
                  Select files to upload
                </label>
                <input
                  id="doc-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileInput}
                  className="sr-only"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recommended docs */}
          <div className="flex flex-wrap gap-2">
            {[
              "GST Certificate",
              "Bank Statement",
              "Aadhaar Card",
              "PAN Card",
              "Trade License",
              "Balance Sheet",
            ].map((name) => (
              <Badge key={name} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>

          {/* Document list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Uploaded Documents
                {docs.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {docs.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent data-ocid="documents.list">
              {docs.length === 0 ? (
                <div
                  data-ocid="documents.empty_state"
                  className="py-10 text-center"
                >
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("noDocuments")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc, idx) => {
                    const FileIcon = getFileIcon(doc.mimeType);
                    return (
                      <div
                        key={doc.id}
                        data-ocid={`documents.item.${idx + 1}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)} ·{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`documents.delete_button.${idx + 1}`}
                          onClick={() => handleDelete(doc.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </ProtectedRoute>
  );
}
