# GenAI Asset Demos

A simple web application for displaying asset demos. This application allows users to view assets from an Amazon DynamoDB database.

## Features

- Display assets in a card-based layout
- Search assets by title
- Responsive design

## Technology Stack

- **Frontend**: React.js
- **Backend**: Flask (Python)
- **Database**: Amazon DynamoDB
- **Styling**: Custom CSS with Cloudscape Design System inspiration

## Project Structure

To be added

## Setup Instructions

### Prerequisites

- Python 3.6 or higher
- pip (Python package manager)
- Node.js and npm (for React frontend)
- Amazon AWS account (for DynamoDB)
- AWS CLI configured (optional)


### Running the Application

All required packages are pre-installed so you can start the app directly with following steps. 
However, some env variables are configured in start_backend.sh, so you may need to modify the file.

1. Start the Flask backend:
   ```
   cd demo-page/backend
   bash start_backend.sh
   ```

2. In a separate terminal, start the React development server:
   ```
   cd demo-page/frontend
   npm start
   ```

3. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

- `GET /api/assets` - Get all assets
- `GET /api/assets/search?title=keyword` - Search assets by title
- `GET /api/assets/<asset_id>` - Get a specific asset
- `POST /api/assets` - Create a new asset
- `PUT /api/assets/<asset_id>` - Update an asset
- `DELETE /api/assets/<asset_id>` - Delete an asset

## Database Schema

The DynamoDB table has the following attributes:

- `AssetID` (String, Primary Key): A randomly generated 6-digit string
- `Title` (String): The title of the asset
- `Description` (String): A detailed description of the asset
- `DemoLink` (String): URL link to the demo
- `LinkTitle` (String): Display text for the demo link
