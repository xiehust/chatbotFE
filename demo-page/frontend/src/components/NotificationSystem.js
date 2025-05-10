import React from 'react';
import './NotificationSystem.css';

const NotificationSystem = ({ notifications }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="awsui-notifications">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`awsui-notification awsui-notification-${notification.type}`}
        >
          <div className="awsui-notification-content">
            <span>{notification.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;