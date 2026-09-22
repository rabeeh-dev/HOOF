import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const couponSchema = z.object({
  couponCode: z.string().trim().min(2, 'Coupon code is required'),
  description: z.string().trim().min(3, 'Description is required'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0, 'Discount cannot be negative'),
  minPurchaseAmount: z.coerce.number().min(0, 'Minimum spend cannot be negative'),
  maxDiscountAmount: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  usageLimit: z.coerce.number().int().min(1, 'Usage limit must be at least 1')
});

const toDateInput = (date) => date ? new Date(date).toISOString().slice(0, 10) : '';

const CouponForm = ({ initialValues, loading, submitLabel = 'Save Coupon', onSubmit, onCancel }) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      couponCode: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: '',
      expiryDate: '',
      usageLimit: 1
    }
  });

  const discountType = watch('discountType');

  useEffect(() => {
    if (!initialValues) return;
    reset({
      couponCode: initialValues.couponCode || '',
      description: initialValues.description || '',
      discountType: initialValues.discountType || 'percentage',
      discountValue: initialValues.discountValue || 0,
      minPurchaseAmount: initialValues.minPurchaseAmount || 0,
      maxDiscountAmount: initialValues.maxDiscountAmount ?? '',
      expiryDate: toDateInput(initialValues.expiryDate),
      usageLimit: initialValues.usageLimit || 1
    });
  }, [initialValues, reset]);

  const submitForm = (values) => {
    onSubmit({
      ...values,
      couponCode: values.couponCode.toUpperCase(),
      maxDiscountAmount: values.maxDiscountAmount === '' ? undefined : values.maxDiscountAmount
    });
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(submitForm)}>
      <Controller
        name="couponCode"
        control={control}
        render={({ field }) => (
          <Form.Item label="Coupon Code" validateStatus={errors.couponCode ? 'error' : ''} help={errors.couponCode?.message}>
            <Input {...field} placeholder="WELCOME10" />
          </Form.Item>
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Form.Item label="Description" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
            <Input.TextArea {...field} rows={3} placeholder="Short internal description" />
          </Form.Item>
        )}
      />
      <Space size={16} style={{ width: '100%' }} align="start" wrap>
        <Controller
          name="discountType"
          control={control}
          render={({ field }) => (
            <Form.Item label="Discount Type">
              <Select
                {...field}
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed amount' }
                ]}
                style={{ width: 220 }}
              />
            </Form.Item>
          )}
        />
        <Controller
          name="discountValue"
          control={control}
          render={({ field }) => (
            <Form.Item label="Discount Value" validateStatus={errors.discountValue ? 'error' : ''} help={errors.discountValue?.message}>
              <InputNumber {...field} min={0} precision={discountType === 'percentage' ? 0 : 2} style={{ width: 220 }} />
            </Form.Item>
          )}
        />
        <Controller
          name="maxDiscountAmount"
          control={control}
          render={({ field }) => (
            <Form.Item label="Maximum Discount" validateStatus={errors.maxDiscountAmount ? 'error' : ''} help={errors.maxDiscountAmount?.message}>
              <InputNumber {...field} min={0} disabled={discountType === 'fixed'} style={{ width: 220 }} />
            </Form.Item>
          )}
        />
      </Space>
      <Space size={16} style={{ width: '100%' }} align="start" wrap>
        <Controller
          name="minPurchaseAmount"
          control={control}
          render={({ field }) => (
            <Form.Item label="Minimum Spend" validateStatus={errors.minPurchaseAmount ? 'error' : ''} help={errors.minPurchaseAmount?.message}>
              <InputNumber {...field} min={0} style={{ width: 220 }} />
            </Form.Item>
          )}
        />
        <Controller
          name="usageLimit"
          control={control}
          render={({ field }) => (
            <Form.Item label="Usage Limit" validateStatus={errors.usageLimit ? 'error' : ''} help={errors.usageLimit?.message}>
              <InputNumber {...field} min={1} precision={0} style={{ width: 220 }} />
            </Form.Item>
          )}
        />
        <Controller
          name="expiryDate"
          control={control}
          render={({ field }) => (
            <Form.Item label="Expiry Date" validateStatus={errors.expiryDate ? 'error' : ''} help={errors.expiryDate?.message}>
              <Input {...field} type="date" style={{ width: 220 }} />
            </Form.Item>
          )}
        />
      </Space>
      <Space>
        <Button type="primary" htmlType="submit" loading={loading}>{submitLabel}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Space>
    </Form>
  );
};

export default CouponForm;
