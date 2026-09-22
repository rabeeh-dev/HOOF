import React, { useState, useEffect } from 'react';
import { Card } from 'antd';

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/600x400?text=HOOF+Footwear';
  if (image.startsWith('http')) return image;
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  return `http://localhost:8080${cleanPath}`;
};

const ProductGallery = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = useState(images[0] || '');

  // Reset selected image if images prop changes
  useEffect(() => {
    if (images && images.length > 0) {
      setSelectedImage(images[0]);
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <Card style={{ background: '#e9ecef', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', borderRadius: 8 }}>
        No Images Available
      </Card>
    );
  }

  return (
    <div>
      {/* Main Image View */}
      <Card 
        bodyStyle={{ padding: 0 }}
        style={{ 
          background: '#fff', 
          height: 380, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRadius: 8, 
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <img 
          src={getImageUrl(selectedImage)} 
          alt="Product details" 
          style={{ width: '100%', height: 380, objectFit: 'contain', padding: 20 }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/600x400?text=HOOF+Footwear';
          }}
        />
      </Card>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16, overflowX: 'auto', paddingBottom: 6 }}>
          {images.map((img, idx) => {
            const isSelected = selectedImage === img;
            return (
              <div 
                key={idx}
                onClick={() => setSelectedImage(img)}
                style={{ 
                  width: 70, 
                  height: 70, 
                  borderRadius: 6, 
                  overflow: 'hidden', 
                  border: isSelected ? '2px solid #c41e3a' : '1px solid #d9d9d9',
                  cursor: 'pointer',
                  background: '#fff',
                  flexShrink: 0
                }}
              >
                <img 
                  src={getImageUrl(img)} 
                  alt={`Thumbnail ${idx + 1}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/70x70?text=Footwear';
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
