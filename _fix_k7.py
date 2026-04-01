path = r'D:\qoder\vertax\src\actions\knowledge.ts'
with open(path, 'rb') as f:
    raw = f.read()

lines = raw.split(b'\r\n')

# Find the revalidatePath line inside updateCompanyProfile (at line 305, 0-indexed=304)
target_line = 304  # 0-indexed
assert lines[target_line] == b'  revalidatePath("/customer/knowledge/company");', repr(lines[target_line])
# Verify it's inside updateCompanyProfile: function starts at line 254 (1-based) = 253 (0-based)
print('Inserting sync block after line', target_line + 1)

sync_block_lines = [
    b'  revalidatePath("/customer/radar");',
    b'',
    b'  // Sync targetIndustries -> RadarSearchProfile.industryCodes (non-blocking)',
    b'  if (data.targetIndustries !== undefined) {',
    b'    const industries = (data.targetIndustries as Array<{ name?: string } | string>)',
    b"      .map((i) => (typeof i === 'string' ? i : i.name ?? ''))",
    b'      .filter(Boolean);',
    b'    if (industries.length) {',
    b'      (db as any).radarSearchProfile.updateMany({',
    b'        where: { tenantId: session.user.tenantId, industryCodes: { isEmpty: true } },',
    b'        data: { industryCodes: industries },',
    b'      }).catch(() => { /* non-critical */ });',
    b'    }',
    b'  }',
]

# Insert after line 304 (0-indexed)
lines = lines[:target_line + 1] + sync_block_lines + lines[target_line + 1:]

raw = b'\r\n'.join(lines)
with open(path, 'wb') as f:
    f.write(raw)
print('Done, total lines:', len(lines))
