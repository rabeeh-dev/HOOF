import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Typography, message, Spin } from 'antd';
import { adminService } from '../../api/admin';
import ProductForm from '../../components/admin/ProductForm';

const { Title } = Typography;

const ProductCreate = () => {
  const navigate = useNavigate();

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await adminService.getAllCategories();
      return res.data?.categories || [];
    }
  });

  const mutation = useMutation({
    mutationFn: (formData) => adminService.addProduct(formData),
    onSuccess: () => {
      message.success('Product created successfully!');
      navigate('/admin/products');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to add product');
    }
  });

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Add New Product</Title>

      {catLoading ? (
        <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 100 }} />
      ) : (
        <ProductForm
          categories={catData || []}
          onSubmit={(formData) => mutation.mutate(formData)}
          loading={mutation.isPending}
          isEdit={false}
        />
      )}
    </div>
  );
};

export default ProductCreate;
