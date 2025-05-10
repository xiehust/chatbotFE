import React, { useState, useEffect } from 'react';
import './Modal.css';

const AddAssetModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    Title: '',
    Description: '',
    DemoLink: '',
    LinkTitle: ''
  });

  // Add modal-open class to body when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.Title || !formData.Description || !formData.DemoLink) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create new asset object
    const newAsset = {
      Title: formData.Title,
      Description: formData.Description,
      DemoLink: formData.DemoLink,
      LinkTitle: formData.LinkTitle || formData.DemoLink // Use DemoLink as default if LinkTitle is empty
    };
    
    // Save the new asset
    onSave(newAsset);
  };

  return (
    <div className="awsui-modal">
      <div className="awsui-modal-overlay" onClick={onClose}></div>
      <div className="awsui-modal-content">
        <div className="awsui-modal-header">
          <h2 className="awsui-modal-title">Add New Asset</h2>
          <button className="awsui-modal-close close" onClick={onClose}>&times;</button>
        </div>
        <div className="awsui-modal-body">
          <form id="addAssetForm" onSubmit={handleSubmit}>
            <div className="awsui-form-field">
              <label htmlFor="Title" className="awsui-form-label">Title:</label>
              <input 
                type="text" 
                id="Title" 
                name="Title" 
                className="awsui-input" 
                value={formData.Title}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="awsui-form-field">
              <label htmlFor="Description" className="awsui-form-label">Description:</label>
              <textarea 
                id="Description" 
                name="Description" 
                className="awsui-textarea" 
                value={formData.Description}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div className="awsui-form-field">
              <label htmlFor="DemoLink" className="awsui-form-label">Demo Link:</label>
              <input 
                type="text" 
                id="DemoLink" 
                name="DemoLink" 
                className="awsui-input" 
                value={formData.DemoLink}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="awsui-form-field">
              <label htmlFor="LinkTitle" className="awsui-form-label">Link Title:</label>
              <input 
                type="text" 
                id="LinkTitle" 
                name="LinkTitle" 
                className="awsui-input" 
                placeholder="Text to display for the link"
                value={formData.LinkTitle}
                onChange={handleChange}
              />
            </div>
            <div className="awsui-modal-actions">
              <button type="submit" className="awsui-button awsui-button-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssetModal;