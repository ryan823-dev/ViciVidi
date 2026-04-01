import sys
path = r'D:\qoder\vertax\src\lib\services\site-crawler.ts'
with open(path, 'rb') as f:
    data = f.read()

old = b'excludePaths: ["/admin", "/login", "/cart", "/checkout", "/account", "/wp-admin", "/api"],'
new = (
    b'excludePaths: [\r\n'
    b'    "/admin", "/login", "/cart", "/checkout", "/account", "/wp-admin", "/api",\r\n'
    b'    "/privacy", "/terms", "/cookie", "/legal", "/gdpr", "/sitemap", "/feed",\r\n'
    b'    "/rss", "/tag/", "/tags/", "/author/", "/wp-content", "/cdn-cgi",\r\n'
    b'    "/unsubscribe", "/imprint", "/disclaimer",\r\n'
    b'  ],'
)

if old not in data:
    print('NOT FOUND')
    sys.exit(1)

data = data.replace(old, new, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK, replaced', len(old), '->', len(new))
