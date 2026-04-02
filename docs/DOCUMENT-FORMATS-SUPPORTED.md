# Vertax 支持的文档格式

## 概述

Vertax 支持多种常见文档格式的处理，包括大文件微服务处理和小文件浏览器端处理。

## 支持的格式

### 1. PDF 文档
- **MIME 类型**: `application/pdf`
- **扩展名**: `.pdf`
- **处理方式**: 微服务 / 浏览器端
- **使用库**: `pdf-parse`
- **说明**: 支持多页 PDF，提取全部文本内容

### 2. Word 文档 ✅
- **MIME 类型**: 
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
  - `application/msword` (.doc)
- **扩展名**: `.docx`, `.doc`
- **处理方式**: 微服务 / 浏览器端
- **使用库**: `mammoth`
- **说明**: 支持新旧两种 Word 格式

### 3. PowerPoint 演示文稿 ✅ NEW
- **MIME 类型**:
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation` (.pptx)
  - `application/vnd.ms-powerpoint` (.ppt)
- **扩展名**: `.pptx`, `.ppt`
- **处理方式**: 微服务
- **使用库**: `node-pptx-parser`
- **说明**: 提取所有幻灯片的文本和备注

### 4. Excel 电子表格 ✅ NEW
- **MIME 类型**:
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
  - `application/vnd.ms-excel` (.xls)
  - `text/spreadsheet`
- **扩展名**: `.xlsx`, `.xls`
- **处理方式**: 微服务
- **使用库**: `xlsx`
- **说明**: 提取所有工作表的数据，保留工作表名称

### 5. Markdown 文档 ✅
- **MIME 类型**: `text/markdown`
- **扩展名**: `.md`, `.markdown`
- **处理方式**: 微服务 / 浏览器端
- **说明**: 直接读取文本内容

### 6. 纯文本文件 ✅
- **MIME 类型**: `text/plain`
- **扩展名**: `.txt`
- **处理方式**: 微服务 / 浏览器端
- **说明**: UTF-8 编码文本

### 7. CSV 文件 ✅
- **MIME 类型**: `text/csv`
- **扩展名**: `.csv`
- **处理方式**: 微服务 / 浏览器端
- **说明**: 逗号分隔值文件

### 8. 图片文件（OCR）✅
- **MIME 类型**:
  - `image/png`, `image/jpeg`, `image/jpg`
  - `image/tiff`, `image/bmp`, `image/webp`
- **扩展名**: `.png`, `.jpg`, `.jpeg`, `.tiff`, `.bmp`, `.webp`
- **处理方式**: 微服务 OCR
- **使用库**: `tesseract.js`, `sharp`
- **说明**: 支持中英文 OCR 文字识别

### 9. 音视频文件
- **MIME 类型**: 各种 audio/* 和 video/*
- **处理方式**: AssemblyAI（需配置 API Key）
- **说明**: 语音识别和转录

## 处理方式选择

系统根据以下规则自动选择处理方式：

### 浏览器端处理（小文件 < 8MB）
- PDF 文档
- Word 文档
- Markdown
- 纯文本
- CSV

### 微服务处理（大文件 > 8MB）
- PDF 文档
- Word 文档
- **PowerPoint 演示文稿**
- **Excel 电子表格**
- Markdown
- 纯文本
- CSV
- 图片（OCR）

### 第三方 API 处理
- 音视频文件 → AssemblyAI

## 分块策略

所有提取的文本会自动分块，以便知识引擎使用：

- **每块大小**: 1000 字符
- **重叠**: 200 字符
- **分块边界**: 优先在段落/句子边界分割
- **Token 估算**: 中文 1.5 字符/token，英文 4 字符/token

## 新增格式支持

如需支持新的文档格式，请修改：

1. **微服务处理器**: `processor-service/src/processors/document.js`
2. **主应用配置**: `src/lib/processing-service.ts`
3. **添加依赖**: `processor-service/package.json`
4. **更新文档**: `docs/DOCUMENT-FORMATS-SUPPORTED.md`

## 依赖项

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "node-pptx-parser": "^1.0.0",
  "xlsx": "^0.18.5",
  "sharp": "^0.33.2",
  "tesseract.js": "^5.0.4"
}
```

## 测试

使用以下命令测试微服务集成：

```bash
bash scripts/test-microservice-integration.sh
```

## 故障排除

### 文档解析失败
- 检查文件格式是否损坏
- 确认 MIME 类型正确
- 查看 Railway 日志

### OCR 识别不准确
- 确保图片清晰度足够
- 检查文字方向是否正确
- 考虑预处理图片（二值化、去噪）

### PPT/Excel 解析错误
- 确认是标准 Office Open XML 格式
- 检查文件是否加密
- 验证文件完整性
