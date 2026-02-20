import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Table,
  Timeline,
  Tag,
  Space,
  Button,
  Select,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import {
  HistoryOutlined,
  UndoOutlined,
  FilterOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { scoreEngineService } from '../services/scoreEngine';
import { matchService } from '../services/match';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface ScoreEvent {
  id: string;
  team: 'home' | 'away';
  eventType: string;
  playerName?: string;
  playerNumber?: number;
  points: number;
  period: number;
  time: number;
  timestamp: string;
}

interface Match {
  id: string;
  name: string;
  sport: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

const ScoreHistory: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<ScoreEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ScoreEvent[]>([]);
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away'>('all');
  const [filterPeriod, setFilterPeriod] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string | 'all'>('all');

  useEffect(() => {
    loadMatch();
    loadEvents();
  }, [matchId]);

  useEffect(() => {
    applyFilters();
  }, [events, filterTeam, filterPeriod, filterType]);

  const loadMatch = async () => {
    try {
      const data = await matchService.getMatch(matchId!);
      setMatch(data);
    } catch (error) {
      console.error('加载比赛数据失败', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await scoreEngineService.getScoreHistory(matchId!);
      setEvents(data);
    } catch (error) {
      console.error('加载得分历史失败', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filterTeam !== 'all') {
      filtered = filtered.filter((event) => event.team === filterTeam);
    }

    if (filterPeriod !== 'all') {
      filtered = filtered.filter((event) => event.period === filterPeriod);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((event) => event.eventType === filterType);
    }

    setFilteredEvents(filtered);
  };

  const handleRevertEvent = async (eventId: string) => {
    try {
      await scoreEngineService.revertScoreEvent(matchId!, eventId);
      message.success('事件已撤销');
      loadEvents();
    } catch (error) {
      message.error('撤销事件失败');
    }
  };

  const formatEventName = (event: ScoreEvent) => {
    const eventNames: Record<string, string> = {
      free_throw_make: '罚球命中',
      free_throw_miss: '罚球未中',
      two_point_make: '两分球命中',
      two_point_miss: '两分球未中',
      three_point_make: '三分球命中',
      three_point_miss: '三分球未中',
      goal: '进球',
      penalty: '点球',
      own_goal: '乌龙球',
      foul: '犯规',
      timeout: '暂停',
    };
    return eventNames[event.eventType] || event.eventType;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventColor = (event: ScoreEvent) => {
    if (event.team === 'home') {
      return 'cyan';
    } else {
      return 'orange';
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 120,
      render: (time: number, record: ScoreEvent) => (
        <Text className="text-white">
          第{record.period}节 {formatTime(time)}
        </Text>
      ),
    },
    {
      title: '队伍',
      dataIndex: 'team',
      key: 'team',
      width: 150,
      render: (team: 'home' | 'away') => (
        <Tag color={team === 'home' ? 'cyan' : 'orange'}>
          {team === 'home' ? match?.homeTeam.name : match?.awayTeam.name}
        </Tag>
      ),
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 150,
      render: (eventType: string) => (
        <Text className="text-white">{formatEventName({ ...events[0], eventType })}</Text>
      ),
    },
    {
      title: '球员',
      key: 'player',
      width: 150,
      render: (_: any, record: ScoreEvent) => (
        <Text className="text-white">
          {record.playerNumber && `#${record.playerNumber} `}
          {record.playerName}
        </Text>
      ),
    },
    {
      title: '得分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points: number) => (
        <Text className={`text-xl font-bold ${points > 0 ? 'text-green-400' : 'text-gray-400'}`}>
          {points > 0 ? `+${points}` : '-'}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ScoreEvent) => (
        <Popconfirm
          title="确认撤销此事件？"
          onConfirm={() => handleRevertEvent(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" danger icon={<UndoOutlined />}>
            撤销
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (!match) {
    return <Content className="p-8">加载中...</Content>;
  }

  return (
    <Layout className="min-h-screen bg-[#0A0E27]">
      <Content className="p-6">
        <div className="mb-6">
          <Title level={2} className="text-white mb-2">
            <HistoryOutlined className="mr-2 text-primary-cyan" />
            得分历史
          </Title>
          <Text className="text-gray-400">
            {match.name} · {match.sport === 'basketball' ? '篮球' : '足球'}
          </Text>
        </div>

        {/* 筛选条件 */}
        <Card className="mb-6 bg-[#121A3A] border-[#232D56]" bordered={false}>
          <Space size="large" wrap>
            <div>
              <Text className="text-gray-400 block mb-2">队伍</Text>
              <Select
                value={filterTeam}
                onChange={setFilterTeam}
                style={{ width: 150 }}
              >
                <Option value="all">全部</Option>
                <Option value="home">{match.homeTeam.name}</Option>
                <Option value="away">{match.awayTeam.name}</Option>
              </Select>
            </div>

            <div>
              <Text className="text-gray-400 block mb-2">节次</Text>
              <Select
                value={filterPeriod}
                onChange={setFilterPeriod}
                style={{ width: 150 }}
              >
                <Option value="all">全部</Option>
                <Option value={1}>第1节</Option>
                <Option value={2}>第2节</Option>
                <Option value={3}>第3节</Option>
                <Option value={4}>第4节</Option>
              </Select>
            </div>

            <div>
              <Text className="text-gray-400 block mb-2">事件类型</Text>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 200 }}
              >
                <Option value="all">全部</Option>
                {match.sport === 'basketball' ? (
                  <>
                    <Option value="free_throw_make">罚球命中</Option>
                    <Option value="two_point_make">两分球命中</Option>
                    <Option value="three_point_make">三分球命中</Option>
                    <Option value="foul">犯规</Option>
                    <Option value="timeout">暂停</Option>
                  </>
                ) : (
                  <>
                    <Option value="goal">进球</Option>
                    <Option value="penalty">点球</Option>
                    <Option value="own_goal">乌龙球</Option>
                    <Option value="foul">犯规</Option>
                    <Option value="yellow_card">黄牌</Option>
                    <Option value="red_card">红牌</Option>
                  </>
                )}
              </Select>
            </div>

            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setFilterTeam('all');
                setFilterPeriod('all');
                setFilterType('all');
              }}
            >
              重置筛选
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={loadEvents}
            >
              刷新
            </Button>
          </Space>
        </Card>

        {/* 表格视图 */}
        <Card
          title={
            <Space>
              <HistoryOutlined className="text-primary-cyan" />
              <span className="text-white">事件列表</span>
              <Tag color="blue">共 {filteredEvents.length} 条</Tag>
            </Space>
          }
          className="mb-6 bg-[#121A3A] border-[#232D56]"
          bordered={false}
        >
          <Table
            columns={columns}
            dataSource={filteredEvents}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>

        {/* 时间线视图 */}
        <Card
          title={
            <Space>
              <HistoryOutlined className="text-primary-cyan" />
              <span className="text-white">时间线</span>
            </Space>
          }
          className="bg-[#121A3A] border-[#232D56]"
          bordered={false}
        >
          <Timeline
            mode="left"
            items={filteredEvents.slice(-10).reverse().map((event) => ({
              color: getEventColor(event),
              children: (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag color={getEventColor(event)}>
                      {event.team === 'home' ? match.homeTeam.name : match.away.name}
                    </Tag>
                    <Text className="text-white font-bold">
                      {formatEventName(event)}
                    </Text>
                    {event.points > 0 && (
                      <Tag color="green">+{event.points}</Tag>
                    )}
                  </div>
                  <Text className="text-gray-400 text-sm">
                    第{event.period}节 {formatTime(event.time)}
                    {event.playerNumber && ` · #${event.playerNumber}`}
                    {event.playerName && ` ${event.playerName}`}
                  </Text>
                </div>
              ),
            }))}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ScoreHistory;
