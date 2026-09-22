import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input, message, Select, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/admin';
import CustomerTable from '../../components/admin/CustomerTable';

const { Title } = Typography;

const CustomersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState();
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('descend');

  const params = { page, limit: pageSize, search, status, sortBy, sortOrder };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', params],
    queryFn: async () => {
      const res = await adminService.getCustomers(params);
      return res.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (customer) => adminService.toggleCustomerStatus(customer._id, customer.isBlocked ? 'unblock' : 'block'),
    onSuccess: () => {
      message.success('Customer status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update customer status')
  });

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Customer Management</Title>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Search name, email, phone"
          style={{ width: 300 }}
        />
        <Select
          allowClear
          value={status}
          onChange={(value) => { setStatus(value); setPage(1); }}
          placeholder="Customer status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'blocked', label: 'Blocked' }
          ]}
          style={{ width: 180 }}
        />
      </Space>

      <CustomerTable
        customers={data?.users || []}
        loading={isLoading || toggleMutation.isPending}
        currentPage={data?.pagination?.currentPage || page}
        totalCustomers={data?.pagination?.totalUsers || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order || 'descend');
        }}
        onView={(customer) => navigate(`/admin/customers/${customer._id}`)}
        onToggleStatus={(customer) => toggleMutation.mutate(customer)}
      />
    </div>
  );
};

export default CustomersPage;
