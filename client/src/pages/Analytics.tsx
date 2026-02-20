import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  Statistic,
  Tag,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  TrophyOutlined,
  TrendingUpOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { analyticsService } from '../services/analytics';
import { matchService } from '../services/match';
import { scoreEngineService } from '../services/scoreEngine';

const { Title, Text } = Typography;
const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface Match {
  id: string;
  name: string;
  sport: string;
  status: string;
  startTime: string;
}

interface StatsData {
  totalMatches: number;
  liveMatches: number;
  totalScored: number;
  averageScore: number;
}

interface TrendData {
  date: string;
  matches: number;
  avgScore: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalMatches: 0,
    liveMatches: 0,
    totalScored: 0,
    averageScore: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [matchStats, setMatchStats] = useState<any>(null);

  useEffect(() => {
    loadMatches();
    loadGlobalStats();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await matchService.listMatches({ limit: 100 });
      setMatches(data.matches);
    } catch (error) {
      console.error('加载比赛列表失败', error);
    }
  };

  const loadGlobalStats = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async (dateRange: any) => {
    try {
      setLoading(true);
      const data = await analyticsService.getMatchTrends({
        startDate: dateRange[0]?.toISOString(),
        endDate: dateRange[1]?.toISOString(),
      });
      setTrendData(data);
    } catch (error) {
      console.error('加载趋势数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchStats = async (matchId: string) => {
    try {
      setLoading(true);
      const data = await scoreEngineService.getMatchStats(matchId);
      setMatchStats(data);
    } catch (error) {
      console.error('加载比赛统计失败', error);
    } finally {
      setLoading(false);
    }
  };

  const statsColumns = [
    {
      title: '指标',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text className="text-white">{text}</Text>,
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (text: any) => <Text className="text-primary-cyan font-bold text-lg">{text}</Text>,
    },
  ];

  const trendColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => <Text className="text-white">{text}</Text>,
    },
    {
      title: '比赛数',
      dataIndex: 'matches',
      key: 'matches',
      render: (text: number) => <Text className="text-white">{text}</Text>,
    },
    {
      title: '平均得分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (text: number) => <Text className="text-primary-cyan">{text}</Text>,
    },
  ];

  return (
    <Layout className="min-h-screen bg-[#0A0E27]">
      <Content className="p-6">
        <div className="mb-6">
          <Title level={2} className="text-white mb-2">
            <TrendingUpOutlined className="mr-2 text-primary-cyan" />
            数据分析中心
          </Title>
          <Text className="text-gray-400">查看比赛统计、趋势分析和数据洞察</Text>
        </div>

        {/* 筛选条件 */}
        <Card className="mb-6 bg-[#121A3A] border-[#232D56]" bordered={false}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Text className="text-gray-400 block mb-2">选择比赛</Text>
              <Select
                className="w-full"
                placeholder="选择比赛"
                value={selectedMatch}
                onChange={(value) => {
                  setSelectedMatch(value);
                  if (value) loadMatchStats(value);
                }}
                allowClear
              >
                {matches.map((match) => (
                  <Option key={match.id} value={match.id}>
                    {match.name}
                    <Tag className="ml-2">{match.status === 'live' ? '进行中' : match.status === 'completed' ? '已结束' : '未开始'}</Tag>
                  </Option>
                ))}
              </Select>
            </Col>

            <Col span={6}>
              <Text className="text-gray-400 block mb-2">日期范围</Text>
              <RangePicker
                className="w-full"
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    loadTrendData(dates);
                  }
                }}
              />
            </Col>

            <Col span={4}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadGlobalStats();
                  loadMatches();
                }}
              >
                刷新
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 全局统计卡片 */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0" bordered={false}>
              <Statistic
                title={<Text className="text-white opacity-80">总比赛数</Text>}
                value={stats.totalMatches}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card className="bg-gradient-to-br from-cyan-600 to-cyan-800 border-0" bordered={false}>
              <Statistic
                title={<Text className="text-white opacity-80">进行中</Text>}
                value={stats.liveMatches}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-0" bordered={false}>
              <Statistic
                title={<Text className="text-white opacity-80">总得分</Text>}
                value={stats.totalScored}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card className="bg-gradient-to-br from-pink-600 to-pink-800 border-0" bordered={false}>
              <Statistic
                title={<Text className="text-white opacity-80">平均得分</Text>}
                value={stats.averageScore}
                precision={2}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 趋势分析 */}
        <Card
          title={
            <Space>
              <LineChartOutlined className="text-primary-cyan" />
              <span className="text-white">趋势分析</span>
            </Space>
          }
          className="mb-6 bg-[#121A3A] border-[#232D56]"
          bordered={false}
        >
          <Table
            columns={trendColumns}
            dataSource={trendData}
            rowKey="date"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* 比赛详细统计 */}
        {matchStats && (
          <Row gutter={16}>
            <Col span={12}>
              <Card
                title={
                  <Space>
                    <TrophyOutlined className="text-primary-cyan" />
                    <span className="text-white">比赛统计</span>
                  </Space>
                }
                className="bg-[#121A3A] border-[#232D56]"
                bordered={false}
              >
                <Table
                  columns={statsColumns}
                  dataSource={[
                    { key: '1', name: '总得分', value: matchStats.totalScore },
                    { key: '2', name: '主场得分', value: matchStats.homeScore },
                    { key: '3', name: '客场得分', value: matchStats.awayScore },
                    { key: '4', name: '总事件数', value: matchStats.totalEvents },
                    { key: '5', name: '进球率', value: `${(matchStats.fieldGoalPercentage * 100).toFixed(1)}%` },
                  ]}
                  rowKey="key"
                  pagination={false}
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined className="text-primary-cyan" />
                    <span className="text-white">队伍表现</span>
                  </Space>
                }
                className="bg-[#121A3A] border-[#232D56]"
                bordered={false}
              >
                <Table
                  columns={statsColumns}
                  dataSource={[
                    { key: '1', name: '主队投篮命中率', value: `${(matchStats.homeStats?.fieldGoalPercentage * 100 || 0).toFixed(1)}%` },
                    { key: '2', name: '客队投篮命中率', value: `${(matchStats.awayStats?.fieldGoalPercentage * 100 || 0).toFixed(1)}%` },
                    { key: '3', name: '主队三分命中率', value: `${(matchStats.homeStats?.threePointPercentage * 100 || 0).toFixed(1)}%` },
                    { key: '4', name: '客队三分命中率', value: `${(matchStats.awayStats?.threePointPercentage * 100 || 0).toFixed(1)}%` },
                    { key: '5', name: '主队罚球命中率', value: `${(matchStats.homeStats?.freeThrowPercentage * 100 || 0).toFixed(1)}%` },
                    { key: '6', name: '客队罚球命中率', value: `${(matchStats.awayStats?.freeThrowPercentage * 100 || 0).toFixed(1)}%` },
                  ]}
                  rowKey="key"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default Analytics;
