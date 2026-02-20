/**
 * 赛事管理页
 */
import React, { useState } from 'react';
import {
  Table,
  Card,
  Space,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Modal,
  Form,
  InputNumber,
  message
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Match {
  id: string;
  name: string;
  sport: string;
  status: 'scheduled' | 'live' | 'paused' | 'finished' | 'cancelled';
  homeTeam: { name: string; score: number; primaryColor: string };
  awayTeam: { name: string; score: number; primaryColor: string };
  venue?: string;
  startTime: string;
}

const MatchList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [sportFilter, setSportFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const queryClient = useQueryClient();

  // 获取比赛列表
  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ['matches', { sport: sportFilter, status: statusFilter }],
    queryFn: async () => {
      const params: any = {};
      if (sportFilter) params.sport = sportFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/matches', { params });
      return response.data.data;
    },
  });

  // 创建比赛
  const createMatchMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await api.post('/matches', values);
      return response.data;
    },
    onSuccess: () => {
      message.success('比赛创建成功');
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  const columns = [
    {
      title: '比赛名称',
      dataIndex: 'name',
      key: 'name',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: Match) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: '运动',
      dataIndex: 'sport',
      key: 'sport',
      render: (sport: string) => {
        const colorMap: Record<string, string> = {
          basketball: 'orange',
          football: 'blue',
          ice_hockey: 'cyan',
          esports: 'purple',
        };
        return <Tag color={colorMap[sport] || 'default'}>{sport}</Tag>;
      },
    },
    {
      title: '主队',
      key: 'homeTeam',
      render: (_: any, record: Match) => (
        <Space>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: record.homeTeam.primaryColor,
              marginRight: 8,
            }}
          />
          {record.homeTeam.name}
        </Space>
      ),
    },
    {
      title: '客队',
      key: 'awayTeam',
      render: (_: any, record: Match) => (
        <Space>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: record.awayTeam.primaryColor,
              marginRight: 8,
            }}
          />
          {record.awayTeam.name}
        </Space>
      ),
    },
    {
      title: '比分',
      key: 'score',
      render: (_: any, record: Match) => (
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
          {record.homeTeam.score} - {record.awayTeam.score}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          scheduled: 'blue',
          live: 'red',
          paused: 'orange',
          finished: 'green',
          cancelled: 'default',
        };
        const textMap: Record<string, string> = {
          scheduled: '已安排',
          live: '进行中',
          paused: '暂停',
          finished: '已完成',
          cancelled: '已取消',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Match) => (
        <Space size="small">
          <Button icon={<EditOutlined />} size="small" type="link">
            编辑
          </Button>
          {record.status === 'live' && (
            <Button icon={<PauseCircleOutlined />} size="small" type="link" danger>
              暂停
            </Button>
          )}
          {record.status === 'paused' && (
            <Button icon={<PlayCircleOutlined />} size="small" type="link">
              继续
            </Button>
          )}
          <Button icon={<DeleteOutlined />} size="small" type="link" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreateMatch = async () => {
    try {
      const values = await form.validateFields();
      await createMatchMutation.mutateAsync(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* 搜索和筛选 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="搜索比赛名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="运动类型"
              value={sportFilter}
              onChange={setSportFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="basketball">篮球</Option>
              <Option value="football">足球</Option>
              <Option value="ice_hockey">冰球</Option>
              <Option value="esports">电竞</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="scheduled">已安排</Option>
              <Option value="live">进行中</Option>
              <Option value="paused">暂停</Option>
              <Option value="finished">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              创建比赛
            </Button>
          </Col>
        </Row>

        {/* 比赛表格 */}
        <Table
          columns={columns}
          dataSource={matches}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建比赛模态框 */}
      <Modal
        title="创建新比赛"
        open={isModalVisible}
        onOk={handleCreateMatch}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createMatchMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="比赛名称"
            name="name"
            rules={[{ required: true, message: '请输入比赛名称' }]}
          >
            <Input placeholder="例如:NBA总决赛 第1场" />
          </Form.Item>

          <Form.Item
            label="运动类型"
            name="sport"
            rules={[{ required: true, message: '请选择运动类型' }]}
          >
            <Select placeholder="选择运动类型">
              <Option value="basketball">篮球</Option>
              <Option value="football">足球</Option>
              <Option value="ice_hockey">冰球</Option>
              <Option value="esports">电竞</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="主队名称"
                name={['homeTeam', 'name']}
                rules={[{ required: true, message: '请输入主队名称' }]}
              >
                <Input placeholder="主队名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="主队颜色"
                name={['homeTeam', 'primaryColor']}
                rules={[{ required: true, message: '请选择主队颜色' }]}
              >
                <Input type="color" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="客队名称"
                name={['awayTeam', 'name']}
                rules={[{ required: true, message: '请输入客队名称' }]}
              >
                <Input placeholder="客队名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="客队颜色"
                name={['awayTeam', 'primaryColor']}
                rules={[{ required: true, message: '请选择客队颜色' }]}
              >
                <Input type="color" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="比赛场地"
            name="venue"
          >
            <Input placeholder="比赛场地（可选）" />
          </Form.Item>

          <Form.Item
            label="开始时间"
            name="startTime"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MatchList;
