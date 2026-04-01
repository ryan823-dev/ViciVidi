import sys

path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# 1. Add Library icon to imports
old_icon = b'  Plus,\r\n} from \'lucide-react\';'
new_icon = b'  Plus,\r\n  Library,\r\n} from \'lucide-react\';'
if old_icon not in data:
    print('NOT FOUND: icon')
    sys.exit(1)
data = data.replace(old_icon, new_icon, 1)
print('1 OK')

# 2. Add getContentPieces import
old_imp = b'} from \'@/actions/social\';\r\n'
new_imp = (
    b'} from \'@/actions/social\';\r\n'
    b'import { getContentPieces } from \'@/actions/contents\';\r\n'
)
if old_imp not in data:
    print('NOT FOUND: social import')
    sys.exit(1)
data = data.replace(old_imp, new_imp, 1)
print('2 OK')

# 3. Add inputMode state + contentItems after topic state
old_state = b'  const [topic, setTopic] = useState(\'\');\r\n'
new_state = (
    b'  const [topic, setTopic] = useState(\'\');\r\n'
    b'  const [inputMode, setInputMode] = useState<\'manual\' | \'library\'>(\'manual\');\r\n'
    b'  const [contentItems, setContentItems] = useState<Array<{ id: string; title: string; excerpt?: string | null }>>([]);\r\n'
    b'  const [loadingLibrary, setLoadingLibrary] = useState(false);\r\n'
)
if old_state not in data:
    print('NOT FOUND: topic state')
    sys.exit(1)
data = data.replace(old_state, new_state, 1)
print('3 OK')

# 4. Add loadLibrary effect before handleGenerate
old_handle = b'  const handleGenerate = async () => {\r\n'
new_handle = (
    b'  const loadLibrary = async () => {\r\n'
    b'    if (contentItems.length > 0) return;\r\n'
    b'    setLoadingLibrary(true);\r\n'
    b'    try {\r\n'
    b'      const result = await getContentPieces({ page: 1, pageSize: 30 });\r\n'
    b'      setContentItems(result.items.map(i => ({ id: i.id, title: i.title, excerpt: i.excerpt })));\r\n'
    b'    } finally {\r\n'
    b'      setLoadingLibrary(false);\r\n'
    b'    }\r\n'
    b'  };\r\n\r\n'
    b'  const handleGenerate = async () => {\r\n'
)
if old_handle not in data:
    print('NOT FOUND: handleGenerate')
    sys.exit(1)
data = data.replace(old_handle, new_handle, 1)
print('4 OK')

# 5. Replace the textarea section with Tab switcher + textarea
old_textarea_block = (
    b'            <div className="space-y-4">\r\n'
    b'              <div>\r\n'
    b'                <label className="\u6587\u672c-xs text-slate-500 mb-1 block">\u8f93\u5165\u5185\u5bb9\u4e3b\u9898</label>\r\n'
    b'                <textarea\r\n'
    b'                  value={topic}\r\n'
    b'                  onChange={(e) => setTopic(e.target.value)}\r\n'
    b'                  placeholder="\u4f8b\u5982\uff1a\u53d1\u5e03\u65b0\u4ea7\u54c1\u4e0a\u7ebf\u516c\u544a\u3001\u5206\u4eab\u884c\u4e1a\u6d1e\u5bdf\u3001\u516c\u53f8\u6d3b\u52a8\u56de\u987e..."\r\n'
    b'                  rows={3}\r\n'
    b'                  className="w-full px-4 py-2.5 border border-[#E8E0D0] rounded-xl text-sm focus:outline-none focus:border-[#D4AF37] resize-none bg-[#FFFCF7]"\r\n'
    b'                />\r\n'
    b'              </div>\r\n'
)

# Use encoded Chinese to avoid escaping issues
import codecs
old_textarea_block = (
    b'            <div className="space-y-4">\r\n'
    b'              <div>\r\n'
    b'                <label className="\xe6\x96\x87\xe6\x9c\xac-xs text-slate-500 mb-1 block">\xe8\xbe\x93\xe5\x85\xa5\xe5\x86\x85\xe5\xae\xb9\xe4\xb8\xbb\xe9\xa2\x98</label>\r\n'
)

if old_textarea_block not in data:
    # Try without Chinese
    old_textarea_block = b'              <div>\r\n                <label className='
    idx = data.find(old_textarea_block)
    if idx == -1:
        print('NOT FOUND: textarea block')
        sys.exit(1)
    # find block start (space-y-4)
    start = data.rfind(b'            <div className="space-y-4">', 0, idx)
    print(f'Found space-y-4 at {start}, textarea at {idx}')
else:
    start = data.find(old_textarea_block)
    print(f'Found textarea block at {start}')

print('5 finding OK')

# Actually let's do a surgical approach: add tab switcher before the existing label
label_target = '\xe8\xbe\x93\xe5\x85\xa5\xe5\x86\x85\xe5\xae\xb9\xe4\xb8\xbb\xe9\xa2\x98'.encode()
idx_label = data.find(label_target)
if idx_label == -1:
    print('NOT FOUND: label text')
    sys.exit(1)

# Find start of <div> containing the label  (go back to find `              <div>`)
div_start = data.rfind(b'              <div>\r\n                <label', 0, idx_label)
if div_start == -1:
    print('NOT FOUND: label div start')
    sys.exit(1)

# Find end of the closing </div> for this textarea block (2 closing divs after the textarea)
textarea_end_marker = b'</textarea>\r\n              </div>\r\n'
textarea_end = data.find(textarea_end_marker, idx_label)
if textarea_end == -1:
    print('NOT FOUND: textarea end')
    sys.exit(1)
replace_end = textarea_end + len(textarea_end_marker)

old_chunk = data[div_start:replace_end]
new_chunk = (
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
    b'                    placeholder="\xe4\xbe\x8b\xe5\xa6\x82\xef\xbc\x9a\xe5\x8f\x91\xe5\xb8\x83\xe6\x96\xb0\xe4\xba\xa7\xe5\x93\x81\xe4\xb8\x8a\xe7\xba\xbf\xe5\x85\xac\xe5\x91\x8a\xe3\x80\x81\xe5\x88\x86\xe4\xba\xab\xe8\xa1\x8c\xe4\xb8\x9a\xe6\xb4\x9e\xe5\xaf\x9f\xe3\x80\x81\xe5\x85\xac\xe5\x8f\xb8\xe6\xb4\xbb\xe5\x8a\xa8\xe5\x9b\x9e\xe9\xa1\xbe..."\r\n'
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
    b'                      <p className="text-xs text-slate-400 text-center py-4">\xe6\x9a\x82\xe6\x97\xa0\xe5\x86\x85\xe5\xae\xb9</p>\r\n'
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

data = data[:div_start] + new_chunk + data[replace_end:]
with open(path, 'wb') as f:
    f.write(data)
print('Done')
