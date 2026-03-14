'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, UserPlus, MoreHorizontal, Mail, Calendar, Shield, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Member {
  id: string
  userId: string
  name: string | null
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  avatar: string | null
  joinedAt: string
}

interface Invite {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  status: 'pending' | 'accepted' | 'expired'
  inviterName: string
  createdAt: string
  expiresAt: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      // 获取成员列表
      const membersRes = await fetch('/api/team/members?workspaceId=mock')
      const membersData = await membersRes.json()
      setMembers(membersData.members || [])

      // 获取邀请列表
      const invitesRes = await fetch('/api/team/invite?workspaceId=mock')
      const invitesData = await invitesRes.json()
      setInvites(invitesData.invites || [])
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          workspaceId: 'mock',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '邀请失败')
      }

      const data = await response.json()
      
      if (data.mock) {
        toast.success(data.message)
      } else {
        toast.success('邀请已发送')
      }

      setInviteEmail('')
      setInviteRole('MEMBER')
      setInviteDialogOpen(false)
      fetchTeamData()
    } catch (error) {
      console.error('Invite error:', error)
      toast.error(error instanceof Error ? error.message : '邀请失败')
    } finally {
      setSending(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const response = await fetch('/api/team/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          role: newRole,
          workspaceId: 'mock',
        }),
      })

      if (!response.ok) throw new Error('更新失败')

      toast.success('角色已更新')
      fetchTeamData()
    } catch (error) {
      toast.error('更新失败')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定要移除该成员吗？')) return

    try {
      const response = await fetch(`/api/team/members?memberId=${memberId}&workspaceId=mock`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('移除失败')

      toast.success('成员已移除')
      fetchTeamData()
    } catch (error) {
      toast.error('移除失败')
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'ADMIN':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OWNER: '所有者',
      ADMIN: '管理员',
      MEMBER: '成员',
    }
    return labels[role] || role
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载团队信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">团队协作</h1>
          <p className="text-muted-foreground mt-1">
            管理团队成员和权限，{members.length} 名成员
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger render={<Button />}>
            <UserPlus className="mr-2 h-4 w-4" />
            邀请成员
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>邀请新成员</DialogTitle>
                <DialogDescription>
                  输入邮箱地址邀请用户加入你的团队
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">角色</Label>
                  <Select value={inviteRole} onValueChange={(value) => value && setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">成员</SelectItem>
                      <SelectItem value="ADMIN">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    成员可以查看和编辑数据，管理员还可以管理团队成员
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={sending}>
                  {sending ? '发送中...' : '发送邀请'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>团队成员</CardTitle>
          <CardDescription>
            查看和管理团队成员及其权限
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>成员</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>加入时间</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name || ''} className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-lg font-medium">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{member.name || '未设置姓名'}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(member.joinedAt).toLocaleDateString('zh-CN')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.role !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'ADMIN')}>
                            设为管理员
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'MEMBER')}>
                            设为成员
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            移除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>待处理邀请</CardTitle>
            <CardDescription>
              已发送但尚未接受的邀请
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>发送时间</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invite.role)}>
                        {getRoleLabel(invite.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invite.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {new Date(invite.expiresAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        待接受
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>权限说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5" />
            <div>
              <strong>所有者</strong> - 完全控制工作空间，包括管理成员、账单和所有数据
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5" />
            <div>
              <strong>管理员</strong> - 可以管理团队成员、查看和编辑所有数据
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5" />
            <div>
              <strong>成员</strong> - 可以查看和编辑数据，管理自己的列表和公司
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
