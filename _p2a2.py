path = r'D:\qoder\vertax\src\app\customer\social\page.tsx'
with open(path, 'rb') as f:
    data = f.read()

# Step 3: modify createSocialPost call and publish block
old3 = (
    b"      const post = await createSocialPost({\r\n"
    b"        title: topic,\r\n"
    b"        status: publish ? 'draft' : 'draft',\r\n"
    b"        versions,\r\n"
    b"      });\r\n"
    b"\r\n"
    b"      if (publish && post.id) {\r\n"
    b"        setIsPublishing(true);\r\n"
    b"        await publishSocialPost(post.id);\r\n"
    b"        setIsPublishing(false);\r\n"
    b"      }"
)
new3 = (
    b"      const isScheduling = publishMode === 'scheduled' && scheduledAt;\r\n"
    b"      const post = await createSocialPost({\r\n"
    b"        title: topic,\r\n"
    b"        status: 'draft',\r\n"
    b"        versions,\r\n"
    b"        scheduledAt: isScheduling ? new Date(scheduledAt) : undefined,\r\n"
    b"      });\r\n"
    b"\r\n"
    b"      if (publish && !isScheduling && post.id) {\r\n"
    b"        setIsPublishing(true);\r\n"
    b"        await publishSocialPost(post.id);\r\n"
    b"        setIsPublishing(false);\r\n"
    b"      }"
)
assert old3 in data, 'step3 not found'
data = data.replace(old3, new3, 1)
print('3 OK')

# Step 4: reset scheduledAt/publishMode after save
old4 = (
    b"      setViewMode('list');\r\n"
    b"      setTopic('');\r\n"
    b"      setGeneratedContents({});\r\n"
    b"      loadData();\r\n"
    b"    } catch (err) {\r\n"
    b"      setError(err instanceof Error ? err.message : "
)
new4 = (
    b"      setViewMode('list');\r\n"
    b"      setTopic('');\r\n"
    b"      setGeneratedContents({});\r\n"
    b"      setPublishMode('now');\r\n"
    b"      setScheduledAt('');\r\n"
    b"      loadData();\r\n"
    b"    } catch (err) {\r\n"
    b"      setError(err instanceof Error ? err.message : "
)
assert old4 in data, 'step4 not found'
data = data.replace(old4, new4, 1)
print('4 OK')

with open(path, 'wb') as f:
    f.write(data)
print('Done')
