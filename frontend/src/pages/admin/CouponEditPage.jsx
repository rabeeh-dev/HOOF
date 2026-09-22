import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, message, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../api/admin';
import CouponForm from '../../components/admin/CouponForm';

const { Title, Text } = Typography;

const CouponEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['admin-coupon', id],
    queryFn: async () => {
      const res = await adminService.getCoupon(id);
      return res.data.coupon;
    }
  });

  const updateMutation = useMutation({
    mutationFn: (values) => adminService.updateCoupon(id, values),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Coupon updated');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-coupon', id] });
      navigate('/admin/coupons');
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update coupon')
  });

  if (isLoading) return <Spin />;
  if (!coupon) return <Text>Coupon not found.</Text>;

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Edit Coupon</Title>
      <Card>
        <CouponForm
          initialValues={coupon}
          loading={updateMutation.isPending}
          submitLabel="Update Coupon"
          onSubmit={(values) => updateMutation.mutate(values)}
          onCancel={() => navigate('/admin/coupons')}
        />
      </Card>
    </div>
  );
};

export default CouponEditPage;
