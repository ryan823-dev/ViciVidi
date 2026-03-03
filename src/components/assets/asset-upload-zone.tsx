"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadProgressList } from "./upload-progress";
import { createAssetUploadSession, confirmAssetUpload, abortAssetUpload } from "@/actions/assets";
import type { UploadProgress, AssetWithFolder } from "@/types/assets";

interface AssetUploadZoneProps {
  folderId?: string | null;
  onUploadComplete?: (assets: AssetWithFolder[]) => void;
  className?: string;
  compact?: boolean;
}

// 单文件最大 4GB（OSS 单次 PUT 限制为 5GB，留点余量）
const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024;
// 单批次最多 20 个文件
const MAX_BATCH_SIZE = 20;
// 最大并发上传数
const MAX_CONCURRENT_UPLOADS = 3;

export function AssetUploadZone({
  folderId,
  onUploadComplete,
  className,
  compact = false,
}: AssetUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllers = useRef<Map<string, XMLHttpRequest>>(new Map());

  // 验证文件
  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} 超过 4GB 限制`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > MAX_BATCH_SIZE) {
      toast.warning(`单次最多上传 ${MAX_BATCH_SIZE} 个文件，已自动截取前 ${MAX_BATCH_SIZE} 个`);
      validFiles.splice(MAX_BATCH_SIZE);
    }

    if (errors.length > 0) {
      toast.error(errors.slice(0, 3).join("\n"));
    }

    return validFiles;
  }, []);

  // 上传单个文件到 OSS
  const uploadFileToOSS = useCallback(
    (file: File, presignedUrl: string, assetId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortControllers.current.set(assetId, xhr);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploads((prev) =>
              prev.map((u) =>
                u.assetId === assetId ? { ...u, progress, status: "uploading" } : u
              )
            );
          }
        };

        xhr.onload = () => {
          abortControllers.current.delete(assetId);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          abortControllers.current.delete(assetId);
          reject(new Error("网络错误"));
        };

        xhr.onabort = () => {
          abortControllers.current.delete(assetId);
          reject(new Error("已取消"));
        };

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });
    },
    []
  );

  // 处理上传
  const handleUpload = useCallback(
    async (files: File[]) => {
      const validFiles = validateFiles(files);
      if (validFiles.length === 0) return;

      setIsUploading(true);

      try {
        // 1. 创建上传会话
        const fileInputs = validFiles.map((file) => ({
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          folderId,
        }));

        const sessions = await createAssetUploadSession(fileInputs);

        // 2. 初始化上传进度状态
        const initialUploads: UploadProgress[] = sessions.map((session, index) => ({
          assetId: session.assetId,
          fileName: validFiles[index].name,
          fileSize: validFiles[index].size,
          progress: 0,
          status: "pending" as const,
        }));

        setUploads(initialUploads);

        // 3. 并发控制上传
        const completedAssets: AssetWithFolder[] = [];
        let currentIndex = 0;

        const uploadNext = async (): Promise<void> => {
          while (currentIndex < validFiles.length) {
            const index = currentIndex++;
            const file = validFiles[index];
            const session = sessions[index];

            // 更新状态为上传中
            setUploads((prev) =>
              prev.map((u) =>
                u.assetId === session.assetId ? { ...u, status: "uploading" } : u
              )
            );

            try {
              // 上传到 OSS
              await uploadFileToOSS(file, session.presignedUrl, session.assetId);

              // 更新状态为确认中
              setUploads((prev) =>
                prev.map((u) =>
                  u.assetId === session.assetId
                    ? { ...u, progress: 100, status: "confirming" }
                    : u
                )
              );

              // 确认上传完成
              const asset = await confirmAssetUpload(session.assetId);
              completedAssets.push(asset);

              // 更新状态为完成
              setUploads((prev) =>
                prev.map((u) =>
                  u.assetId === session.assetId ? { ...u, status: "completed" } : u
                )
              );
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "上传失败";

              // 更新状态为失败
              setUploads((prev) =>
                prev.map((u) =>
                  u.assetId === session.assetId
                    ? { ...u, status: "failed", error: errorMessage }
                    : u
                )
              );

              // 中断上传记录
              try {
                await abortAssetUpload(session.assetId);
              } catch {
                // 忽略中断失败
              }
            }
          }
        };

        // 启动并发上传
        const workers = Array(Math.min(MAX_CONCURRENT_UPLOADS, validFiles.length))
          .fill(null)
          .map(() => uploadNext());

        await Promise.all(workers);

        // 4. 上传完成回调
        if (completedAssets.length > 0) {
          onUploadComplete?.(completedAssets);
          toast.success(`成功上传 ${completedAssets.length} 个文件`);
        }

        // 5. 清理完成的上传（延迟清理，让用户看到结果）
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.status !== "completed"));
        }, 3000);
      } catch (error) {
        toast.error("创建上传会话失败");
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [folderId, onUploadComplete, uploadFileToOSS, validateFiles]
  );

  // 取消上传
  const handleCancel = useCallback((assetId: string) => {
    const xhr = abortControllers.current.get(assetId);
    if (xhr) {
      xhr.abort();
    }
  }, []);

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [handleUpload]
  );

  // 点击选择文件
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleUpload(files);
      }
      // 重置 input 以便可以重复选择同一文件
      e.target.value = "";
    },
    [handleUpload]
  );

  // 紧凑模式（按钮形式）
  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button onClick={handleClick} disabled={isUploading}>
          <Upload className="h-4 w-4 mr-2" />
          上传素材
        </Button>
      </>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 拖拽区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "p-4 rounded-full",
              isDragOver ? "bg-primary/10" : "bg-muted"
            )}
          >
            {isDragOver ? (
              <FolderUp className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium">
              {isDragOver ? "松开鼠标上传文件" : "拖拽文件到这里，或点击选择"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              支持所有类型文件，单文件最大 4GB，单次最多 20 个
            </p>
          </div>
        </div>
      </div>

      {/* 上传进度列表 */}
      {uploads.length > 0 && (
        <UploadProgressList uploads={uploads} onCancel={handleCancel} />
      )}
    </div>
  );
}
