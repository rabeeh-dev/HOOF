import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, message } from 'antd';
import { FaPlus } from 'react-icons/fa';
import { adminService } from '../../api/admin';
import ProductTable from '../../components/admin/ProductTable';
import SearchToolbar from '../../components/admin/SearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';

const { Title } = Typography;

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Query products
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, pageSize, search],
    queryFn: async () => {
      const res = await adminService.getProducts({ page, limit: pageSize, search });
      return res.data || { products: [], totalPages: 0, totalProducts: 0 };
    }
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: adminService.toggleProductStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      message.success(res.data?.message || 'Status updated');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to toggle status');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      message.success('Product deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to delete product');
      setDeleteTarget(null);
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Product Management</Title>
        <Button
          type="primary"
          icon={<FaPlus />}
          onClick={() => navigate('/admin/products/add')}
          style={{ background: '#001529', borderColor: '#001529', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Add Product
        </Button>
      </div>

      <SearchToolbar
        searchValue={search}
        onSearch={(val) => { setSearch(val); setPage(1); }}
        placeholder="Search by product name or brand..."
      />

      <ProductTable
        products={data?.products || []}
        loading={isLoading}
        currentPage={page}
        totalProducts={data?.totalProducts || 0}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onToggleStatus={(id) => toggleMutation.mutate(id)}
        onDelete={(id) => setDeleteTarget(id)}
        onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
      />

      <ConfirmDeleteModal
        visible={!!deleteTarget}
        title="Delete Product"
        description="Are you sure you want to permanently delete this product? This action cannot be undone."
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Products;
