/**
 * API service for interacting with the backend
 * This file contains functions for fetching, searching, adding, updating, and deleting assets
 */

// Base URL for API requests
const API_BASE_URL = '/api';

/**
 * Fetch all assets from the API
 * @returns {Promise<Array>} Promise that resolves to an array of assets
 */
export const fetchAssets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

/**
 * Search assets by title
 * @param {string} searchTerm - The search term to filter assets by title
 * @returns {Promise<Array>} Promise that resolves to an array of filtered assets
 */
export const searchAssets = async (searchTerm) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/search?title=${encodeURIComponent(searchTerm)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching assets:', error);
    throw error;
  }
};

/**
 * Add a new asset
 * @param {Object} asset - The asset object to add
 * @returns {Promise<Object>} Promise that resolves to the newly created asset
 */
export const addAsset = async (asset) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asset),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding asset:', error);
    throw error;
  }
};

/**
 * Update an existing asset
 * @param {string} assetId - The ID of the asset to update
 * @param {Object} updatedAsset - The updated asset data
 * @returns {Promise<Object>} Promise that resolves to the updated asset
 */
export const updateAsset = async (assetId, updatedAsset) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedAsset),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
};

/**
 * Delete an asset
 * @param {string} assetId - The ID of the asset to delete
 * @returns {Promise<Object>} Promise that resolves to the response message
 */
export const deleteAsset = async (assetId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
};