import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Space, Typography } from 'antd';
import { userService } from '../api/user';
import FilterSidebar from '../components/FilterSidebar';
import SortDropdown from '../components/SortDropdown';
import SearchBar from '../components/SearchBar';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const { Title, Text } = Typography;

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search keyword state (local input state, committed to URL on search trigger)
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  // Extract filters from URL query parameters
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || null;
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = parseInt(searchParams.get('minPrice')) || 0;
  const maxPrice = parseInt(searchParams.get('maxPrice')) || 20000;
  const size = searchParams.get('size') || null;
  const page = parseInt(searchParams.get('page')) || 1;

  // Sync local search input if URL search changes externally
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Fetch Categories for FilterSidebar
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await userService.getCategories();
      return res.data?.categories || [];
    }
  });

  // Fetch Products using URL params
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['products', { search, category, sort, minPrice, maxPrice, size, page }],
    queryFn: async () => {
      const params = {
        page,
        sort,
        limit: 8
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (minPrice > 0) params.minPrice = minPrice;
      if (maxPrice < 20000) params.maxPrice = maxPrice;
      if (size) params.size = size;

      const res = await userService.getProducts(params);
      return res.data || { products: [], pagination: { total: 0, page: 1, pages: 1 } };
    }
  });

  // Helper helper to update URL parameters safely
  const updateParams = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    
    // Always reset to page 1 on filter changes
    if (!newParams.page) {
      nextParams.set('page', '1');
    }

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 0 || (key === 'maxPrice' && val === 20000)) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    setSearchParams(nextParams);
  };

  const handleCategoryChange = (catId) => updateParams({ category: catId });
  
  const handlePriceChange = (range) => updateParams({ minPrice: range[0], maxPrice: range[1] });
  
  const handleSizeChange = (s) => updateParams({ size: s });
  
  const handleSortChange = (s) => updateParams({ sort: s });
  
  const handleSearchTrigger = (val) => updateParams({ search: val.trim() });
  
  const handlePageChange = (p) => updateParams({ page: p });

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    setLocalSearch('');
  };

  const products = productsData?.products || [];
  const totalProducts = productsData?.pagination?.total || 0;
  const itemsPerPage = productsData?.pagination?.limit || 8;

  return (
    <div>
      {/* Search and Sort row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Shop Footwear</Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Showing {products.length} of {totalProducts} items
          </Text>
        </div>
        
        <Space size="middle" style={{ flexWrap: 'wrap' }}>
          <SearchBar 
            value={localSearch}
            onChange={setLocalSearch}
            onSearch={handleSearchTrigger}
          />
          <SortDropdown 
            value={sort}
            onChange={handleSortChange}
          />
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Sidebar Column */}
        <Col xs={24} md={8} lg={6}>
          <FilterSidebar
            categories={categories}
            selectedCategory={category}
            priceRange={[minPrice, maxPrice]}
            selectedSize={size}
            onChangeCategory={handleCategoryChange}
            onChangePrice={handlePriceChange}
            onChangeSize={handleSizeChange}
            onClear={handleResetFilters}
          />
        </Col>

        {/* Catalog Items Column */}
        <Col xs={24} md={16} lg={18}>
          {isLoading ? (
            <LoadingSkeleton count={4} />
          ) : isError || products.length === 0 ? (
            <EmptyState onReset={handleResetFilters} />
          ) : (
            <>
              <ProductGrid products={products} />
              
              <Pagination
                current={page}
                total={totalProducts}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
              />
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Shop;
