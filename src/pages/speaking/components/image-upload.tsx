import React, { useState } from "react";
import {
  Button,
  Upload,
  Image,
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Progress,
} from "antd";
import { UploadOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import "./image-upload.css";

const { Text } = Typography;

interface ImageUploadProps {
  images: string[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (imageIndex: number) => void;
  title?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onUpload,
  onRemove,
  title = "Images",
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentlyUploaded, setRecentlyUploaded] = useState<string[]>([]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await onUpload(file);
      setUploadProgress(100);
      
      // Add to recently uploaded for visual feedback
      const tempUrl = URL.createObjectURL(file);
      setRecentlyUploaded(prev => [...prev, tempUrl]);
      
      message.success("Image uploaded successfully!");
      
      // Clear progress after success
      setTimeout(() => {
        setUploadProgress(0);
        setRecentlyUploaded(prev => prev.filter(url => url !== tempUrl));
      }, 2000);
      
    } catch (error) {
      setUploadProgress(0);
      message.error("Failed to upload image");
    } finally {
      setUploading(false);
      clearInterval(progressInterval);
    }
  };

  const handlePreview = (image: string, index: number) => {
    setPreviewImage(image);
    setPreviewVisible(true);
    setPreviewTitle(`Image ${index + 1}`);
  };

  const handleDownload = (image: string, index: number) => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allImages = [...images, ...recentlyUploaded];

  return (
    <div className="image-upload-container">
      <label className="block text-sm font-medium mb-3">{title}</label>
      
      {/* Upload Button */}
      <div className="mb-4">
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => {
            handleUpload(file);
            return false;
          }}
          disabled={uploading}
        >
          <Button 
            icon={<UploadOutlined />} 
            size="large"
            loading={uploading}
            type="dashed"
            className="upload-area w-full h-20"
          >
            {uploading ? "Uploading..." : "Click to Upload Image"}
          </Button>
        </Upload>
        
        {/* Upload Progress */}
        {uploading && (
          <div className="mt-2">
            <Progress 
              percent={uploadProgress} 
              status={uploadProgress === 100 ? "success" : "active"}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        )}
      </div>
      
      {/* Image Preview Grid */}
      {allImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text strong>Uploaded Images ({images.length})</Text>
            <Text type="secondary">Click on image to preview</Text>
          </div>
          
          <Row gutter={[16, 16]}>
            {allImages.map((image, imageIndex) => {
              const isRecentlyUploaded = recentlyUploaded.includes(image);
              const actualIndex = imageIndex < images.length ? imageIndex : imageIndex - images.length;
              
              return (
                <Col key={imageIndex} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    className={`image-preview-card ${isRecentlyUploaded ? 'recently-uploaded' : ''}`}
                    bodyStyle={{ padding: '8px' }}
                    hoverable
                  >
                    <div className="relative group">
                      {/* Main Image */}
                      <div className="image-container">
                        <Image
                          src={image}
                          alt={`Image ${actualIndex + 1}`}
                          width="100%"
                          height={150}
                          style={{ 
                            objectFit: "cover",
                            cursor: "pointer"
                          }}
                          className="transition-transform duration-200 group-hover:scale-105"
                          onClick={() => handlePreview(image, actualIndex)}
                          preview={false}
                        />
                        
                        {/* Recently uploaded indicator */}
                        {isRecentlyUploaded && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                            <CheckCircleOutlined className="mr-1" />
                            New
                          </div>
                        )}
                        
                        {/* Overlay with actions */}
                        <div className="image-overlay">
                          <Space className="action-buttons">
                            <Button
                              type="primary"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handlePreview(image, actualIndex)}
                              className="bg-white text-black hover:bg-gray-100 border-white"
                            >
                              Preview
                            </Button>
                            {!isRecentlyUploaded && (
                              <>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  onClick={() => handleDownload(image, actualIndex)}
                                  className="bg-white text-black hover:bg-gray-100 border-white"
                                >
                                  Download
                                </Button>
                                <Button
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => onRemove(actualIndex)}
                                  className="bg-white hover:bg-red-50 border-white"
                                />
                              </>
                            )}
                          </Space>
                        </div>
                      </div>
                      
                      {/* Image info */}
                      <div className="image-info">
                        <Text className="text-xs text-gray-600">
                          Image {actualIndex + 1}
                          {isRecentlyUploaded && " (Uploading...)"}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {/* Full Screen Preview Modal */}
      <Image
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          title: previewTitle,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </div>
  );
}; 