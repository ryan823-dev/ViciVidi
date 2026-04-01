import sys

path = r'D:\qoder\vertax\src\app\customer\radar\prospects\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Insert save button block right before the </> that closes the outreachPack display
old = (
    b'                    </>\n'
    b'                  ) : (\n'
    b'                    <div className="relative rounded-2xl overflow-hidden p-12 text-center" style={{ background: \'linear-gradient(135deg, #0B1220 0%, #0A1018 60%, #0D1525 100%)\'')

if old not in data:
    print('NOT FOUND')
    sys.exit(1)

new = (
    b'                      {/* \xe4\xbf\x9d\xe5\xad\x98\xe5\x88\xb0\xe5\x86\x85\xe5\xae\xb9\xe5\xba\x93 */}\n'
    b'                      <div className="mt-4 pt-4 border-t border-[#30405A] flex justify-end">\n'
    b'                        {savedContentId ? (\n'
    b'                          <Link\n'
    b'                            href={`/customer/marketing/contents/${savedContentId}`}\n'
    b'                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-600/30 transition-colors"\n'
    b'                          >\n'
    b'                            <Check size={14} />\n'
    b'                            \xe5\xb7\xb2\xe4\xbf\x9d\xe5\xad\x98\xe2\x80\x94\xe7\x82\xb9\xe5\x87\xbb\xe6\x9f\xa5\xe7\x9c\x8b\n'
    b'                          </Link>\n'
    b'                        ) : (\n'
    b'                          <button\n'
    b'                            onClick={handleSaveToLibrary}\n'
    b'                            disabled={isSaving}\n'
    b'                            className="flex items-center gap-2 px-4 py-2 bg-[#30405A] text-slate-300 rounded-xl text-sm font-medium hover:bg-[#3A4F70] transition-colors disabled:opacity-50"\n'
    b'                          >\n'
    b'                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}\n'
    b'                            \xe4\xbf\x9d\xe5\xad\x98\xe5\x88\xb0\xe5\x86\x85\xe5\xae\xb9\xe5\xba\x93\n'
    b'                          </button>\n'
    b'                        )}\n'
    b'                      </div>\n'
    b'                    </>\n'
    b'                  ) : (\n'
    b'                    <div className="relative rounded-2xl overflow-hidden p-12 text-center" style={{ background: \'linear-gradient(135deg, #0B1220 0%, #0A1018 60%, #0D1525 100%)\''
)

data = data.replace(old, new, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK')
