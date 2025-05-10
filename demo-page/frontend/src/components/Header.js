import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ assetCount, onSearch, onAddClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addButtonEnabled, setAddButtonEnabled] = useState(false);

  // Enable add button after a short delay (simulating the original behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAddButtonEnabled(false); // Changed to false to keep it disabled
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="awsui-app-layout__header">
      <header className="awsui-header">
        <div className="awsui-header-content">
          <div className="awsui-header-top">
            <div className="aws-logo">
            </div>
            <h1 className="awsui-header-title">
              Agent Demos <span id="assetCount">&nbsp;({assetCount})</span>
            </h1>
          </div>
          <div className="awsui-header-actions">
            <div className="search-container">
              <div className="awsui-input-container">
                <span className="awsui-input-icon">&#128269;</span>
                <input
                  type="text"
                  id="searchInput"
                  className="awsui-input"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                id="addAssetBtn"
                className="awsui-button awsui-button-primary"
                disabled={true} // Always disabled
                onClick={onAddClick}
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;