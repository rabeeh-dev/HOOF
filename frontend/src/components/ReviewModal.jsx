import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Rate, Input, Button, Modal, Space } from 'antd';

const { TextArea } = Input;

const schema = z.object({
  rating: z.number().min(1, 'Please select a rating (1-5 stars)').max(5),
  comment: z.string().min(5, 'Review comment must be at least 5 characters long'),
});

const ReviewModal = ({ 
  visible = false, 
  initialValues = null, 
  onSubmit, 
  onCancel,
  submitting = false
}) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: 5,
      comment: ''
    }
  });

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        reset({
          rating: initialValues.rating || 5,
          comment: initialValues.comment || ''
        });
      } else {
        reset({
          rating: 5,
          comment: ''
        });
      }
    }
  }, [visible, initialValues, reset]);

  return (
    <Modal
      open={visible}
      title={initialValues ? "Edit Review" : "Write a Review"}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ marginTop: 16 }}>
        <Form.Item 
          label="Rating" 
          validateStatus={errors.rating ? 'error' : ''} 
          help={errors.rating?.message}
        >
          <Controller
            name="rating"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Rate value={value} onChange={onChange} />
            )}
          />
        </Form.Item>

        <Form.Item 
          label="Review Details" 
          validateStatus={errors.comment ? 'error' : ''} 
          help={errors.comment?.message}
        >
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <TextArea {...field} rows={4} placeholder="Tell us what you liked or disliked about this product..." />
            )}
          />
        </Form.Item>

        <Form.Item style={{ margin: '24px 0 0 0', textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
              Submit Review
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReviewModal;
