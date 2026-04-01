path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    d = f.read()

old = b"  Library,\r\n} from 'lucide-react';"
new = b"  Library,\r\n  CalendarClock,\r\n} from 'lucide-react';"
assert old in d, 'import pattern not found'
d = d.replace(old, new, 1)

with open(path, 'wb') as f:
    f.write(d)
print('OK')
