/**
 * 控制台首页
 */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Typography } from 'antd';
import {
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const { Title } = Typography;

interface Match {
  id: string;
  name: string;
  sport: string;
  status: 'live' | 'scheduled' | 'finished';
  homeTeam: { name: string; score: number };
  awayTeam: { name: string; score: number };
  startTime: string;
}

interface DashboardData {
  summary: {
    liveMatches: number;
    scheduledMatches: number;
    completedMatches: number;
  };
  matches: {
    live: Match[];
    scheduled: Match[];
    completed: Match[];
  };
  trends: {
    liveMatches: {
      trend: 'up' | 'down' | 'stable';
      changePercentage: number;
    };
  };
}

const Dashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000, // 每30秒刷新一次
  });

  const liveColumns = [
    {
      title: '比赛名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '运动',
      dataIndex: 'sport',
      key: 'sport',
      render: (sport: string) => <Tag color="blue">{sport}</Tag>,
    },
    {
      title: '主队',
      dataIndex: ['homeTeam', 'name'],
      key: 'homeTeam',
    },
    {
      title: '客队',
      dataIndex: ['awayTeam', 'name'],
      key: 'awayTeam',
    },
    {
      title: '比分',
      key: 'score',
      render: (_: any, record: Match) => (
        <Space>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {record.homeTeam.score} - {record.awayTeam.score}
          </span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'live' ? 'red' : 'green'}>
          {status === 'live' ? '进行中' : '已完成'}
        </Tag>
      ),
    },
  ];

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!dashboardData) {
    return <div>无法加载数据</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>控制台</Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="进行中比赛"
              value={dashboardData.summary.liveMatches}
              prefix={<ClockCircleOutlined />}
              suffix={
                dashboardData.trends.liveMatches.trend === 'up' && (
                  <span style={{ color: '#3f8600', fontSize: '14px' }}>
                    <ArrowUpOutlined /> {dashboardData.trends.liveMatches.changePercentage.toFixed(1)}%
                  </span>
                )
              }
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已安排比赛"
              value={dashboardData.summary.scheduledMatches}
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已完成比赛"
              value={dashboardData.summary.completedMatches}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 进行中比赛列表 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>进行中比赛</span>
                <Tag color="red">{dashboardData.matches.live.length}</Tag>
              </Space>
            }
          >
            <Table
              columns={liveColumns}
              dataSource={dashboardData.matches.live}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* 已安排比赛 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="已安排比赛">
            {dashboardData.matches.scheduled.slice(0, 5).map((match) => (
              <div key={match.id} style={{ marginBottom: 12 }}>
                <Space>
                  <span style={{ fontWeight: 500 }}>{match.name}</span>
                  <Tag color="blue">{match.sport}</Tag>
                  <span style={{ color: '#8c8c8c' }}>
                    {new Date(match.startTime).toLocaleString('zh-CN')}
                  </span>
                </Space>
              </div>
            ))}
          </Card>
        </Col>

        {/* 最近完成的比赛 */}
        <Col span={12}>
          <Card title="最近完成">
            {dashboardData.matches.completed.slice(0, 5).map((match) => (
              <div key={match.id} style={{ marginBottom: 12 }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontWeight: 500 }}>{match.name}</span>
                  <span>
                    {match.homeTeam.name} {match.homeTeam.score} - {match.awayTeam.score} {match.awayTeam.name}
                  </span>
                </Space>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
