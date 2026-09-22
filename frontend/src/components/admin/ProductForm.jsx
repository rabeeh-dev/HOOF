import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Select, InputNumber, Button, Card, Space, Row, Col, Divider } from 'antd';
import { FaPlus, FaTrash } from 'react-icons/fa';
import ProductImageUploader from './ProductImageUploader';

const { TextArea } = Input;

const schema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  regularPrice: z.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  salePrice: z.number({ invalid_type_error: 'Required' }).positive('Must be positive'),
  variants: z.array(z.object({
    size: z.string().min(1, 'Size is required'),
    stock: z.number({ invalid_type_error: 'Required' }).int().min(0, 'Must be >= 0')
  })).min(1, 'At least one variant is required')
}).refine(data => data.salePrice <= data.regularPrice, {
  message: 'Sale price cannot exceed regular price',
  path: ['salePrice']
});

const ProductForm = ({ initialValues = null, categories = [], onSubmit, loading = false, isEdit = false }) => {
  const [newFiles, setNewFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: '',
      description: '',
      brand: '',
      category: '',
      regularPrice: 0,
      salePrice: 0,
      variants: [{ size: '', stock: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  useEffect(() => {
    if (initialValues) {
      reset({
        productName: initialValues.productName || '',
        description: initialValues.description || '',
        brand: initialValues.brand || '',
        category: initialValues.category?._id || initialValues.category || '',
        regularPrice: initialValues.regularPrice || 0,
        salePrice: initialValues.salePrice || 0,
        variants: initialValues.variants?.length > 0
          ? initialValues.variants.map(v => ({ size: v.size, stock: v.quantity }))
          : [{ size: '', stock: 0 }]
      });
      setExistingImages(initialValues.productImage || []);
    }
  }, [initialValues, reset]);

  const handleImagesChange = (files, existing) => {
    setNewFiles(files);
    setExistingImages(existing);
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append('productName', data.productName);
    formData.append('description', data.description);
    formData.append('brand', data.brand);
    formData.append('category', data.category);
    formData.append('regularPrice', data.regularPrice);
    formData.append('salePrice', data.salePrice);

    // Append variants as arrays
    data.variants.forEach(v => {
      formData.append('variantSize', v.size);
      formData.append('variantStock', v.stock);
    });

    // Append new image files
    newFiles.forEach(file => {
      formData.append('productImages', file);
    });

    // Append existing images as JSON string
    if (isEdit) {
      formData.append('existingImages', JSON.stringify(existingImages));
    }

    onSubmit(formData);
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)}>
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Product Details" style={{ borderRadius: 8, marginBottom: 24 }}>
            <Form.Item label="Product Name" validateStatus={errors.productName ? 'error' : ''} help={errors.productName?.message}>
              <Controller name="productName" control={control} render={({ field }) => <Input {...field} placeholder="Enter product name" />} />
            </Form.Item>

            <Form.Item label="Description" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
              <Controller name="description" control={control} render={({ field }) => <TextArea {...field} rows={4} placeholder="Product description..." />} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Brand" validateStatus={errors.brand ? 'error' : ''} help={errors.brand?.message}>
                  <Controller name="brand" control={control} render={({ field }) => <Input {...field} placeholder="Brand name" />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Category" validateStatus={errors.category ? 'error' : ''} help={errors.category?.message}>
                  <Controller name="category" control={control} render={({ field }) => (
                    <Select {...field} placeholder="Select category" options={categories.map(c => ({ label: c.name, value: c._id }))} />
                  )} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Regular Price (₹)" validateStatus={errors.regularPrice ? 'error' : ''} help={errors.regularPrice?.message}>
                  <Controller name="regularPrice" control={control} render={({ field }) => (
                    <InputNumber {...field} style={{ width: '100%' }} min={0} />
                  )} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Sale Price (₹)" validateStatus={errors.salePrice ? 'error' : ''} help={errors.salePrice?.message}>
                  <Controller name="salePrice" control={control} render={({ field }) => (
                    <InputNumber {...field} style={{ width: '100%' }} min={0} />
                  )} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Variants (Sizes & Stock)" style={{ borderRadius: 8, marginBottom: 24 }}>
            {errors.variants?.root && (
              <div style={{ color: '#ff4d4f', marginBottom: 12 }}>{errors.variants.root.message}</div>
            )}
            {fields.map((field, index) => (
              <Row gutter={16} key={field.id} align="middle" style={{ marginBottom: 12 }}>
                <Col xs={10}>
                  <Form.Item
                    label={index === 0 ? 'Size (UK)' : ''}
                    validateStatus={errors.variants?.[index]?.size ? 'error' : ''}
                    help={errors.variants?.[index]?.size?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller name={`variants.${index}.size`} control={control} render={({ field }) => <Input {...field} placeholder="e.g. 8" />} />
                  </Form.Item>
                </Col>
                <Col xs={10}>
                  <Form.Item
                    label={index === 0 ? 'Stock Qty' : ''}
                    validateStatus={errors.variants?.[index]?.stock ? 'error' : ''}
                    help={errors.variants?.[index]?.stock?.message}
                    style={{ marginBottom: 0 }}
                  >
                    <Controller name={`variants.${index}.stock`} control={control} render={({ field }) => (
                      <InputNumber {...field} style={{ width: '100%' }} min={0} />
                    )} />
                  </Form.Item>
                </Col>
                <Col xs={4}>
                  {fields.length > 1 && (
                    <Button type="text" danger icon={<FaTrash />} onClick={() => remove(index)} style={{ marginTop: index === 0 ? 22 : 0 }} />
                  )}
                </Col>
              </Row>
            ))}
            <Button type="dashed" onClick={() => append({ size: '', stock: 0 })} icon={<FaPlus />} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Add Variant
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Product Images" style={{ borderRadius: 8, marginBottom: 24 }}>
            <ProductImageUploader
              existingImages={existingImages}
              onImagesChange={handleImagesChange}
            />
            {!isEdit && newFiles.length === 0 && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 8 }}>At least one image is required.</div>
            )}
          </Card>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{ background: '#001529', borderColor: '#001529' }}
          >
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default ProductForm;
