path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Step 5: replace publish button with mode switcher + datetime + action button
old5 = (
    b"                  <button\r\n"
    b"                    onClick={() => handleSavePost(true)}\r\n"
    b"                    disabled={isPublishing || accounts.length === 0}\r\n"
    b"                    className=\"flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50\"\r\n"
    b"                    style={{ background: '#D4AF37', color: '#0B1220', boxShadow: '0 4px 16px -2px rgba(212,175,55,0.35)' }}\r\n"
    b"                  >\r\n"
    b"                    {isPublishing ? (\r\n"
    b"                      <>\r\n"
    b"                        <Loader2 size={14} className=\"animate-spin\" />\r\n"
    b"                        \xe5\x8f\x91\xe5\xb8\x83\xe4\xb8\xad...\r\n"
    b"                      </>\r\n"
    b"                    ) : (\r\n"
    b"                      <>\r\n"
    b"                        <Send size={14} />\r\n"
    b"                        \xe7\xab\x8b\xe5\x8d\xb3\xe5\x8f\x91\xe5\xb8\x83\r\n"
    b"                      </>\r\n"
    b"                    )}\r\n"
    b"                  </button>"
)
new5 = (
    b"                  <div className=\"flex-1 space-y-2\">\r\n"
    b"                    {/* \xe5\x8f\x91\xe5\xb8\x83\xe6\xa8\xa1\xe5\xbc\x8f\xe5\x88\x87\xe6\x8d\xa2 */}\r\n"
    b"                    <div className=\"flex rounded-lg overflow-hidden border border-[#D4AF37]/40\">\r\n"
    b"                      <button\r\n"
    b"                        onClick={() => setPublishMode('now')}\r\n"
    b"                        className={`flex-1 py-1.5 text-xs font-medium transition-colors ${\r\n"
    b"                          publishMode === 'now' ? 'bg-[#D4AF37] text-[#0B1220]' : 'text-slate-400 hover:bg-slate-800/30'\r\n"
    b"                        }`}\r\n"
    b"                      >\r\n"
    b"                        \xe7\xab\x8b\xe5\x8d\xb3\xe5\x8f\x91\xe5\xb8\x83\r\n"
    b"                      </button>\r\n"
    b"                      <button\r\n"
    b"                        onClick={() => setPublishMode('scheduled')}\r\n"
    b"                        className={`flex-1 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${\r\n"
    b"                          publishMode === 'scheduled' ? 'bg-[#D4AF37] text-[#0B1220]' : 'text-slate-400 hover:bg-slate-800/30'\r\n"
    b"                        }`}\r\n"
    b"                      >\r\n"
    b"                        <CalendarClock size={11} />\r\n"
    b"                        \xe5\xae\x9a\xe6\x97\xb6\xe5\x8f\x91\xe5\xb8\x83\r\n"
    b"                      </button>\r\n"
    b"                    </div>\r\n"
    b"                    {publishMode === 'scheduled' && (\r\n"
    b"                      <input\r\n"
    b"                        type=\"datetime-local\"\r\n"
    b"                        value={scheduledAt}\r\n"
    b"                        onChange={(e) => setScheduledAt(e.target.value)}\r\n"
    b"                        min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}\r\n"
    b"                        className=\"w-full px-3 py-2 border border-[#D4AF37]/40 rounded-xl text-xs bg-[#0B1220]/60 text-slate-200 focus:outline-none focus:border-[#D4AF37]\"\r\n"
    b"                      />\r\n"
    b"                    )}\r\n"
    b"                    <button\r\n"
    b"                      onClick={() => handleSavePost(publishMode === 'now')}\r\n"
    b"                      disabled={isPublishing || accounts.length === 0 || (publishMode === 'scheduled' && !scheduledAt)}\r\n"
    b"                      className=\"w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50\"\r\n"
    b"                      style={{ background: '#D4AF37', color: '#0B1220', boxShadow: '0 4px 16px -2px rgba(212,175,55,0.35)' }}\r\n"
    b"                    >\r\n"
    b"                      {isPublishing ? (\r\n"
    b"                        <><Loader2 size={14} className=\"animate-spin\" />\xe5\x8f\x91\xe5\xb8\x83\xe4\xb8\xad...</>\r\n"
    b"                      ) : publishMode === 'scheduled' ? (\r\n"
    b"                        <><CalendarClock size={14} />\xe5\x8a\xa0\xe5\x85\xa5\xe8\xb0\x83\xe5\xba\xa6</>\r\n"
    b"                      ) : (\r\n"
    b"                        <><Send size={14} />\xe7\xab\x8b\xe5\x8d\xb3\xe5\x8f\x91\xe5\xb8\x83</>\r\n"
    b"                      )}\r\n"
    b"                    </button>\r\n"
    b"                  </div>"
)
assert old5 in data, f'step5 not found, checking bytes near line 504...'
data = data.replace(old5, new5, 1)
print('5 OK')

with open(path, 'wb') as f:
    f.write(data)
print('Done')
