import sys
path = r'D:\qoder\vertax\src\app\api\assets\web-import\route.ts'
with open(path, 'rb') as f:
    data = f.read()

# 1. Add isLowValuePage helper after the imports block (after the last import line)
helper = (
    b'\r\n'
    b'// URL patterns that indicate low-value pages (legal/nav noise)\r\n'
    b'const LOW_VALUE_URL_PATTERNS = [\r\n'
    b'  /\\/privacy/i, /\\/terms/i, /\\/cookie/i, /\\/legal/i, /\\/gdpr/i,\r\n'
    b'  /\\/disclaimer/i, /\\/imprint/i, /\\/unsubscribe/i,\r\n'
    b'  /\\/sitemap/i, /\\/feed/i, /\\/rss/i,\r\n'
    b'  /\\/tag\\//i, /\\/tags\\//i, /\\/author\\//i,\r\n'
    b'  /\\/wp-content/i, /\\/cdn-cgi/i,\r\n'
    b'];\r\n'
    b'\r\n'
    b'function isLowValuePage(url: string, content: string): boolean {\r\n'
    b'  const pathname = new URL(url).pathname.toLowerCase();\r\n'
    b'  if (LOW_VALUE_URL_PATTERNS.some((re) => re.test(pathname))) return true;\r\n'
    b'  if (content.trim().length < 200) return true;\r\n'
    b'  return false;\r\n'
    b'}\r\n'
)

# Insert after the last import line (before `export const maxDuration`)
insert_before = b'export const maxDuration'
if insert_before not in data:
    print('NOT FOUND: export const maxDuration')
    sys.exit(1)
data = data.replace(insert_before, helper + insert_before, 1)

# 2. Replace the content-too-short check to use isLowValuePage
old_check = b'if (!scraped.success || scraped.content.length < 100) {'
new_check = b'if (!scraped.success || isLowValuePage(pageUrl, scraped.content)) {'
if old_check not in data:
    print('NOT FOUND: content length check')
    sys.exit(1)
data = data.replace(old_check, new_check, 1)

# 3. Update the error message to reflect new filter reason
old_err = b'error: scraped.error || "Content too short",'
new_err = b'error: scraped.error || "Content too short or low-value page",'
data = data.replace(old_err, new_err, 1)

with open(path, 'wb') as f:
    f.write(data)
print('OK')
