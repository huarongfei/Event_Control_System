import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Typography,
  Table,
  Select,
  DatePicker,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  AuditOutlined,
  SearchOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { auditService } from '../services/audit';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

interface AuditLog {
  id: string;
  userId: string;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface FilterState {
  action?: string;
  resource?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

const AuditLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<FilterState>({});
  const [exportModalVisible, setExportModalVisible] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [page, pageSize, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.queryLogs({
        page,
        limit: pageSize,
        ...filters,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('加载审计日志失败', error);
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, keyword: value });
    setPage(1);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        ...filters,
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
      });
    } else {
      const { startDate, endDate, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleExport = async () => {
    try {
      const data = await auditService.exportLogs(filters);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
      setExportModalVisible(false);
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleCleanOldLogs = async () => {
    Modal.confirm({
      title: '确认清理旧日志？',
      content: '此操作将删除90天前的所有日志，此操作不可恢复',
      onOk: async () => {
        try {
          await auditService.cleanOldLogs();
          message.success('清理成功');
          loadLogs();
        } catch (error) {
          message.error('清理失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Text className="text-white">{dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
      ),
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username: string, record: AuditLog) => (
        <Text className="text-white">{username || record.userId}</Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        const actionColors: Record<string, string> = {
          CREATE: 'green',
          UPDATE: 'blue',
          DELETE: 'red',
          READ: 'default',
          LOGIN: 'cyan',
          LOGOUT: 'default',
        };
        return <Tag color={actionColors[action] || 'default'}>{action}</Tag>;
      },
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 150,
      render: (resource: string) => <Text className="text-white">{resource}</Text>,
    },
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 120,
      render: (resourceId: string) => (
        <Text className="text-primary-cyan font-mono text-sm">{resourceId}</Text>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ipAddress: string) => <Text className="text-gray-400 font-mono">{ipAddress}</Text>,
    },
    {
      title: '详情',
      key: 'details',
      width: 100,
      render: (_: any, record: AuditLog) => (
        <Button
          type="link"
          onClick={() => {
            Modal.info({
              title: '详细信息',
              content: (
                <pre className="text-left text-sm text-white bg-[#0A0E27] p-4 rounded">
                  {JSON.stringify(record.details, null, 2)}
                </pre>
              ),
              width: 600,
            });
          }}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-[#0A0E27]">
      <Content className="p-6">
        <div className="mb-6">
          <Title level={2} className="text-white mb-2">
            <AuditOutlined className="mr-2 text-primary-cyan" />
            操作审计日志
          </Title>
          <Text className="text-gray-400">查看系统操作记录和数据追踪</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card className="bg-[#121A3A] border-[#232D56]" bordered={false}>
              <Statistic
                title={<Text className="text-gray-400">总日志数</Text>}
                value={total}
                valueStyle={{ color: '#00F5FF' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="bg-[#121A3A] border-[#232D56]" bordered={false}>
              <Statistic
                title={<Text className="text-gray-400">今日操作</Text>}
                value={logs.filter((log) =>
                  dayjs(log.timestamp).isSame(dayjs(), 'day')
                ).length}
                valueStyle={{ color: '#00F5FF' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="bg-[#121A3A] border-[#232D56]" bordered={false}>
              <Statistic
                title={<Text className="text-gray-400">活跃用户</Text>}
                value={new Set(logs.map((log) => log.userId)).size}
                valueStyle={{ color: '#00F5FF' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="bg-[#121A3A] border-[#232D56]" bordered={false}>
              <Statistic
                title={<Text className="text-gray-400">错误操作</Text>}
                value={logs.filter((log) => log.action === 'ERROR').length}
                valueStyle={{ color: '#FF4D4F' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选条件 */}
        <Card className="mb-6 bg-[#121A3A] border-[#232D56]" bordered={false}>
          <Row gutter={16}>
            <Col span={6}>
              <Text className="text-gray-400 block mb-2">关键词</Text>
              <Search
                placeholder="搜索用户、资源、ID"
                onSearch={handleSearch}
                enterButton
                allowClear
              />
            </Col>

            <Col span={4}>
              <Text className="text-gray-400 block mb-2">操作类型</Text>
              <Select
                placeholder="选择操作"
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
                allowClear
                className="w-full"
              >
                <Option value="CREATE">创建</Option>
                <Option value="UPDATE">更新</Option>
                <Option value="DELETE">删除</Option>
                <Option value="READ">读取</Option>
                <Option value="LOGIN">登录</Option>
                <Option value="LOGOUT">退出</Option>
              </Select>
            </Col>

            <Col span={4}>
              <Text className="text-gray-400 block mb-2">资源类型</Text>
              <Select
                placeholder="选择资源"
                value={filters.resource}
                onChange={(value) => setFilters({ ...filters, resource: value })}
                allowClear
                className="w-full"
              >
                <Option value="Match">比赛</Option>
                <Option value="User">用户</Option>
                <Option value="ScoreEvent">得分事件</Option>
                <Option value="Foul">犯规</Option>
                <Option value="Timer">计时器</Option>
              </Select>
            </Col>

            <Col span={6}>
              <Text className="text-gray-400 block mb-2">日期范围</Text>
              <RangePicker
                className="w-full"
                onChange={handleDateRangeChange}
              />
            </Col>

            <Col span={4}>
              <div className="flex gap-2 mt-6">
                <Button icon={<ReloadOutlined />} onClick={loadLogs}>
                  刷新
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setExportModalVisible(true)}
                >
                  导出
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 日志列表 */}
        <Card
          title={
            <Space>
              <AuditOutlined className="text-primary-cyan" />
              <span className="text-white">日志列表</span>
              <Tag color="blue">共 {total} 条</Tag>
            </Space>
          }
          className="mb-6 bg-[#121A3A] border-[#232D56]"
          bordered={false}
          extra={
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleCleanOldLogs}
            >
              清理90天前日志
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              onShowSizeChange: (_, size) => setPageSize(size),
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Card>

        {/* 导出模态框 */}
        <Modal
          title="导出审计日志"
          open={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          onOk={handleExport}
          okText="导出"
          cancelText="取消"
        >
          <div className="mb-4">
            <Text className="text-gray-400 block mb-2">导出条件</Text>
            <div className="bg-[#0A0E27] p-4 rounded text-white text-sm">
              <p>• 关键词: {filters.keyword || '全部'}</p>
              <p>• 操作类型: {filters.action || '全部'}</p>
              <p>• 资源类型: {filters.resource || '全部'}</p>
              <p>• 日期范围: {filters.startDate ? `${filters.startDate} ~ ${filters.endDate}` : '全部'}</p>
            </div>
          </div>
          <Text className="text-gray-400">
            点击导出将下载 JSON 格式的日志文件
          </Text>
        </Modal>
      </Content>
    </Layout>
  );
};

export default AuditLogs;
