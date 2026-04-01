path = r'D:\qoder\vertax\src\actions\knowledge.ts'
with open(path, 'rb') as f:
    raw = f.read()

lines = raw.split(b'\r\n')

# Find the line index of the duplicate block in analyzeAssets
# analyzeAssets revalidatePath is around line 224 (1-indexed)
# We'll scan for revalidatePath("/customer/radar") occurrences
radar_line = b'  revalidatePath("/customer/radar");'
occurrences = [i for i, l in enumerate(lines) if l.strip() == radar_line.strip()]
print('radar occurrences at lines (1-based):', [i+1 for i in occurrences])

# The FIRST occurrence is in analyzeAssets — remove it and the sync block following it
# The sync block spans from that line until the empty line before "  return {"
first = occurrences[0]
print('First at:', first+1, repr(lines[first]))

# Find the end: empty line before return {
end = first + 1
while end < len(lines):
    if lines[end] == b'':
        # check if next non-empty is return {
        nxt = end + 1
        while nxt < len(lines) and lines[nxt] == b'':
            nxt += 1
        if lines[nxt].startswith(b'  return {'):
            break
    end += 1

print(f'Remove lines {first+1} to {end+1} (inclusive)')
print('Lines to remove:')
for l in lines[first:end+1]:
    print(' ', repr(l))

# Remove from first to end (inclusive)
lines = lines[:first] + lines[end+1:]

raw = b'\r\n'.join(lines)
with open(path, 'wb') as f:
    f.write(raw)
print('Done')
