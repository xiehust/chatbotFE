import React from 'react';
import AssetCard from './AssetCard';
import './AssetList.css';

const AssetList = ({ assets, loading, error, onEdit, onDelete }) => {
  if (loading) {
    return <div className="awsui-loading">Loading assets...</div>;
  }

  if (error) {
    return <div className="awsui-error-message">{error}</div>;
  }

  if (assets.length === 0) {
    return <div className="awsui-loading">No assets found.</div>;
  }

  return (
    <div id="assetsList" className="awsui-cards-container">
      {assets.map((asset) => (
        <AssetCard 
          key={asset.AssetID} 
          asset={asset} 
          onEdit={() => onEdit(asset)} 
          onDelete={() => onDelete(asset.AssetID)} 
        />
      ))}
    </div>
  );
};

export default AssetList;