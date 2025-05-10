import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the API service to prevent actual API calls during tests
jest.mock('./services/api', () => ({
  fetchAssets: jest.fn().mockResolvedValue([]),
  searchAssets: jest.fn().mockResolvedValue([]),
  addAsset: jest.fn().mockResolvedValue({}),
  updateAsset: jest.fn().mockResolvedValue({}),
  deleteAsset: jest.fn().mockResolvedValue({})
}));

describe('App Component', () => {
  test('renders with light grey background', () => {
    // Render the App component
    render(<App />);
    
    // Check that the main app layout has the correct background color
    const appLayout = document.querySelector('.awsui-app-layout');
    const computedStyle = window.getComputedStyle(appLayout);
    
    // The background-color should be rgba(224, 224, 224, 0.95) which is light grey with transparency
    expect(computedStyle.backgroundColor).toBe('rgba(224, 224, 224, 0.95)');
  });
});