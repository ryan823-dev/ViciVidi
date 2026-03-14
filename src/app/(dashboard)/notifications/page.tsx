'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Copy,
  TrendingUp,
  Users,
  Trash2
} from 'lucide-react'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: any
  workspaceId?: string
  read: boolean
  createdAt: string
}

const NOTIFICATION_TYPES: Record<string, { icon: any, color: string, label: string }> = {
  BUDGET_ALERT: { icon: AlertTriangle, color: 'text-red-600', label: '预算警报' },
  TASK_COMPLETED: { icon: CheckCircle, color: 'text-green-600', label: '任务完成' },
  DUPLICATE_DETECTED: { icon: Copy, color: 'text-yellow-600', label: '重复检测' },
  QUOTA_WARNING: { icon: TrendingUp, color: 'text-orange-600', label: '配额警告' },
  TEAM_INVITE: { icon: Users, color: 'text-blue-600', label: '团队通知' }
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchNotifications()
  }, [activeTab])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        unreadOnly: activeTab === 'unread' ? 'true' : 'false'
      })
      const response = await fetch(`/api/notifications?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unreadCount)
      } else {
        toast.error('获取通知失败')
      }
    } catch (error) {
      console.error('获取通知失败:', error)
      toast.error('获取通知失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          read: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('已标记为已读')
        fetchNotifications()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      console.error('标记通知失败:', error)
      toast.error('操作失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(n => !n.read)
        .map(n => fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: n.id, read: true })
        }))
      
      await Promise.all(promises)
      
      toast.success('已全部标记为已读')
      fetchNotifications()
    } catch (error) {
      console.error('批量标记失败:', error)
      toast.error('操作失败')
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!confirm('确定要删除这条通知吗？')) return
    
    // 这里需要实现删除 API，暂时仅前端移除
    setNotifications(notifications.filter(n => n.id !== notificationId))
    toast.success('通知已删除')
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  const getNotificationIcon = (type: string) => {
    const config = NOTIFICATION_TYPES[type] || { icon: Bell, color: 'text-muted-foreground', label: '通知' }
    const Icon = config.icon
    return <Icon className={`h-5 w-5 ${config.color}`} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">通知中心</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无未读通知'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              全部已读
            </Button>
          )}
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            全部通知
          </TabsTrigger>
          <TabsTrigger value="unread">
            未读通知
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {notifications.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>通知列表</CardTitle>
                <CardDescription>
                  显示 {notifications.length} 条通知
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                        notification.read ? 'bg-muted/30' : 'bg-card'
                      }`}
                    >
                      {/* 图标 */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-semibold ${notification.read ? 'text-muted-foreground' : ''}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Badge variant="default" className="bg-blue-600">
                                未读
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-2 pt-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              标记为已读
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'unread' ? '暂无未读通知' : '暂无通知'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread' 
                    ? '您已经处理了所有通知' 
                    : '当有新的系统通知时会显示在这里'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 通知类型说明 */}
      <Card>
        <CardHeader>
          <CardTitle>通知类型</CardTitle>
          <CardDescription>
            系统会发送以下类型的通知
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => {
              const Icon = config.icon
              return (
                <div key={type} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Icon className={`h-5 w-5 ${config.color} mt-0.5`} />
                  <div>
                    <h4 className="font-medium text-sm">{config.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getNotificationDescription(type)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getNotificationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    BUDGET_ALERT: '当 API 支出达到预算阈值时触发',
    TASK_COMPLETED: '定时任务执行完成时通知',
    DUPLICATE_DETECTED: '检测到重复公司数据时提醒',
    QUOTA_WARNING: '配额即将用尽时发出警告',
    TEAM_INVITE: '团队成员相关动态通知'
  }
  return descriptions[type] || '系统通知'
}
