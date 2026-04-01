path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

old = b"  const [topic, setTopic] = useState('');\r\n  const [selectedPlatforms"
new = (
    b"  const [topic, setTopic] = useState('');\r\n"
    b"  const [inputMode, setInputMode] = useState<'manual' | 'library'>('manual');\r\n"
    b"  const [contentItems, setContentItems] = useState<Array<{ id: string; title: string; excerpt?: string | null }>>([]);\r\n"
    b"  const [loadingLibrary, setLoadingLibrary] = useState(false);\r\n"
    b"  const [selectedPlatforms"
)
assert old in data, "NOT FOUND"
data = data.replace(old, new, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK')
