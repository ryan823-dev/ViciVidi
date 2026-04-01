path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    d = f.read()

old = b"  const [isPublishing, setIsPublishing] = useState(false);\r\n\r\n"
new = (
    b"  const [isPublishing, setIsPublishing] = useState(false);\r\n"
    b"  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now');\r\n"
    b"  const [scheduledAt, setScheduledAt] = useState('');\r\n"
    b"\r\n"
)
assert old in d, 'pattern not found'
d = d.replace(old, new, 1)

with open(path, 'wb') as f:
    f.write(d)
print('OK')
