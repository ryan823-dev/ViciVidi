import sys

path = r'D:\qoder\vertax\src\app\customer\radar\prospects\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# 1. Add BookmarkPlus to lucide imports
old_icon = b'  Clock,\n} from \'lucide-react\';'
new_icon = b'  Clock,\n  BookmarkPlus,\n} from \'lucide-react\';'
if old_icon not in data:
    print('NOT FOUND: lucide imports')
    sys.exit(1)
data = data.replace(old_icon, new_icon, 1)
print('Step 1 OK')

# 2. Add saveContent import  
old_import = b"import { executeSkill } from '@/actions/skills';\nimport { SKILL_NAMES } from '@/lib/skills/registry';"
new_import = (
    b"import { executeSkill } from '@/actions/skills';\n"
    b"import { SKILL_NAMES } from '@/lib/skills/registry';\n"
    b"import { saveContent } from '@/actions/marketing';"
)
if old_import not in data:
    print('NOT FOUND: skill imports')
    sys.exit(1)
data = data.replace(old_import, new_import, 1)
print('Step 2 OK')

# 3. Add isSaving / savedContentId state after copiedId state
old_state = b'  const [copiedId, setCopiedId] = useState<string | null>(null);'
new_state = (
    b'  const [copiedId, setCopiedId] = useState<string | null>(null);\n'
    b'  const [isSaving, setIsSaving] = useState(false);\n'
    b'  const [savedContentId, setSavedContentId] = useState<string | null>(null);'
)
if old_state not in data:
    print('NOT FOUND: copiedId state')
    sys.exit(1)
data = data.replace(old_state, new_state, 1)
print('Step 3 OK')

# 4. Add handleSaveToLibrary before the LAST return ( in the component
# Insert before: `  return (\n    <div className="space-y-8">`
old_last_return = b'  return (\n    <div className="space-y-8">'
new_last_return = (
    b'  const handleSaveToLibrary = async () => {\n'
    b'    if (!outreachPack || !selectedCompany) return;\n'
    b'    setIsSaving(true);\n'
    b'    try {\n'
    b'      const pack = outreachPack.outreachPack;\n'
    b'      const emailBodies = pack.emails.map((e: { subject: string; body: string }, i: number) =>\n'
    b'        `### Email ${i + 1}: ${e.subject}\\n\\n${e.body}`\n'
    b'      ).join(\'\\n\\n---\\n\\n\');\n'
    b'      const contentText = [\n'
    b'        `# Outreach Pack: ${selectedCompany.companyName}`,\n'
    b'        `**Tier:** ${pack.forTier}  |  **Persona:** ${pack.forPersona}`,\n'
    b'        \'\\n## Opening Lines\',\n'
    b'        ...pack.openings.map((o: { text: string }, i: number) => `${i + 1}. ${o.text}`),\n'
    b'        \'\\n## Emails\',\n'
    b'        emailBodies,\n'
    b'        pack.whatsapps.length ? \'\\n## WhatsApp Messages\' : \'\',\n'
    b'        ...pack.whatsapps.map((w: { text: string }, i: number) => `${i + 1}. ${w.text}`),\n'
    b'        pack.warnings.length ? \'\\n## Notes\\n\' + pack.warnings.map((w: string) => `- ${w}`).join(\'\\n\') : \'\',\n'
    b'      ].filter(Boolean).join(\'\\n\');\n'
    b'      const saved = await saveContent({\n'
    b'        title: `Outreach: ${selectedCompany.companyName}`,\n'
    b'        content: contentText,\n'
    b'        keywords: [selectedCompany.companyName, pack.forTier, \'outreach\'],\n'
    b'        status: \'draft\',\n'
    b'      });\n'
    b'      setSavedContentId(saved.id);\n'
    b'    } catch (err) {\n'
    b'      console.error(\'Save failed:\', err);\n'
    b'    } finally {\n'
    b'      setIsSaving(false);\n'
    b'    }\n'
    b'  };\n\n'
    b'  return (\n'
    b'    <div className="space-y-8">'
)
if old_last_return not in data:
    print('NOT FOUND: last return statement')
    sys.exit(1)
data = data.replace(old_last_return, new_last_return, 1)
print('Step 4 OK')

with open(path, 'wb') as f:
    f.write(data)
print('Steps 1-4 done, now need to add button in JSX separately')
