import sys

path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Find the textarea block - we already did steps 1-4 in previous run
# Now just do step 5: replace the label+textarea block with Tab+content

old_block = (
    b'              <div>\r\n'
    b'                <label className="text-xs text-slate-500 mb-1 block">'
    b'\xe8\xbe\x93\xe5\x85\xa5\xe5\x86\x85\xe5\xae\xb9\xe4\xb8\xbb\xe9\xa2\x98'
    b'</label>\r\n'
    b'                <textarea\r\n'
    b'                  value={topic}\r\n'
    b'                  onChange={(e) => setTopic(e.target.value)}\r\n'
    b'                  placeholder="'
    b'\xe4\xbe\x8b\xe5\xa6\x82\xef\xbc\x9a\xe5\x8f\x91\xe5\xb8\x83\xe6\x96\xb0\xe4\xba\xa7\xe5\x93\x81\xe4\xb8\x8a\xe7\xba\xbf\xe5\x85\xac\xe5\x91\x8a\xe3\x80\x81\xe5\x88\x86\xe4\xba\xab\xe8\xa1\x8c\xe4\xb8\x9a\xe6\xb4\x9e\xe5\xaf\x9f\xe3\x80\x81\xe5\x85\xac\xe5\x8f\xb8\xe6\xb4\xbb\xe5\x8a\xa8\xe5\x9b\x9e\xe9\xa1\xbe...'
    b'"\r\n'
    b'                  rows={3}\r\n'
    b'                  className="w-full px-4 py-2.5 border border-[#E8E0D0] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] resize-none bg-[#FFFCF7]"\r\n'
    b'                />\r\n'
    b'              </div>\r\n'
)

if old_block not in data:
    print('NOT FOUND old block')
    sys.exit(1)

new_block = (
    b'              {/* \xe8\xbe\x93\xe5\x85\xa5\xe6\xa8\xa1\xe5\xbc\x8f Tab */}\r\n'
    b'              <div className="flex rounded-lg border border-[#E8E0D0] overflow-hidden mb-1">\r\n'
    b'                <button\r\n'
    b'                  onClick={() => setInputMode(\'manual\')}\r\n'
    b'                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${\r\n'
    b'                    inputMode === \'manual\' ? \'bg-[#0B1220] text-[#D4AF37]\' : \'text-slate-500 hover:bg-slate-50\'\r\n'
    b'                  }`}\r\n'
    b'                >\r\n'
    b'                  \xe6\x89\x8b\xe5\x8a\xa8\xe8\xbe\x93\xe5\x85\xa5\r\n'
    b'                </button>\r\n'
    b'                <button\r\n'
    b'                  onClick={() => { setInputMode(\'library\'); loadLibrary(); }}\r\n'
    b'                  className={`flex-1 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${\r\n'
    b'                    inputMode === \'library\' ? \'bg-[#0B1220] text-[#D4AF37]\' : \'text-slate-500 hover:bg-slate-50\'\r\n'
    b'                  }`}\r\n'
    b'                >\r\n'
    b'                  <Library size={11} />\r\n'
    b'                  \xe4\xbb\x8e\xe5\x86\x85\xe5\xae\xb9\xe5\xba\x93\xe5\xaf\xbc\xe5\x85\xa5\r\n'
    b'                </button>\r\n'
    b'              </div>\r\n'
    b'              <div>\r\n'
    b'                {inputMode === \'manual\' ? (\r\n'
    b'                  <textarea\r\n'
    b'                    value={topic}\r\n'
    b'                    onChange={(e) => setTopic(e.target.value)}\r\n'
    b'                    placeholder="'
    b'\xe4\xbe\x8b\xe5\xa6\x82\xef\xbc\x9a\xe5\x8f\x91\xe5\xb8\x83\xe6\x96\xb0\xe4\xba\xa7\xe5\x93\x81\xe4\xb8\x8a\xe7\xba\xbf\xe5\x85\xac\xe5\x91\x8a\xe3\x80\x81\xe5\x88\x86\xe4\xba\xab\xe8\xa1\x8c\xe4\xb8\x9a\xe6\xb4\x9e\xe5\xaf\x9f\xe3\x80\x81\xe5\x85\xac\xe5\x8f\xb8\xe6\xb4\xbb\xe5\x8a\xa8\xe5\x9b\x9e\xe9\xa1\xbe...'
    b'"\r\n'
    b'                    rows={3}\r\n'
    b'                    className="w-full px-4 py-2.5 border border-[#E8E0D0] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] resize-none bg-[#FFFCF7]"\r\n'
    b'                  />\r\n'
    b'                ) : (\r\n'
    b'                  <div className="space-y-1 max-h-[140px] overflow-y-auto">\r\n'
    b'                    {loadingLibrary ? (\r\n'
    b'                      <div className="flex items-center justify-center py-6">\r\n'
    b'                        <Loader2 size={16} className="animate-spin text-slate-400" />\r\n'
    b'                      </div>\r\n'
    b'                    ) : contentItems.length === 0 ? (\r\n'
    b'                      <p className="text-xs text-slate-400 text-center py-4">'
    b'\xe6\x9a\x82\xe6\x97\xa0\xe5\x86\x85\xe5\xae\xb9'
    b'</p>\r\n'
    b'                    ) : (\r\n'
    b'                      contentItems.map(item => (\r\n'
    b'                        <button\r\n'
    b'                          key={item.id}\r\n'
    b'                          onClick={() => {\r\n'
    b'                            setTopic(item.excerpt ? `${item.title}\\n\\n${item.excerpt}` : item.title);\r\n'
    b'                            setInputMode(\'manual\');\r\n'
    b'                          }}\r\n'
    b'                          className="w-full text-left px-3 py-2 rounded-lg border border-[#E8E0D0] hover:border-[#D4AF37] hover:bg-[#FFFDF5] transition-colors"\r\n'
    b'                        >\r\n'
    b'                          <p className="text-xs font-medium text-[#0B1B2B] truncate">{item.title}</p>\r\n'
    b'                          {item.excerpt && (\r\n'
    b'                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.excerpt}</p>\r\n'
    b'                          )}\r\n'
    b'                        </button>\r\n'
    b'                      ))\r\n'
    b'                    )}\r\n'
    b'                  </div>\r\n'
    b'                )}\r\n'
    b'              </div>\r\n'
)

data = data.replace(old_block, new_block, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK')
