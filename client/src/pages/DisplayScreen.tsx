import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Card, Typography, Row, Col, Space, Tag, Button } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useWebSocket } from '../hooks/useWebSocket';
import { matchService } from '../services/match';

const { Title, Text } = Typography;
const { Content } = Layout;

interface MatchData {
  id: string;
  name: string;
  sport: 'basketball' | 'football';
  homeTeam: {
    name: string;
    score: number;
    primaryColor: string;
    jerseyColor: string;
  };
  awayTeam: {
    name: string;
    score: number;
    primaryColor: string;
    jerseyColor: string;
  };
  status: 'scheduled' | 'live' | 'completed';
  currentPeriod: number;
  periodTime: number;
  periodTimeTotal: number;
}

const DisplayScreen: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: wsData, sendMessage } = useWebSocket(`/match/${matchId}`);

  useEffect(() => {
    loadMatchData();
    const interval = setInterval(loadMatchData, 1000); // 每秒刷新
    return () => clearInterval(interval);
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      const data = await matchService.getMatch(matchId!);
      setMatchData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载比赛数据失败', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPeriod = (period: number, sport: string) => {
    if (sport === 'basketball') {
      return period <= 4 ? `第${period}节` : `OT${period - 4}`;
    } else {
      return period <= 2 ? `第${period}半场` : `OT${period - 2}`;
    }
  };

  const calculateTimePercent = (currentTime: number, totalTime: number) => {
    return ((totalTime - currentTime) / totalTime) * 100;
  };

  if (!matchData) {
    return (
      <Content className="min-h-screen bg-black flex items-center justify-center">
        <Text className="text-white text-2xl">加载中...</Text>
      </Content>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8">
      {/* 顶部工具栏 */}
      <div className="fixed top-4 right-4 z-50">
        <Space>
          <Tag icon={<SyncOutlined spin />} color="cyan">
            {lastUpdated.toLocaleTimeString()}
          </Tag>
          <Button
            type="primary"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            全屏
          </Button>
        </Space>
      </div>

      {/* 比赛信息 */}
      <div className="text-center mb-8">
        <Title level={1} className="text-white mb-4 text-5xl font-bold">
          {matchData.name}
        </Title>
        <div className="flex items-center justify-center gap-4">
          <Tag
            color={matchData.status === 'live' ? 'red' : matchData.status === 'completed' ? 'default' : 'blue'}
            className="text-lg px-6 py-2"
          >
            {matchData.status === 'live' ? 'LIVE' : matchData.status === 'completed' ? '已结束' : '未开始'}
          </Tag>
        </div>
      </div>

      {/* 主比分板 */}
      <Card
        className="max-w-6xl mx-auto mb-8"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          border: '2px solid #00F5FF',
          boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
        }}
        bordered={false}
      >
        <Row gutter={32} align="middle" justify="center">
          {/* 主队 */}
          <Col span={10} className="text-center">
            <div
              className="rounded-lg p-6 mb-4"
              style={{ background: matchData.homeTeam.primaryColor }}
            >
              <Title level={2} className="text-white m-0 text-3xl">
                {matchData.homeTeam.name}
              </Title>
            </div>
            <div className="text-8xl font-bold mb-4" style={{ color: matchData.homeTeam.primaryColor }}>
              {matchData.homeTeam.score}
            </div>
          </Col>

          {/* 中间信息 */}
          <Col span={4} className="text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-white mb-4">
                {formatTime(matchData.periodTime)}
              </div>
              <div className="text-3xl font-bold text-primary-cyan mb-6">
                {formatPeriod(matchData.currentPeriod, matchData.sport)}
              </div>
            </div>

            {/* 时间进度条 */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div
                className="bg-primary-cyan h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${calculateTimePercent(
                    matchData.periodTime,
                    matchData.periodTimeTotal
                  )}%`,
                }}
              />
            </div>
          </Col>

          {/* 客队 */}
          <Col span={10} className="text-center">
            <div
              className="rounded-lg p-6 mb-4"
              style={{ background: matchData.awayTeam.primaryColor }}
            >
              <Title level={2} className="text-white m-0 text-3xl">
                {matchData.awayTeam.name}
              </Title>
            </div>
            <div className="text-8xl font-bold mb-4" style={{ color: matchData.awayTeam.primaryColor }}>
              {matchData.awayTeam.score}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Card
        className="max-w-4xl mx-auto"
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          borderRadius: '16px',
          border: '1px solid #232D56',
        }}
        bordered={false}
      >
        <Row gutter={24} className="text-center">
          <Col span={12}>
            <div className="mb-4">
              <Text className="text-gray-400 text-lg block mb-2">运动类型</Text>
              <Text className="text-white text-3xl font-bold">
                {matchData.sport === 'basketball' ? '篮球' : '足球'}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-4">
              <Text className="text-gray-400 text-lg block mb-2">比赛ID</Text>
              <Text className="text-primary-cyan text-3xl font-bold">
                {matchData.id}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 底部提示 */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <Text className="text-gray-500">
          大屏展示模式 | 数据实时同步中
        </Text>
      </div>
    </div>
  );
};

export default DisplayScreen;
