import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, message, Spin, Result, Button } from 'antd';
import { adminService } from '../../api/admin';
import ProductForm from '../../components/admin/ProductForm';

const { Title } = Typography;

const ProductEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: product, isLoading: prodLoading, error: prodError } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const res = await adminService.getProduct(id);
      return res.data?.product || null;
    },
    enabled: !!id
  });

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await adminService.getAllCategories();
      return res.data?.categories || [];
    }
  });

  const mutation = useMutation({
    mutationFn: (formData) => adminService.updateProduct(id, formData),
    onSuccess: () => {
      message.success('Product updated successfully!');
      navigate('/admin/products');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to update product');
    }
  });

  if (prodLoading || catLoading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 100 }} />;
  }

  if (prodError || !product) {
    return (
      <Result
        status="404"
        title="Product Not Found"
        subTitle="The product you are looking for does not exist."
        extra={<Button type="primary" onClick={() => navigate('/admin/products')}>Back to Products</Button>}
      />
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Edit Product</Title>
      <ProductForm
        initialValues={product}
        categories={catData || []}
        onSubmit={(formData) => mutation.mutate(formData)}
        loading={mutation.isPending}
        isEdit={true}
      />
    </div>
  );
};

export default ProductEdit;
