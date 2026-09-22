import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Button, message } from 'antd';
import { FaPlus } from 'react-icons/fa';
import { adminService } from '../../api/admin';
import CategoryTable from '../../components/admin/CategoryTable';
import CategoryForm from '../../components/admin/CategoryForm';
import SearchToolbar from '../../components/admin/SearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';

const { Title } = Typography;

const Categories = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Query categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories', page, pageSize, search],
    queryFn: async () => {
      const res = await adminService.getCategories({ page, limit: pageSize, search });
      return res.data || { categories: [], totalPages: 0, totalCategories: 0 };
    }
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: adminService.addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      message.success('Category added successfully');
      setFormVisible(false);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to add category');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      message.success('Category updated successfully');
      setFormVisible(false);
      setEditTarget(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to update category');
    }
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: adminService.toggleCategoryStatus,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      message.success(res.data?.message || 'Status updated');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to toggle status');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      message.success('Category deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to delete category');
      setDeleteTarget(null);
    }
  });

  const handleFormSubmit = (formData) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (category) => {
    setEditTarget(category);
    setFormVisible(true);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setFormVisible(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Category Management</Title>
        <Button
          type="primary"
          icon={<FaPlus />}
          onClick={handleAdd}
          style={{ background: '#001529', borderColor: '#001529', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Add Category
        </Button>
      </div>

      <SearchToolbar
        searchValue={search}
        onSearch={(val) => { setSearch(val); setPage(1); }}
        placeholder="Search by category name..."
      />

      <CategoryTable
        categories={data?.categories || []}
        loading={isLoading}
        currentPage={page}
        totalCategories={data?.totalCategories || 0}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onToggleStatus={(id) => toggleMutation.mutate(id)}
        onDelete={(id) => setDeleteTarget(id)}
        onEdit={handleEdit}
      />

      <CategoryForm
        visible={formVisible}
        initialValues={editTarget}
        onSubmit={handleFormSubmit}
        onCancel={() => { setFormVisible(false); setEditTarget(null); }}
        loading={addMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDeleteModal
        visible={!!deleteTarget}
        title="Delete Category"
        description="Are you sure you want to delete this category? Products using this category will be affected."
        onConfirm={() => deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Categories;
