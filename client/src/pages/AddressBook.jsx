import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Typography, Spin, Card, message } from 'antd';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { addressService } from '../api/address';
import AddressCard from '../components/AddressCard';
import AddressForm from '../components/AddressForm';

const { Title, Paragraph } = Typography;

const AddressBook = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Query addresses
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await addressService.getAddresses();
      return res.data?.addresses || [];
    }
  });

  // Add/Edit mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingAddress) {
        return addressService.editAddress(editingAddress._id, formData);
      } else {
        return addressService.addAddress(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      message.success(editingAddress ? 'Address updated!' : 'Address added!');
      setAddressModalVisible(false);
      setEditingAddress(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to save address.');
    }
  });

  // Delete mutation
  const deleteAddressMutation = useMutation({
    mutationFn: addressService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      message.success('Address deleted.');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to delete address.');
    }
  });

  const handleAddressSubmit = (formData) => {
    setSubmitting(true);
    saveAddressMutation.mutate(formData, {
      onSettled: () => setSubmitting(false)
    });
  };

  const handleEditClick = (address) => {
    setEditingAddress(address);
    setAddressModalVisible(true);
  };

  const handleDeleteClick = (id) => {
    deleteAddressMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading address book..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Address Book</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            Manage your delivery and shipping address entries.
          </Paragraph>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            type="primary" 
            icon={<FaPlus />} 
            onClick={() => { setEditingAddress(null); setAddressModalVisible(true); }}
            style={{ background: '#c41e3a', borderColor: '#c41e3a', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Add Address
          </Button>
          <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Back
          </Button>
        </div>
      </div>

      {addresses.length > 0 ? (
        <Row gutter={[24, 24]}>
          {addresses.map((address) => (
            <Col xs={24} sm={12} md={8} key={address._id}>
              <AddressCard
                address={address}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 8 }}>
          <Paragraph type="secondary" style={{ fontSize: '14px', marginBottom: 15 }}>
            No addresses found in your profile.
          </Paragraph>
          <Button 
            type="primary" 
            icon={<FaPlus />} 
            onClick={() => { setEditingAddress(null); setAddressModalVisible(true); }}
            style={{ background: '#c41e3a', borderColor: '#c41e3a' }}
          >
            Add First Address
          </Button>
        </Card>
      )}

      {/* Address Form modal popup */}
      <AddressForm
        visible={addressModalVisible}
        initialValues={editingAddress}
        onSubmit={handleAddressSubmit}
        onCancel={() => { setAddressModalVisible(false); setEditingAddress(null); }}
        loading={submitting}
      />
    </div>
  );
};

export default AddressBook;
