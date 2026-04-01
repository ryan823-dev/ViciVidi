import sys

path = r'D:\qoder\vertax\src\app\customer\radar\candidates\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

old = b'                {/* AI\xe8\x83\x8c\xe8\xb0\x83\xe6\xa8\xa1\xe5\x9d\x97 */}'

# The new AI evaluation block to insert before the AI background research block
new_block = (
    b'                {/* AI \xe8\xaf\x84\xe4\xbc\xb0\xe4\xbe\x9d\xe6\x8d\xae */}\n'
    b'                {(() => {\n'
    b'                  const rel = selectedCandidate.aiRelevance as {\n'
    b'                    tier?: string;\n'
    b'                    matchReasons?: string[];\n'
    b'                    approachAngle?: string;\n'
    b'                    signalScores?: { overallScore?: number };\n'
    b'                  } | null;\n'
    b'                  if (!rel?.matchReasons?.length) return null;\n'
    b'                  return (\n'
    b'                    <div className="bg-[#F7F3E8] rounded-2xl border border-[#E8E0D0] p-5">\n'
    b'                      <h4 className="flex items-center gap-2 text-sm font-bold text-[#0B1B2B] mb-3">\n'
    b'                        <Target size={14} className="text-[#D4AF37]" />\n'
    b'                        AI \xe8\xaf\x84\xe4\xbc\xb0\xe4\xbe\x9d\xe6\x8d\xae\n'
    b'                        {rel.tier && (\n'
    b'                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${\n'
    b'                            rel.tier === \'A\' ? \'bg-emerald-100 text-emerald-700\' :\n'
    b'                            rel.tier === \'B\' ? \'bg-blue-100 text-blue-700\' :\n'
    b'                            \'bg-slate-100 text-slate-500\'\n'
    b'                          }`}>Tier {rel.tier}</span>\n'
    b'                        )}\n'
    b'                      </h4>\n'
    b'                      <div className="space-y-2 mb-3">\n'
    b'                        {rel.matchReasons.map((reason, i) => (\n'
    b'                          <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">\n'
    b'                            <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />\n'
    b'                            <span>{reason}</span>\n'
    b'                          </div>\n'
    b'                        ))}\n'
    b'                      </div>\n'
    b'                      {rel.approachAngle && (\n'
    b'                        <div className="bg-[#F0EBD8] rounded-xl p-3">\n'
    b'                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#0B1B2B] mb-1">\n'
    b'                            <Zap size={11} className="text-[#D4AF37]" />\n'
    b'                            \xe6\x8e\xa8\xe8\x8d\x90\xe6\x8e\xa5\xe8\xa7\xa6\xe8\xa7\x92\xe5\xba\xa6\n'
    b'                          </div>\n'
    b'                          <p className="text-xs text-slate-600 leading-relaxed">{rel.approachAngle}</p>\n'
    b'                        </div>\n'
    b'                      )}\n'
    b'                    </div>\n'
    b'                  );\n'
    b'                })()}\n'
    b'\n'
    b'                {/* AI\xe8\x83\x8c\xe8\xb0\x83\xe6\xa8\xa1\xe5\x9d\x97 */}'
)

if old not in data:
    print('NOT FOUND:', repr(old[:60]))
    sys.exit(1)

data = data.replace(old, new_block, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK')
