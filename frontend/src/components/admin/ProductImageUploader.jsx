import React, { useState, useEffect } from 'react';
import { Upload, Button, message } from 'antd';
import { FaUpload } from 'react-icons/fa';
import ImagePreview from './ImagePreview';

const ProductImageUploader = ({ existingImages = [], onImagesChange }) => {
  const [existing, setExisting] = useState(existingImages);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => { setExisting(existingImages); }, [existingImages]);

  useEffect(() => {
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [newFiles]);

  const totalCount = existing.length + newFiles.length;

  const handleRemoveExisting = (idx) => {
    const updated = existing.filter((_, i) => i !== idx);
    setExisting(updated);
    onImagesChange(newFiles, updated);
  };

  const handleRemoveNew = (idx) => {
    const updated = newFiles.filter((_, i) => i !== idx);
    setNewFiles(updated);
    onImagesChange(updated, existing);
  };

  const handleBeforeUpload = (file) => {
    if (totalCount >= 4) {
      message.warning('Maximum 4 images allowed.');
      return Upload.LIST_IGNORE;
    }
    const isValid = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic');
    if (!isValid) {
      message.error('Please upload image files only.');
      return Upload.LIST_IGNORE;
    }
    const updated = [...newFiles, file];
    setNewFiles(updated);
    onImagesChange(updated, existing);
    return false; // prevent auto upload
  };

  return (
    <div>
      {existing.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Existing Images</div>
          <ImagePreview images={existing} onRemove={handleRemoveExisting} />
        </div>
      )}

      {previews.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>New Images</div>
          <ImagePreview images={previews} onRemove={handleRemoveNew} />
        </div>
      )}

      {totalCount < 4 && (
        <Upload
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
          multiple
          accept="image/*,.heic"
        >
          <Button icon={<FaUpload style={{ marginRight: 6 }} />}>
            Upload Images ({totalCount}/4)
          </Button>
        </Upload>
      )}
    </div>
  );
};

export default ProductImageUploader;
