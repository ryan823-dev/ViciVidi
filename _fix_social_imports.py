path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# 1. Add Library icon
old1 = b"Plus,\r\n} from 'lucide-react';"
new1 = b"Plus,\r\n  Library,\r\n} from 'lucide-react';"
assert old1 in data, "NOT FOUND: icon"
data = data.replace(old1, new1, 1)
print('1 OK')

# 2. Add getContentPieces import
old2 = b"} from '@/actions/social';\r\n"
new2 = b"} from '@/actions/social';\r\nimport { getContentPieces } from '@/actions/contents';\r\n"
assert old2 in data, "NOT FOUND: social import"
data = data.replace(old2, new2, 1)
print('2 OK')

with open(path, 'wb') as f:
    f.write(data)
print('Imports done')
