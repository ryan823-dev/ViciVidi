import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Mail, List, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: '公司总数',
    value: '0',
    description: '本月新增 0',
    icon: Building2,
  },
  {
    title: '邮箱验证',
    value: '0',
    description: '剩余 50 次',
    icon: Mail,
  },
  {
    title: '列表数量',
    value: '0',
    description: '共 0 条线索',
    icon: List,
  },
  {
    title: '数据丰富率',
    value: '0%',
    description: '目标 80%',
    icon: TrendingUp,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">概览</h1>
        <p className="text-muted-foreground mt-1">
          欢迎使用 ViciVidi AI
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>
              开始添加公司，自动丰富数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/companies"
              className="text-primary hover:underline"
            >
              添加第一个公司 →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>配额使用</CardTitle>
            <CardDescription>
              当前套餐: Starter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>公司数量</span>
                <span>0 / 1,000</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}