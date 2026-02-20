import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Row,
  Col,
  Button,
  InputNumber,
  Select,
  Space,
  Tag,
  message,
  Modal,
  Table,
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined,
  MinusOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { timerService } from '../services/timer';
import { useWebSocket } from '../hooks/useWebSocket';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface TimerState {
  timerId: string;
  timerType: 'main' | 'period' | 'shot' | 'possession';
  mode: 'countdown' | 'countup' | 'stopwatch';
  duration: number;
  remaining: number;
  isRunning: boolean;
  lastSync: string;
}

interface MatchData {
  id: string;
  name: string;
  sport: 'basketball' | 'football';
}

const TimerControl: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [timers, setTimers] = useState<TimerState[]>([]);
  const [selectedTimer, setSelectedTimer] = useState<string>('main');
  const [settingsModal, setSettingsModal] = useState(false);
  const [newDuration, setNewDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const { data: wsData } = useWebSocket(`/match/${matchId}/timers`);

  useEffect(() => {
    loadMatch();
    loadTimers();
    const interval = setInterval(loadTimers, 1000);
    return () => clearInterval(interval);
  }, [matchId]);

  const loadMatch = async () => {
    try {
      // 实际应该从API获取
      setMatch({
        id: matchId!,
        name: 'Sample Match',
        sport: 'basketball',
      });
    } catch (error) {
      console.error('加载比赛数据失败', error);
    }
  };

  const loadTimers = async () => {
    try {
      const data = await timerService.getMatchTimers(matchId!);
      setTimers(data);
    } catch (error) {
      console.error('加载计时器失败', error);
    }
  };

  const selectedTimerData = timers.find((t) => t.timerId === selectedTimer);

  const handleStart = async () => {
    try {
      await timerService.startTimer(matchId!, selectedTimer);
      message.success('计时器已启动');
      loadTimers();
    } catch (error) {
      message.error('启动失败');
    }
  };

  const handlePause = async () => {
    try {
      await timerService.pauseTimer(matchId!, selectedTimer);
      message.success('计时器已暂停');
      loadTimers();
    } catch (error) {
      message.error('暂停失败');
    }
  };

  const handleReset = async () => {
    Modal.confirm({
      title: '确认重置？',
      content: '此操作将重置计时器到初始时间',
      onOk: async () => {
        try {
          await timerService.resetTimer(matchId!, selectedTimer);
          message.success('计时器已重置');
          loadTimers();
        } catch (error) {
          message.error('重置失败');
        }
      },
    });
  };

  const handleAddTime = async (seconds: number) => {
    try {
      await timerService.adjustTimer(matchId!, selectedTimer, seconds);
      message.success(`已${seconds > 0 ? '增加' : '减少'}${Math.abs(seconds)}秒`);
      loadTimers();
    } catch (error) {
      message.error('调整失败');
    }
  };

  const handleSetDuration = async () => {
    try {
      await timerService.setDuration(matchId!, selectedTimer, newDuration);
      message.success('时长已设置');
      setSettingsModal(false);
      loadTimers();
    } catch (error) {
      message.error('设置失败');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.abs(seconds % 60);
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerName = (type: string) => {
    const names: Record<string, string> = {
      main: '主时钟',
      period: '节次时钟',
      shot: match?.sport === 'basketball' ? '进攻时钟' : '控球时间',
      possession: '控球时间',
    };
    return names[type] || type;
  };

  const columns = [
    {
      title: '计时器',
      dataIndex: 'timerType',
      key: 'timerType',
      render: (type: string) => (
        <Text className="text-white font-bold">{getTimerName(type)}</Text>
      ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode: string) => {
        const modeLabels: Record<string, string> = {
          countdown: '倒计时',
          countup: '正计时',
          stopwatch: '秒表',
        };
        return <Tag color="blue">{modeLabels[mode]}</Tag>;
      },
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <Text className="text-gray-400">{formatTime(duration)}</Text>
      ),
    },
    {
      title: '剩余',
      dataIndex: 'remaining',
      key: 'remaining',
      render: (remaining: number) => (
        <Text className="text-primary-cyan font-bold text-xl">{formatTime(remaining)}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isRunning',
      key: 'isRunning',
      render: (isRunning: boolean) => (
        <Tag color={isRunning ? 'green' : 'default'}>
          {isRunning ? '运行中' : '已停止'}
        </Tag>
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (lastSync: string) => (
        <Text className="text-gray-500 text-sm">{new Date(lastSync).toLocaleTimeString()}</Text>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-[#0A0E27]">
      <Content className="p-6">
        <div className="mb-6">
          <Title level={2} className="text-white mb-2">
            <ClockCircleOutlined className="mr-2 text-primary-cyan" />
            计时器控制
          </Title>
          <Text className="text-gray-400">
            {match?.name} · {match?.sport === 'basketball' ? '篮球' : '足球'}比赛
          </Text>
        </div>

        {/* 当前计时器大显示 */}
        {selectedTimerData && (
          <Card
            className="mb-6 bg-[#121A3A] border-[#232D56]"
            bordered={false}
            style={{ minHeight: '300px' }}
          >
            <div className="text-center py-12">
              <div className="mb-6">
                <Tag color="blue" className="text-lg px-6 py-2">
                  {getTimerName(selectedTimerData.timerType)}
                </Tag>
              </div>
              <div className="text-9xl font-bold mb-8" style={{ color: '#00F5FF' }}>
                {formatTime(selectedTimerData.remaining)}
              </div>
              <div className="mb-6">
                <Text className="text-gray-400 text-xl">
                  总时长: {formatTime(selectedTimerData.duration)}
                </Text>
              </div>
              <Tag color={selectedTimerData.isRunning ? 'green' : 'default'} className="text-xl">
                {selectedTimerData.isRunning ? '● 运行中' : '○ 已停止'}
              </Tag>
            </div>
          </Card>
        )}

        {/* 控制按钮 */}
        <Card className="mb-6 bg-[#121A3A] border-[#232D56]" bordered={false}>
          <Space size="large" wrap>
            <Select
              value={selectedTimer}
              onChange={setSelectedTimer}
              style={{ width: 200 }}
              size="large"
            >
              {timers.map((timer) => (
                <Option key={timer.timerId} value={timer.timerId}>
                  {getTimerName(timer.timerType)}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              disabled={selectedTimerData?.isRunning}
            >
              开始
            </Button>

            <Button
              size="large"
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
              disabled={!selectedTimerData?.isRunning}
            >
              暂停
            </Button>

            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>

            <Button
              size="large"
              icon={<SettingOutlined />}
              onClick={() => {
                if (selectedTimerData) {
                  setNewDuration(selectedTimerData.duration);
                  setSettingsModal(true);
                }
              }}
            >
              设置时长
            </Button>
          </Space>

          <div className="mt-6 pt-6 border-t border-[#232D56]">
            <Text className="text-gray-400 block mb-4">快速调整时间</Text>
            <Space size="middle">
              <Button
                icon={<MinusOutlined />}
                onClick={() => handleAddTime(-1)}
              >
                -1秒
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => handleAddTime(1)}
              >
                +1秒
              </Button>
              <Button
                icon={<CaretDownOutlined />}
                onClick={() => handleAddTime(-10)}
              >
                -10秒
              </Button>
              <Button
                icon={<CaretUpOutlined />}
                onClick={() => handleAddTime(10)}
              >
                +10秒
              </Button>
              <div>
                <InputNumber
                  min={-300}
                  max={300}
                  step={10}
                  onChange={(value) => {
                    if (value) handleAddTime(value);
                  }}
                  placeholder="自定义"
                  style={{ width: 120 }}
                />
              </div>
            </Space>
          </div>
        </Card>

        {/* 所有计时器列表 */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined className="text-primary-cyan" />
              <span className="text-white">所有计时器</span>
            </Space>
          }
          className="bg-[#121A3A] border-[#232D56]"
          bordered={false}
        >
          <Table
            columns={columns}
            dataSource={timers}
            rowKey="timerId"
            pagination={false}
            onRow={(record) => ({
              onClick: () => setSelectedTimer(record.timerId),
              style: {
                cursor: 'pointer',
                background: record.timerId === selectedTimer ? '#1A2454' : 'transparent',
              },
            })}
          />
        </Card>

        {/* 设置时长模态框 */}
        <Modal
          title="设置计时器时长"
          open={settingsModal}
          onCancel={() => setSettingsModal(false)}
          onOk={handleSetDuration}
          okText="确认"
          cancelText="取消"
        >
          <div className="mb-4">
            <Text className="text-gray-400 block mb-2">计时器</Text>
            <Text className="text-white font-bold">
              {selectedTimerData && getTimerName(selectedTimerData.timerType)}
            </Text>
          </div>
          <div>
            <Text className="text-gray-400 block mb-2">时长(秒)</Text>
            <InputNumber
              min={1}
              max={3600}
              value={newDuration}
              onChange={(value) => setNewDuration(value || 0)}
              className="w-full"
            />
          </div>
          {newDuration > 0 && (
            <div className="mt-4">
              <Text className="text-gray-400 block mb-2">预览</Text>
              <Text className="text-primary-cyan text-3xl font-bold">
                {formatTime(newDuration)}
              </Text>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default TimerControl;
