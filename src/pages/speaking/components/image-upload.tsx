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
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
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

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
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
      console.log("Image uploaded successfully:", file);

      message.success("Image uploaded successfully!");

      // Clear progress after success
      setTimeout(() => {
        setUploadProgress(0);
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
    console.log("Opening preview for image:", image);
    setPreviewImage(image);
    setPreviewVisible(true);
    setPreviewTitle(`Image ${index + 1}`);
  };

  const handleDownload = (image: string, index: number) => {
    const link = document.createElement("a");
    link.href = image;
    link.download = `image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
            />
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text strong>Uploaded Images ({images.length})</Text>
            <Text type="secondary">Click on image to preview</Text>
          </div>

          <Row gutter={[16, 16]}>
            {images.map((image, imageIndex) => (
              <Col key={imageIndex} xs={24} sm={12} md={8} lg={6}>
                <Card
                  size="small"
                  className="image-preview-card"
                  bodyStyle={{ padding: "8px" }}
                  hoverable
                >
                  <div className="relative group">
                    {/* Main Image */}
                    <div className="image-container">
                      <Image
                        src={image}
                        alt={`Image ${imageIndex + 1}`}
                        width="100%"
                        height={150}
                        style={{
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        className="transition-transform duration-200 group-hover:scale-105"
                        onClick={() => handlePreview(image, imageIndex)}
                        preview={false}
                      />

                      {/* Overlay with actions */}
                      <div className="image-overlay">
                        <Space className="action-buttons">
                          <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(image, imageIndex);
                            }}
                            className="bg-white text-black hover:bg-gray-100 border-white"
                          >
                            Preview
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(image, imageIndex);
                            }}
                            className="bg-white text-black hover:bg-gray-100 border-white"
                          >
                            Download
                          </Button>
                          <Button
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(imageIndex);
                            }}
                            className="delete-button permanent"
                          />
                        </Space>
                      </div>
                    </div>

                    {/* Image info */}
                    <div className="image-info">
                      <Text className="text-xs text-gray-600">
                        Image {imageIndex + 1}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Full Screen Preview Modal */}
      <Image
        wrapperStyle={{ display: "none" }}
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
