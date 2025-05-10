import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import AssetList from './components/AssetList';
import AddAssetModal from './components/AddAssetModal';
import EditAssetModal from './components/EditAssetModal';
import NotificationSystem from './components/NotificationSystem';
import { fetchAssets, searchAssets, addAsset, updateAsset, deleteAsset } from './services/api';

function App() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Load assets when component mounts
  useEffect(() => {
    loadAssets();
  }, []);

  // Load assets from API
  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await fetchAssets();
      setAssets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (term) => {
    setSearchTerm(term);
    setLoading(true);
    
    try {
      if (term.trim() === '') {
        await loadAssets();
        return;
      }
      
      const data = await searchAssets(term);
      setAssets(data);
      setError(null);
    } catch (err) {
      console.error('Error searching assets:', err);
      setError('Failed to search assets. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle add asset
  const handleAddAsset = async (newAsset) => {
    try {
      await addAsset(newAsset);
      await loadAssets();
      setShowAddModal(false);
      showNotification('Asset added successfully', 'success');
    } catch (err) {
      console.error('Error adding asset:', err);
      showNotification('Failed to add asset. Please try again.', 'error');
    }
  };

  // Handle edit asset
  const handleEditAsset = async (updatedAsset) => {
    try {
      await updateAsset(currentAsset.AssetID, updatedAsset);
      await loadAssets();
      setShowEditModal(false);
      showNotification('Asset updated successfully', 'success');
    } catch (err) {
      console.error('Error updating asset:', err);
      showNotification('Failed to update asset. Please try again.', 'error');
    }
  };

  // Handle delete asset
  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return;
    }
    
    try {
      await deleteAsset(assetId);
      await loadAssets();
      showNotification('Asset deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting asset:', err);
      showNotification('Failed to delete asset. Please try again.', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  // Open edit modal
  const openEditModal = (asset) => {
    setCurrentAsset(asset);
    setShowEditModal(true);
  };

  return (
    <div className="awsui-app-layout">
      <Header 
        assetCount={assets.length} 
        onSearch={handleSearch} 
        onAddClick={() => setShowAddModal(true)} 
      />
      
      <div className="awsui-app-layout__content">
        <div className="awsui-container">
          <main>
            <AssetList 
              assets={assets} 
              loading={loading} 
              error={error} 
              onEdit={openEditModal}
              onDelete={handleDeleteAsset}
            />
          </main>
        </div>
      </div>
      
      <footer className="awsui-app-layout__footer">
        <div className="awsui-footer-content">
          <div className="awsui-footer-logo">
            <p>&copy; 2025 Asset Demos - Powered by AWS</p>
          </div>
          <div className="awsui-footer-links">
            <a href="https://aws.amazon.com/dynamodb/" target="_blank" rel="noopener noreferrer">DynamoDB</a>
            <a href="https://aws.amazon.com/console/" target="_blank" rel="noopener noreferrer">AWS Console</a>
            <a href="https://aws.amazon.com/documentation/" target="_blank" rel="noopener noreferrer">Documentation</a>
          </div>
        </div>
      </footer>
      
      {showAddModal && (
        <AddAssetModal 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddAsset} 
        />
      )}
      
      {showEditModal && currentAsset && (
        <EditAssetModal 
          asset={currentAsset} 
          onClose={() => setShowEditModal(false)} 
          onSave={handleEditAsset} 
        />
      )}
      
      <NotificationSystem notifications={notifications} />
    </div>
  );
}

export default App;