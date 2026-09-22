import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, List, message, Space, Spin, Table, Tag, Typography } from 'antd';
import { adminService } from '../../api/admin';
import CustomerProfileCard from '../../components/admin/CustomerProfileCard';
import PaymentBadge from '../../components/admin/PaymentBadge';

const { Title, Text } = Typography;
const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: async () => {
      const res = await adminService.getCustomer(id);
      return res.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminService.toggleCustomerStatus(id, data.user.isBlocked ? 'unblock' : 'block'),
    onSuccess: () => {
      message.success('Customer status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-customer', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update customer status')
  });

  if (isLoading) return <Spin />;
  if (!data?.user) return <Text>Customer not found.</Text>;

  const orderColumns = [
    {
      title: 'Order',
      dataIndex: '_id',
      render: (orderId) => <Button type="link" onClick={() => navigate(`/admin/orders/${orderId}`)}>#{String(orderId).slice(-8).toUpperCase()}</Button>
    },
    { title: 'Date', dataIndex: 'createdAt', render: (date) => new Date(date).toLocaleDateString('en-IN') },
    { title: 'Total', dataIndex: 'totalAmount', render: formatMoney },
    { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
    { title: 'Payment', render: (_, order) => <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} /> }
  ];

  return (
    <div>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Customer Details</Title>
        <Space>
          <Button onClick={() => navigate('/admin/customers')}>Back</Button>
          <Button
            danger={!data.user.isBlocked}
            loading={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate()}
          >
            {data.user.isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </Space>
      </Space>

      <CustomerProfileCard customer={data.user} wallet={data.wallet} orderCount={data.orders?.length || 0} />

      <Title level={4} style={{ marginTop: 24 }}>Order History</Title>
      <Table
        columns={orderColumns}
        dataSource={(data.orders || []).map((order) => ({ ...order, key: order._id }))}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 820 }}
      />

      <Title level={4} style={{ marginTop: 24 }}>Wallet Transactions</Title>
      <List
        bordered
        dataSource={data.wallet?.transactions || []}
        locale={{ emptyText: 'No wallet transactions' }}
        renderItem={(tx) => (
          <List.Item>
            <List.Item.Meta
              title={<Tag color={tx.type === 'credit' ? 'green' : 'red'}>{tx.type}</Tag>}
              description={`${tx.description} · ${tx.date ? new Date(tx.date).toLocaleString('en-IN') : '-'}`}
            />
            <Text strong>{formatMoney(tx.amount)}</Text>
          </List.Item>
        )}
      />
    </div>
  );
};

export default CustomerDetailsPage;
