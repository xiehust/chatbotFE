import React from 'react';
import './AssetCard.css';

const AssetCard = ({ asset, onEdit, onDelete }) => {
  return (
    <div className="asset-card">
      <div className="asset-title">
        {asset.Title}
      </div>
      <div className="description-label">Description</div>
      <div className="asset-description">{asset.Description}</div>
      <div className="demo-link-label">Demo Link</div>
      <div className="asset-link">
        <a href={asset.DemoLink} target="_blank" rel="noopener noreferrer">
          {asset.LinkTitle || asset.DemoLink}
        </a>
      </div>
      <div className="asset-actions" style={{ display: 'none' }}>
        <button 
          className="awsui-button awsui-button-secondary" 
          onClick={onEdit}
          disabled={true}
        >
          Edit
        </button>
        <button 
          className="awsui-button awsui-button-danger" 
          onClick={onDelete}
          disabled={true}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default AssetCard;