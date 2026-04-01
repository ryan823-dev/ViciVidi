path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# 1. Add CalendarClock to lucide imports
old1 = b'  Library,\r\n} from \'lucide-react\';'
new1 = b'  Library,\r\n  CalendarClock,\r\n} from \'lucide-react\';'
assert old1 in data, 'icon not found'
data = data.replace(old1, new1, 1)
print('1 OK')

# 2. Add publishMode + scheduledAt state after isPublishing
old2 = b'  const [isPublishing, setIsPublishing] = useState(false);\r\n'
new2 = (
    b'  const [isPublishing, setIsPublishing] = useState(false);\r\n'
    b"  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now');\r\n"
    b'  const [scheduledAt, setScheduledAt] = useState(\'\');\r\n'
)
assert old2 in data, 'state not found'
data = data.replace(old2, new2, 1)
print('2 OK')

# 3. Modify handleSavePost to pass scheduledAt
old3 = (
    b'      const post = await createSocialPost({\r\n'
    b"        title: topic,\r\n"
    b"        status: publish ? 'draft' : 'draft',\r\n"
    b'        versions,\r\n'
    b'      });\r\n'
    b'\r\n'
    b'      if (publish && post.id) {\r\n'
    b'        setIsPublishing(true);\r\n'
    b'        await publishSocialPost(post.id);\r\n'
    b'        setIsPublishing(false);\r\n'
    b'      }'
)
new3 = (
    b'      const isScheduling = publishMode === \'scheduled\' && scheduledAt;\r\n'
    b'      const post = await createSocialPost({\r\n'
    b'        title: topic,\r\n'
    b"        status: 'draft',\r\n"
    b'        versions,\r\n'
    b'        scheduledAt: isScheduling ? new Date(scheduledAt) : undefined,\r\n'
    b'      });\r\n'
    b'\r\n'
    b'      if (publish && !isScheduling && post.id) {\r\n'
    b'        setIsPublishing(true);\r\n'
    b'        await publishSocialPost(post.id);\r\n'
    b'        setIsPublishing(false);\r\n'
    b'      }'
)
assert old3 in data, 'handleSavePost not found'
data = data.replace(old3, new3, 1)
print('3 OK')

# 4. After reset topic in handleSavePost, also reset publishMode
old4 = (
    b'      setViewMode(\'list\');\r\n'
    b'      setTopic(\'\');\r\n'
    b'      setGeneratedContents({});\r\n'
    b'      loadData();\r\n'
    b'    } catch (err) {\r\n'
    b"      setError(err instanceof Error ? err.message : '\u4fdd\u5b58\u5931\u8d25');"
)
new4 = (
    b"      setViewMode('list');\r\n"
    b"      setTopic('');\r\n"
    b'      setGeneratedContents({});\r\n'
    b"      setPublishMode('now');\r\n"
    b"      setScheduledAt('');\r\n"
    b'      loadData();\r\n'
    b'    } catch (err) {\r\n'
    b"      setError(err instanceof Error ? err.message : '\xe4\xbf\x9d\xe5\xad\x98\xe5\xa4\xb1\xe8\xb4\xa5');"
)
assert old4 in data, 'reset not found'
data = data.replace(old4, new4, 1)
print('4 OK')

