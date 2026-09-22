import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, message, Space, Typography } from 'antd';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/admin';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import CouponFilters from '../../components/admin/CouponFilters';
import CouponTable from '../../components/admin/CouponTable';

const { Title } = Typography;

const CouponsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState();
  const [discountType, setDiscountType] = useState();
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('descend');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const params = { page, limit: pageSize, search, status, discountType, sortBy, sortOrder };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', params],
    queryFn: async () => {
      const res = await adminService.getCoupons(params);
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCoupon,
    onSuccess: () => {
      message.success('Coupon deleted successfully');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to delete coupon')
  });

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleCouponStatus,
    onSuccess: (res) => {
      message.success(res.data?.message || 'Coupon status updated');
      setToggleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update coupon status')
  });

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Coupon Management</Title>
        <Button type="primary" icon={<FaPlus />} onClick={() => navigate('/admin/coupons/add')}>
          Create Coupon
        </Button>
      </Space>

      <CouponFilters
        search={search}
        status={status}
        discountType={discountType}
        onSearchChange={resetPage(setSearch)}
        onStatusChange={resetPage(setStatus)}
        onDiscountTypeChange={resetPage(setDiscountType)}
      />

      <CouponTable
        coupons={data?.coupons || []}
        loading={isLoading || deleteMutation.isPending || toggleMutation.isPending}
        currentPage={data?.pagination?.currentPage || page}
        totalCoupons={data?.pagination?.totalCoupons || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order || 'descend');
        }}
        onEdit={(id) => navigate(`/admin/coupons/edit/${id}`)}
        onDelete={setDeleteTarget}
        onToggleStatus={setToggleTarget}
      />

      <ConfirmationModal
        open={!!deleteTarget}
        title="Delete Coupon"
        description={`Delete ${deleteTarget?.couponCode || 'this coupon'}? This cannot be undone.`}
        confirmText="Delete"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmationModal
        open={!!toggleTarget}
        title={toggleTarget?.isBlocked ? 'Enable Coupon' : 'Disable Coupon'}
        description={`${toggleTarget?.isBlocked ? 'Enable' : 'Disable'} ${toggleTarget?.couponCode || 'this coupon'}?`}
        confirmText={toggleTarget?.isBlocked ? 'Enable' : 'Disable'}
        danger={!toggleTarget?.isBlocked}
        loading={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate(toggleTarget._id)}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
};

export default CouponsPage;
