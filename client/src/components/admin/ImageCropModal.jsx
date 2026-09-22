import React, { useState, useCallback } from 'react';
import { Modal, Slider, Button, Space, Typography } from 'antd';
import Cropper from 'react-easy-crop';
import { FaSearchMinus, FaSearchPlus, FaCropAlt } from 'react-icons/fa';

const { Text } = Typography;

/**
 * Creates a cropped image File object from canvas pixels.
 */
const createCroppedFile = async (imageSrc, pixelCrop, originalFileName = 'product.jpg') => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        // Preserve clean extension
        const cleanName = originalFileName.replace(/\.[^/.]+$/, '') + '-cropped.jpg';
        const file = new File([blob], cleanName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.95
    );
  });
};

const ImageCropModal = ({
  open,
  imageSrc,
  originalFileName,
  onCancel,
  onCropComplete,
  aspectRatio = 1, // 1:1 square for footwear standard
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsCropping(true);
      const croppedFile = await createCroppedFile(imageSrc, croppedAreaPixels, originalFileName);
      setIsCropping(false);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (err) {
      console.error('Failed to crop image:', err);
      setIsCropping(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FaCropAlt style={{ color: '#c41e3a' }} />
          <span>Crop Product Image (1:1 Square)</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={isCropping}>
          Cancel
        </Button>,
        <Button
          key="apply"
          type="primary"
          style={{ background: '#c41e3a', borderColor: '#c41e3a' }}
          onClick={handleApplyCrop}
          loading={isCropping}
        >
          Apply Crop
        </Button>,
      ]}
      width={520}
      destroyOnClose
    >
      <div style={{ position: 'relative', width: '100%', height: 350, background: '#1a1a1a', borderRadius: 8, overflow: 'hidden' }}>
        {imageSrc && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>

      <div style={{ marginTop: 16, padding: '0 8px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text orientation="left" style={{ fontSize: 13, color: '#666' }}>Zoom Adjust:</Text>
          <Space orientation="right">
            <FaSearchMinus style={{ color: '#888' }} />
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={setZoom}
              style={{ width: 180, margin: '0 8px' }}
            />
            <FaSearchPlus style={{ color: '#888' }} />
          </Space>
        </Space>
      </div>
    </Modal>
  );
};

export default ImageCropModal;
