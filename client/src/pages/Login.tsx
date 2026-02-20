import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../../../shared/types/index.js';

const { Title } = Typography;
const { TabPane } = Tabs;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('登录成功！');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { username: string; email: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        role: UserRole.SCORE_OPERATOR,
      });
      message.success('注册成功！');
      setActiveTab('login');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-cyan/10 via-transparent to-transparent" />
      
      <Card className="w-full max-w-md bg-dark-800/80 backdrop-blur-md border-primary-cyan/20 shadow-2xl shadow-primary-cyan/10">
        <div className="text-center mb-8">
          <Title level={2} className="text-primary-cyan mb-2">
            Event Control System
          </Title>
          <p className="text-text-secondary">企业级赛事控制系统 v2.0.0-pro</p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <TabPane tab="登录" key="login">
            <Form onFinish={handleLogin} layout="vertical" size="large">
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-primary-cyan" />}
                  placeholder="用户名"
                  className="bg-dark-700 border-dark-600 text-text-primary"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-primary-cyan" />}
                  placeholder="密码"
                  className="bg-dark-700 border-dark-600 text-text-primary"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="bg-gradient-to-r from-primary-cyan to-primary-green hover:from-primary-green hover:to-primary-cyan border-none text-dark-900 font-semibold"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="注册" key="register">
            <Form onFinish={handleRegister} layout="vertical" size="large">
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-primary-cyan" />}
                  placeholder="用户名"
                  className="bg-dark-700 border-dark-600 text-text-primary"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-primary-cyan" />}
                  placeholder="邮箱"
                  className="bg-dark-700 border-dark-600 text-text-primary"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-primary-cyan" />}
                  placeholder="密码"
                  className="bg-dark-700 border-dark-600 text-text-primary"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-primary-cyan" />}
                  placeholder="确认密码"
                  className="bg-dark-700 border-dark-600 text-text-primary"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="bg-gradient-to-r from-primary-pink to-primary-yellow hover:from-primary-yellow hover:to-primary-pink border-none text-dark-900 font-semibold"
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>

        <div className="mt-6 text-center text-text-secondary text-sm">
          <p>企业级赛事控制系统 v2.0.0-pro</p>
          <p>支持多角色权限管理 | 实时数据同步 | 专业计分计时</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
