path = r'D:\qoder\vertax\src\actions\knowledge.ts'
with open(path, 'rb') as f:
    data = f.read()

# Remove the /customer/radar revalidate + sync block from analyzeAssets
# analyzeAssets ends with return { id:... companyName... }
# The first occurrence is inside analyzeAssets

# Find first occurrence of the radar revalidate line
radar_line = b'  revalidatePath("/customer/radar");\r\n'
idx = data.find(radar_line)
print('First /radar at:', idx)

# The sync block ends before "  return {\r\n    id: profile.id"
end_marker = b'\r\n  return {\r\n    id: profile.id,'
end_idx = data.find(end_marker, idx)
print('end_idx:', end_idx)

# Extract and verify the block we're about to remove
block = data[idx:end_idx]
print('Block to remove (first 80):', repr(block[:80]))

# Remove it
data = data[:idx] + data[end_idx:]
print('Removed OK')

with open(path, 'wb') as f:
    f.write(data)
print('Done')
