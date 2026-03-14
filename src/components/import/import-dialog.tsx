'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  errors: Array<{
    row: number
    domain: string
    error: string
  }>
}

export function ImportDialog() {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)
    setResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const data = await response.json()
      setResult(data)

      toast.success(`成功导入 ${data.success} 家公司`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : '导入失败')
    } finally {
      setUploading(false)
    }
  }

  const resetDialog = () => {
    setOpen(false)
    setResult(null)
    setProgress(0)
    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetDialog()
    }}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="mr-2 h-4 w-4" />
        批量导入
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>批量导入公司</DialogTitle>
          <DialogDescription>
            上传 CSV 或 Excel 文件批量添加公司。文件需要包含 domain、website 或 company 列。
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="py-8">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">正在处理文件...</p>
                  <Progress value={progress} className="w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">点击或拖拽文件到此处</p>
                    <p className="text-sm text-muted-foreground">
                      支持 CSV 或 Excel 格式
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">CSV 格式示例：</p>
              <code className="text-xs block bg-background p-2 rounded">
                domain,name,industry<br/>
                acme.com,Acme Corp,Technology<br/>
                example.com,Example Inc,SaaS
              </code>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-600">
                    {result.success}
                  </div>
                  <div className="text-xs text-green-600">成功</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {result.duplicates}
                  </div>
                  <div className="text-xs text-yellow-600">重复</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-600">
                    {result.failed}
                  </div>
                  <div className="text-xs text-red-600">失败</div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">错误详情：</p>
                  <div className="space-y-1">
                    {result.errors.map((error, i) => (
                      <div
                        key={i}
                        className="text-xs text-destructive bg-destructive/10 p-2 rounded"
                      >
                        行 {error.row}: {error.domain} - {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={resetDialog}>完成</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}