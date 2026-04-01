path = r'D:\qoder\vertax\vercel.json'
with open(path, 'rb') as f:
    d = f.read()

old = b'    { "path": "/api/cron/social-publish", "schedule": "0 * * * *" }\r\n  ]'
new = (
    b'    { "path": "/api/cron/social-publish", "schedule": "0 * * * *" },\r\n'
    b'    { "path": "/api/cron/social-metrics-sync", "schedule": "0 8 * * *" }\r\n'
    b'  ]'
)
assert old in d, 'pattern not found'
d = d.replace(old, new, 1)

with open(path, 'wb') as f:
    f.write(d)
print('OK')
