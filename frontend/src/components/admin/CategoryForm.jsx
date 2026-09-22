import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal, Form, Input } from 'antd';

const { TextArea } = Input;

const schema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters')
});

const CategoryForm = ({ initialValues = null, onSubmit, onCancel, loading = false, visible = false }) => {
  const isEdit = !!initialValues;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' }
  });

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        reset({ name: initialValues.name || '', description: initialValues.description || '' });
      } else {
        reset({ name: '', description: '' });
      }
    }
  }, [initialValues, visible, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      open={visible}
      title={isEdit ? 'Edit Category' : 'Add Category'}
      onOk={handleSubmit(handleFormSubmit)}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEdit ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Category Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Enter category name" />} />
        </Form.Item>
        <Form.Item label="Description" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
          <Controller name="description" control={control} render={({ field }) => <TextArea {...field} rows={3} placeholder="Category description..." />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryForm;
