import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Space } from 'antd';
import { FaUpload, FaCropAlt } from 'react-icons/fa';
import ImagePreview from './ImagePreview';
import ImageCropModal from './ImageCropModal';

const ProductImageUploader = ({ existingImages = [], onImagesChange }) => {
  const [existing, setExisting] = useState(existingImages);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [croppingTarget, setCroppingTarget] = useState(null); // { file, src, index, isReCrop }
  const [pendingQueue, setPendingQueue] = useState([]); // queue of files to crop if multiple selected

  useEffect(() => {
    setExisting(existingImages);
  }, [existingImages]);

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

  const startCroppingNext = (queue, currentNewFiles = newFiles) => {
    if (queue.length === 0) {
      setCroppingTarget(null);
      setCropModalOpen(false);
      return;
    }

    const [nextFile, ...restQueue] = queue;
    setPendingQueue(restQueue);
    const src = URL.createObjectURL(nextFile);
    setCroppingTarget({
      file: nextFile,
      src,
      name: nextFile.name,
      isReCrop: false,
    });
    setCropModalOpen(true);
  };

  const handleBeforeUpload = (file, fileList) => {
    if (totalCount >= 4) {
      message.warning('Maximum 4 images allowed.');
      return Upload.LIST_IGNORE;
    }

    const isValid = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic');
    if (!isValid) {
      message.error('Please upload image files only.');
      return Upload.LIST_IGNORE;
    }

    // Filter valid files up to the remaining capacity
    const remainingSlots = 4 - totalCount;
    const filesToQueue = fileList
      .filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'))
      .slice(0, remainingSlots);

    // If already cropping, don't interrupt; otherwise kick off the first
    if (!cropModalOpen && filesToQueue.length > 0) {
      startCroppingNext(filesToQueue);
    }

    return false; // prevent auto-upload
  };

  const handleCropComplete = (croppedFile) => {
    if (croppingTarget?.isReCrop) {
      // Replace the specific file at index
      const updated = [...newFiles];
      updated[croppingTarget.index] = croppedFile;
      setNewFiles(updated);
      onImagesChange(updated, existing);
      message.success('Image re-cropped successfully!');
      setCropModalOpen(false);
      setCroppingTarget(null);
    } else {
      // Append newly cropped file
      const updated = [...newFiles, croppedFile];
      setNewFiles(updated);
      onImagesChange(updated, existing);
      message.success('Image cropped & added!');

      // Process next in queue if any
      if (pendingQueue.length > 0) {
        startCroppingNext(pendingQueue, updated);
      } else {
        setCropModalOpen(false);
        setCroppingTarget(null);
      }
    }
  };

  const handleReCrop = (idx) => {
    const file = newFiles[idx];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setCroppingTarget({
      file,
      src,
      name: file.name,
      index: idx,
      isReCrop: true,
    });
    setCropModalOpen(true);
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
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
            New Images (Click crop icon to re-crop)
          </div>
          <ImagePreview
            images={previews}
            onRemove={handleRemoveNew}
            onCrop={handleReCrop}
          />
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
            Upload & Crop Images ({totalCount}/4)
          </Button>
        </Upload>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        imageSrc={croppingTarget?.src}
        originalFileName={croppingTarget?.name || 'product.jpg'}
        onCancel={() => {
          setCropModalOpen(false);
          setCroppingTarget(null);
          setPendingQueue([]);
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </div>
  );
};

export default ProductImageUploader;
