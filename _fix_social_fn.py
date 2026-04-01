path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

old = b'const handleGenerate = async () => {'
new = (
    b'const loadLibrary = async () => {\r\n'
    b'    if (contentItems.length > 0) return;\r\n'
    b'    setLoadingLibrary(true);\r\n'
    b'    try {\r\n'
    b'      const result = await getContentPieces({});\r\n'
    b'      setContentItems(result.slice(0, 30).map(i => ({ id: i.id, title: i.title, excerpt: i.excerpt })));\r\n'
    b'    } catch (err) {\r\n'
    b'      console.error(err);\r\n'
    b'    } finally {\r\n'
    b'      setLoadingLibrary(false);\r\n'
    b'    }\r\n'
    b'  };\r\n\r\n'
    b'  const handleGenerate = async () => {'
)

assert old in data, "NOT FOUND"
data = data.replace(old, new, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK')
