import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/admin';
import CouponForm from '../../components/admin/CouponForm';

const { Title } = Typography;

const CouponCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: adminService.addCoupon,
    onSuccess: (res) => {
      message.success(res.data?.message || 'Coupon created');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      navigate('/admin/coupons');
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to create coupon')
  });

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Create Coupon</Title>
      <Card>
        <CouponForm
          loading={createMutation.isPending}
          submitLabel="Create Coupon"
          onSubmit={(values) => createMutation.mutate(values)}
          onCancel={() => navigate('/admin/coupons')}
        />
      </Card>
    </div>
  );
};

export default CouponCreatePage;
