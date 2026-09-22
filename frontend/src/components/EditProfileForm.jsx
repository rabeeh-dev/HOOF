import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, DatePicker, Button, Space } from 'antd';
import dayjs from 'dayjs';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number').optional().or(z.literal('')),
  dateOfBirth: z.any().optional().nullable(),
});

const EditProfileForm = ({ user = {}, onSubmit, onCancel, loading = false }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      dateOfBirth: null
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null
      });
    }
  }, [user, reset]);

  const handleFormSubmit = (data) => {
    // Convert dayjs date back to ISO string
    const formattedData = {
      ...data,
      dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).toISOString() : null
    };
    onSubmit(formattedData);
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)}>
      <Form.Item 
        label="Full Name" 
        validateStatus={errors.fullName ? 'error' : ''} 
        help={errors.fullName?.message}
      >
        <Controller
          name="fullName"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item 
        label="Phone Number" 
        validateStatus={errors.phoneNumber ? 'error' : ''} 
        help={errors.phoneNumber?.message}
      >
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => <Input {...field} placeholder="10-digit number" />}
        />
      </Form.Item>

      <Form.Item 
        label="Date of Birth" 
        validateStatus={errors.dateOfBirth ? 'error' : ''} 
        help={errors.dateOfBirth?.message}
      >
        <Controller
          name="dateOfBirth"
          control={control}
          render={({ field }) => (
            <DatePicker 
              {...field} 
              style={{ width: '100%' }} 
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          )}
        />
      </Form.Item>

      <Form.Item style={{ margin: '24px 0 0 0', textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
            Save Changes
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default EditProfileForm;
