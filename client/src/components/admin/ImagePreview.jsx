import React from 'react';
import { FaTimes, FaCropAlt } from 'react-icons/fa';

const getImageUrl = (img) => {
  if (!img) return 'https://via.placeholder.com/80x80?text=No+Image';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  const backendBase = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
    : 'http://localhost:8080';
  return `${backendBase}${img.startsWith('/') ? img : '/' + img}`;
};

const ImagePreview = ({ images = [], onRemove, onCrop }) => {
  if (images.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
      {images.map((img, idx) => (
        <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
          <img
            src={getImageUrl(img)}
            alt={`preview-${idx}`}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #d9d9d9' }}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Error'; }}
          />
          {onCrop && (
            <button
              type="button"
              onClick={() => onCrop(idx)}
              title="Crop Image"
              style={{
                position: 'absolute', bottom: -6, right: -6, width: 22, height: 22,
                borderRadius: '50%', background: '#c41e3a', color: '#fff', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, padding: 0, zIndex: 2
              }}
            >
              <FaCropAlt />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              title="Remove Image"
              style={{
                position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                borderRadius: '50%', background: '#ff4d4f', color: '#fff', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, padding: 0, zIndex: 2
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImagePreview;
