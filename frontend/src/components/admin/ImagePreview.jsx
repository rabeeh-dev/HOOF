import React from 'react';
import { FaTimes } from 'react-icons/fa';

const getImageUrl = (img) => {
  if (!img) return 'https://via.placeholder.com/80x80?text=No+Image';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  return `http://localhost:8080${img.startsWith('/') ? img : '/' + img}`;
};

const ImagePreview = ({ images = [], onRemove }) => {
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
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              style={{
                position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                borderRadius: '50%', background: '#ff4d4f', color: '#fff', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, padding: 0
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
