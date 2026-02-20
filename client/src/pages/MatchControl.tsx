import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  message,
  Modal,
  Form,
  InputNumber,
  Select,
  Table,
  Tag,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  MinusOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useWebSocket } from '../hooks/useWebSocket';
import { scoreEngineService } from '../services/scoreEngine';
import { timerService } from '../services/timer';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface MatchData {
  id: string;
  name: string;
  sport: 'basketball' | 'football';
  homeTeam: {
    id: string;
    name: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
  };
  status: 'scheduled' | 'live' | 'completed';
  currentPeriod: number;
  periodTime: number;
}

const MatchControl: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showFoulModal, setShowFoulModal] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  const { data: wsData, sendMessage } = useWebSocket(`/match/${matchId}`);

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      // 实际应该从API获取
      setMatchData({
        id: matchId!,
        name: 'Sample Match',
        sport: 'basketball',
        homeTeam: { id: '1', name: 'Home Team', score: 0 },
        awayTeam: { id: '2', name: 'Away Team', score: 0 },
        status: 'live',
        currentPeriod: 1,
        periodTime: 720, // 12 minutes in seconds
      });
    } catch (error) {
      message.error('加载比赛数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      await timerService.startTimer(matchId!, 'main');
      message.success('计时器已启动');
    } catch (error) {
      message.error('启动计时器失败');
    }
  };

  const handlePauseTimer = async () => {
    try {
      await timerService.pauseTimer(matchId!, 'main');
      message.success('计时器已暂停');
    } catch (error) {
      message.error('暂停计时器失败');
    }
  };

  const handleResetTimer = async () => {
    Modal.confirm({
      title: '确认重置计时器？',
      content: '此操作将重置当前节次时间',
      onOk: async () => {
        try {
          await timerService.resetTimer(matchId!, 'main');
          message.success('计时器已重置');
        } catch (error) {
          message.error('重置计时器失败');
        }
      },
    });
  };

  const handleAddScore = async (values: any) => {
    try {
      await scoreEngineService.addScoreEvent(matchId!, {
        team: values.team,
        eventType: values.eventType,
        playerId: values.playerId,
        playerName: values.playerName,
        playerNumber: values.playerNumber,
        period: matchData?.currentPeriod || 1,
        shotClock: values.shotClock,
      });
      message.success('得分已记录');
      setShowScoreModal(false);
      form.resetFields();
      loadMatchData();
    } catch (error) {
      message.error('记录得分失败');
    }
  };

  const handleRecordFoul = async (values: any) => {
    try {
      await scoreEngineService.recordFoul(matchId!, {
        team: values.team,
        playerId: values.playerId,
        playerName: values.playerName,
        playerNumber: values.playerNumber,
        foulType: values.foulType,
        period: matchData?.currentPeriod || 1,
      });
      message.success('犯规已记录');
      setShowFoulModal(false);
      form.resetFields();
    } catch (error) {
      message.error('记录犯规失败');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Content className="p-8">加载中...</Content>;
  }

  if (!matchData) {
    return <Content className="p-8">未找到比赛数据</Content>;
  }

  return (
    <Layout className="min-h-screen bg-[#0A0E27]">
      <Content className="p-6">
        <div className="mb-6">
          <Title level={2} className="text-white mb-2">
            {matchData.name}
          </Title>
          <Text className="text-gray-400">
            {matchData.sport === 'basketball' ? '篮球' : '足球'}比赛 · {matchData.id}
          </Text>
        </div>

        {/* 比分板 */}
        <Card className="mb-6 bg-[#121A3A] border-[#232D56]" bordered={false}>
          <Row gutter={24} align="middle" justify="center">
            <Col span={8} className="text-center">
              <Title level={3} className="text-white mb-2">
                {matchData.homeTeam.name}
              </Title>
              <Title level={1} className="text-primary-cyan m-0 text-6xl">
                {matchData.homeTeam.score}
              </Title>
            </Col>

            <Col span={8} className="text-center">
              <div className="mb-4">
                <Tag color={matchData.status === 'live' ? 'cyan' : 'default'}>
                  {matchData.status === 'live' ? '进行中' : matchData.status === 'completed' ? '已结束' : '未开始'}
                </Tag>
              </div>
              <div className="text-4xl font-bold text-white mb-4">
                {formatTime(matchData.periodTime)}
              </div>
              <Text className="text-gray-400 text-lg">
                第 {matchData.currentPeriod} 节
              </Text>
            </Col>

            <Col span={8} className="text-center">
              <Title level={3} className="text-white mb-2">
                {matchData.awayTeam.name}
              </Title>
              <Title level={1} className="text-primary-cyan m-0 text-6xl">
                {matchData.awayTeam.score}
              </Title>
            </Col>
          </Row>
        </Card>

        {/* 计时器控制 */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined className="text-primary-cyan" />
              <span className="text-white">计时器控制</span>
            </Space>
          }
          className="mb-6 bg-[#121A3A] border-[#232D56]"
          bordered={false}
          extra={
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowTimerSettings(true)}
            >
              设置
            </Button>
          }
        >
          <Row gutter={16}>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartTimer}
              >
                开始
              </Button>
            </Col>
            <Col>
              <Button
                size="large"
                icon={<PauseCircleOutlined />}
                onClick={handlePauseTimer}
              >
                暂停
              </Button>
            </Col>
            <Col>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleResetTimer}
              >
                重置
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 得分控制 */}
        <Card
          title={
            <Space>
              <PlusOutlined className="text-primary-cyan" />
              <span className="text-white">得分控制</span>
            </Space>
          }
          className="mb-6 bg-[#121A3A] border-[#232D56]"
          bordered={false}
        >
          <Row gutter={24}>
            <Col span={12}>
              <div className="mb-4">
                <Text className="text-gray-400 block mb-2">选择队伍</Text>
                <Select
                  value={selectedTeam}
                  onChange={setSelectedTeam}
                  className="w-full"
                  size="large"
                >
                  <Option value="home">{matchData.homeTeam.name}</Option>
                  <Option value="away">{matchData.awayTeam.name}</Option>
                </Select>
              </div>
            </Col>

            {matchData.sport === 'basketball' && (
              <>
                <Col span={4}>
                  <Button
                    size="large"
                    className="w-full h-16 text-xl font-bold"
                    onClick={() => form.setFieldsValue({ team: selectedTeam, eventType: 'free_throw_make' })}
                  >
                    +1
                  </Button>
                </Col>
                <Col span={4}>
                  <Button
                    type="primary"
                    size="large"
                    className="w-full h-16 text-xl font-bold"
                    onClick={() => form.setFieldsValue({ team: selectedTeam, eventType: 'two_point_make' })}
                  >
                    +2
                  </Button>
                </Col>
                <Col span={4}>
                  <Button
                    danger
                    size="large"
                    className="w-full h-16 text-xl font-bold"
                    onClick={() => form.setFieldsValue({ team: selectedTeam, eventType: 'three_point_make' })}
                  >
                    +3
                  </Button>
                </Col>
              </>
            )}

            {matchData.sport === 'football' && (
              <Col span={12}>
                <Button
                  type="primary"
                  size="large"
                  className="w-full h-16 text-xl font-bold"
                  onClick={() => form.setFieldsValue({ team: selectedTeam, eventType: 'goal' })}
                >
                  进球
                </Button>
              </Col>
            )}

            <Col span={12}>
              <Button
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setShowScoreModal(true)}
              >
                详细得分
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 犯规和其他控制 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={
                <Space>
                  <FlagOutlined className="text-orange-500" />
                  <span className="text-white">犯规控制</span>
                </Space>
              }
              className="bg-[#121A3A] border-[#232D56]"
              bordered={false}
            >
              <Space direction="vertical" className="w-full">
                <Button
                  block
                  onClick={() => {
                    form.setFieldsValue({ team: selectedTeam, foulType: 'personal' });
                    setShowFoulModal(true);
                  }}
                >
                  普通犯规
                </Button>
                <Button
                  block
                  danger
                  onClick={() => {
                    form.setFieldsValue({ team: selectedTeam, foulType: 'technical' });
                    setShowFoulModal(true);
                  }}
                >
                  技术犯规
                </Button>
                {matchData.sport === 'basketball' && (
                  <>
                    <Button
                      block
                      onClick={() => {
                        form.setFieldsValue({ team: selectedTeam, foulType: 'offensive' });
                        setShowFoulModal(true);
                      }}
                    >
                      进攻犯规
                    </Button>
                  </>
                )}
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined className="text-primary-cyan" />
                  <span className="text-white">其他控制</span>
                </Space>
              }
              className="bg-[#121A3A] border-[#232D56]"
              bordered={false}
            >
              <Space direction="vertical" className="w-full">
                <Button block onClick={() => scoreEngineService.callTimeout(matchId!, { team: selectedTeam })}>
                  {selectedTeam === 'home' ? matchData.homeTeam.name : matchData.awayTeam.name} 暂停
                </Button>
                <Button block>节次切换</Button>
                <Button block>比赛结束</Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 得分模态框 */}
        <Modal
          title="记录得分"
          open={showScoreModal}
          onCancel={() => setShowScoreModal(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleAddScore}>
            <Form.Item
              name="team"
              label="队伍"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="home">{matchData.homeTeam.name}</Option>
                <Option value="away">{matchData.awayTeam.name}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="eventType"
              label="得分类型"
              rules={[{ required: true }]}
            >
              <Select>
                {matchData.sport === 'basketball' ? (
                  <>
                    <Option value="free_throw_make">罚球 (+1)</Option>
                    <Option value="two_point_make">两分球 (+2)</Option>
                    <Option value="three_point_make">三分球 (+3)</Option>
                  </>
                ) : (
                  <>
                    <Option value="goal">进球</Option>
                    <Option value="penalty">点球</Option>
                    <Option value="own_goal">乌龙球</Option>
                  </>
                )}
              </Select>
            </Form.Item>

            <Form.Item
              name="playerNumber"
              label="球员号码"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={99} className="w-full" />
            </Form.Item>

            <Form.Item
              name="playerName"
              label="球员姓名"
            >
              <Select showSearch>
                {/* 动态加载球员列表 */}
              </Select>
            </Form.Item>

            {matchData.sport === 'basketball' && (
              <Form.Item name="shotClock" label="进攻时钟">
                <InputNumber min={0} max={24} className="w-full" />
              </Form.Item>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                确认
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 犯规模态框 */}
        <Modal
          title="记录犯规"
          open={showFoulModal}
          onCancel={() => setShowFoulModal(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleRecordFoul}>
            <Form.Item name="team" label="队伍" rules={[{ required: true }]}>
              <Select>
                <Option value="home">{matchData.homeTeam.name}</Option>
                <Option value="away">{matchData.awayTeam.name}</Option>
              </Select>
            </Form.Item>

            <Form.Item name="foulType" label="犯规类型" rules={[{ required: true }]}>
              <Select>
                <Option value="personal">普通犯规</Option>
                <Option value="technical">技术犯规</Option>
                {matchData.sport === 'basketball' && (
                  <>
                    <Option value="offensive">进攻犯规</Option>
                    <Option value="flagrant">恶意犯规</Option>
                  </>
                )}
              </Select>
            </Form.Item>

            <Form.Item name="playerNumber" label="球员号码" rules={[{ required: true }]}>
              <InputNumber min={0} max={99} className="w-full" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                确认
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default MatchControl;