# 5. Replace the publish button block with publish mode switcher + conditional datetime + publish btn
old5 = (
    b'                  <button\r\n'
    b'                    onClick={() => handleSavePost(true)}\r\n'
    b'                    disabled={isPublishing || accounts.length === 0}\r\n'
    b'                    className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"\r\n'
    b"                    style={{ background: '#D4AF37', color: '#0B1220', boxShadow: '0 4px 16px -2px rgba(212,175,55,0.35)' }}\r\n"
    b'                  >\r\n'
    b'                    {isPublishing ? (\r\n'
    b'                      <>\r\n'
    b'                        <Loader2 size={14} className="animate-spin" />\r\n'
    b'                        \xe5\x8f\x91\xe5\xb8\x83\xe4\xb8\xad...\r\n'
    b'                      </>\r\n'
    b'                    ) : (\r\n'
    b'                      <>\r\n'
    b'                        <Send size={14} />\r\n'
    b'                        \xe7\xab\x8b\xe5\x8d\xb3\xe5\x8f\x91\xe5\xb8\x83\r\n'
    b'                      </>\r\n'
    b'                    )}\r\n'
    b'                  </button>'
)
new5 = (
    b'                  <div className="flex-1 space-y-2">\r\n'
    b'                    {/* \xe5\x8f\x91\xe5\xb8\x83\xe6\xa8\xa1\xe5\xbc\x8f\xe5\x88\x87\xe6\x8d\xa2 */}\r\n'
    b'                    <div className="flex rounded-lg overflow-hidden border border-[#D4AF37]/40">\r\n'
    b"                      <button onClick={() => setPublishMode('now')} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${publishMode === 'now' ? 'bg-[#D4AF37] text-[#0B1220]' : 'text-slate-400 hover:bg-slate-800/30'}`}>\r\n"
    b'                        \xe7\xab\x8b\xe5\x8d\xb3\xe5\x8f\x91\xe5\xb8\x83\r\n'
    b'                      </button>\r\n'
    b"                      <button onClick={() => setPublishMode('scheduled')} className={`flex-1 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${publishMode === 'scheduled' ? 'bg-[#D4AF37] text-[#0B1220]' : 'text-slate-400 hover:bg-slate-800/30'}`}>\r\n"
    b'                        <CalendarClock size={11} />\r\n'
    b'                        \xe5\xae\x9a\xe6\x97\xb6\xe5\x8f\x91\xe5\xb8\x83\r\n'
    b'                      </button>\r\n'
    b'                    </div>\r\n'
    b"                    {publishMode === 'scheduled' && (\r\n"
    b'                      <input\r\n'
    b'                        type="datetime-local"\r\n'
    b'                        value={scheduledAt}\r\n'
    b'                        onChange={(e) => setScheduledAt(e.target.value)}\r\n'
    b'                        min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}\r\n'
    b'                        className="w-full px-3 py-2 border border-[#E8E0D0] rounded-xl text-xs text-slate-700 bg-[#FFFCF7] focus:outline-none focus:border-[#D4AF37]"\r\n'
    b'                      />\r\n'
    b'                    )}\r\n'
    b'                    <button\r\n'
    b"                      onClick={() => handleSavePost(publishMode === 'now')}\r\n"
    b"                      disabled={isPublishing || accounts.length === 0 || (publishMode === 'scheduled' && !scheduledAt)}\r\n"
    b'                      className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"\r\n'
    b"                      style={{ background: '#D4AF37', color: '#0B1220', boxShadow: '0 4px 16px -2px rgba(212,175,55,0.35)' }}\r\n"
    b'                    >\r\n'
    b'                      {isPublishing ? (\r\n'
    b'                        <><Loader2 size={14} className="animate-spin" />\xe5\x8f\x91\xe5\xb8\x83\xe4\xb8\xad...</>\r\n'
    b"                      ) : publishMode === 'scheduled' ? (\r\n"
    b'                        <><CalendarClock size={14} />\xe5\x8a\xa0\xe5\x85\xa5\xe8\xb0\x83\xe5\xba\xa6</>\r\n'
    b'                      ) : (\r\n'
    b'                        <><Send size={14} />\xe7\xab\x8b\xe5\x8d\xb3\xe5\x8f\x91\xe5\xb8\x83</>\r\n'
    b'                      )}\r\n'
    b'                    </button>\r\n'
    b'                  </div>'
)
assert old5 in data, 'publish button not found'
data = data.replace(old5, new5, 1)
print('5 OK')

with open(path, 'wb') as f:
    f.write(data)
print('Done')
