import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, Row, Col, Typography, Form, Input, Button, Spin, Space, message, Alert } from 'antd';
import { FaArrowLeft, FaKey } from 'react-icons/fa';
import { profileService } from '../api/profile';
import EditProfileForm from '../components/EditProfileForm';

const { Title, Text } = Typography;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const EditProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Query Profile Details
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await profileService.getProfile();
      return res.data?.user || {};
    }
  });

  // Password Form RHF
  const { control, handleSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  // Save Profile Mutation
  const saveProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      message.success('Profile details updated successfully.');
      navigate('/profile');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to update profile.');
    }
  });

  // Save Password Mutation
  const savePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: () => {
      message.success('Password updated successfully.');
      resetPasswordForm();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to update password.');
    }
  });

  const handleProfileSubmit = (formData) => {
    setProfileSaving(true);
    saveProfileMutation.mutate(formData, {
      onSettled: () => setProfileSaving(false)
    });
  };

  const handlePasswordSubmit = (formData) => {
    setPasswordSaving(true);
    savePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    }, {
      onSettled: () => setPasswordSaving(false)
    });
  };

  const handleEmailRequest = async () => {
    try {
      const res = await profileService.requestPasswordResetEmail();
      if (res.data?.success || res.status === 200) {
        message.success('A password reset link has been dispatched to your email.');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to send reset link.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading editor forms..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Edit Profile</Title>
        <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Back to Account
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Edit info form */}
        <Col xs={24} md={12}>
          <Card title="Update Profile Details" style={{ borderRadius: 12 }}>
            <EditProfileForm 
              user={user}
              onSubmit={handleProfileSubmit}
              onCancel={() => navigate('/profile')}
              loading={profileSaving}
            />
          </Card>
        </Col>

        {/* Right Column: Edit password form */}
        <Col xs={24} md={12}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {user.authProvider === 'local' ? (
              <Card title="Change Account Password" style={{ borderRadius: 12 }}>
                <Form layout="vertical" onFinish={handleSubmit(handlePasswordSubmit)}>
                  <Form.Item 
                    label="Current Password" 
                    validateStatus={passwordErrors.currentPassword ? 'error' : ''} 
                    help={passwordErrors.currentPassword?.message}
                  >
                    <Controller
                      name="currentPassword"
                      control={control}
                      render={({ field }) => <Input.Password {...field} />}
                    />
                  </Form.Item>

                  <Form.Item 
                    label="New Password" 
                    validateStatus={passwordErrors.newPassword ? 'error' : ''} 
                    help={passwordErrors.newPassword?.message}
                  >
                    <Controller
                      name="newPassword"
                      control={control}
                      render={({ field }) => <Input.Password {...field} />}
                    />
                  </Form.Item>

                  <Form.Item 
                    label="Confirm New Password" 
                    validateStatus={passwordErrors.confirmPassword ? 'error' : ''} 
                    help={passwordErrors.confirmPassword?.message}
                  >
                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => <Input.Password {...field} />}
                    />
                  </Form.Item>

                  <Form.Item style={{ margin: '24px 0 0 0', textAlign: 'right' }}>
                    <Button type="primary" htmlType="submit" loading={passwordSaving} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ) : (
              <Alert 
                message="OAuth Account Connected"
                description="This account is linked via Google OAuth. Password changes are managed directly by Google."
                type="info"
                showIcon
              />
            )}

            {user.authProvider === 'local' && (
              <Card title="Alternative Recovery Options" style={{ borderRadius: 12 }}>
                <Paragraph style={{ fontSize: '13px', color: '#666' }}>
                  If you forgot your password or prefer utilizing email authentication, you can dispatch a reset link straight to your registered email.
                </Paragraph>
                <Button 
                  type="default" 
                  icon={<FaKey />} 
                  onClick={handleEmailRequest}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Send Reset Link to Email
                </Button>
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default EditProfile;
