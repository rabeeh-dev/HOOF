import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Checkbox, Radio, Button, Space, Modal } from 'antd';

const schema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters long'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number starting with 6-9'),
  houseName: z.string().min(2, 'House name/Flat is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  addressType: z.enum(['Home', 'Office', 'Other']),
  isDefault: z.boolean().default(false),
});

const AddressForm = ({ 
  visible = false, 
  initialValues = null, 
  onSubmit, 
  onCancel,
  loading = false
}) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      mobile: '',
      houseName: '',
      pincode: '',
      city: '',
      state: '',
      addressType: 'Home',
      isDefault: false
    }
  });

  // Reset form when modal opens or initialValues change
  useEffect(() => {
    if (visible) {
      if (initialValues) {
        reset({
          fullName: initialValues.fullName || '',
          mobile: initialValues.mobile || '',
          houseName: initialValues.houseName || '',
          pincode: initialValues.pincode || '',
          city: initialValues.city || '',
          state: initialValues.state || '',
          addressType: initialValues.addressType || 'Home',
          isDefault: initialValues.isDefault || false
        });
      } else {
        reset({
          fullName: '',
          mobile: '',
          houseName: '',
          pincode: '',
          city: '',
          state: '',
          addressType: 'Home',
          isDefault: false
        });
      }
    }
  }, [visible, initialValues, reset]);

  return (
    <Modal
      open={visible}
      title={initialValues ? "Edit Address" : "Add Address"}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ marginTop: 16 }}>
        <Form.Item 
          label="Full Name" 
          validateStatus={errors.fullName ? 'error' : ''} 
          help={errors.fullName?.message}
        >
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="e.g. John Doe" />}
          />
        </Form.Item>

        <Form.Item 
          label="Mobile Number" 
          validateStatus={errors.mobile ? 'error' : ''} 
          help={errors.mobile?.message}
        >
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => <Input {...field} placeholder="10-digit number" />}
          />
        </Form.Item>

        <Form.Item 
          label="House Name / Flat No. / Street" 
          validateStatus={errors.houseName ? 'error' : ''} 
          help={errors.houseName?.message}
        >
          <Controller
            name="houseName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="House name or number" />}
          />
        </Form.Item>

        <Form.Item 
          label="Pincode" 
          validateStatus={errors.pincode ? 'error' : ''} 
          help={errors.pincode?.message}
        >
          <Controller
            name="pincode"
            control={control}
            render={({ field }) => <Input {...field} maxLength={6} placeholder="6-digit pincode" />}
          />
        </Form.Item>

        <Form.Item 
          label="City" 
          validateStatus={errors.city ? 'error' : ''} 
          help={errors.city?.message}
        >
          <Controller
            name="city"
            control={control}
            render={({ field }) => <Input {...field} placeholder="City Name" />}
          />
        </Form.Item>

        <Form.Item 
          label="State" 
          validateStatus={errors.state ? 'error' : ''} 
          help={errors.state?.message}
        >
          <Controller
            name="state"
            control={control}
            render={({ field }) => <Input {...field} placeholder="State Name" />}
          />
        </Form.Item>

        <Form.Item 
          label="Address Type" 
          validateStatus={errors.addressType ? 'error' : ''} 
          help={errors.addressType?.message}
        >
          <Controller
            name="addressType"
            control={control}
            render={({ field }) => (
              <Radio.Group {...field}>
                <Radio value="Home">Home (All day delivery)</Radio>
                <Radio value="Office">Office (10 AM - 5 PM)</Radio>
                <Radio value="Other">Other</Radio>
              </Radio.Group>
            )}
          />
        </Form.Item>

        <Form.Item>
          <Controller
            name="isDefault"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Checkbox 
                {...field}
                checked={value} 
                onChange={(e) => onChange(e.target.checked)}
              >
                Set as Default Address
              </Checkbox>
            )}
          />
        </Form.Item>

        <Form.Item style={{ margin: '24px 0 0 0', textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
              Save Address
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressForm;
